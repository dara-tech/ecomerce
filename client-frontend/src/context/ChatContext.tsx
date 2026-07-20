"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getApiUrl } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { useWebRTC, CallState } from "@/hooks/useWebRTC";

export type ChatMessage = {
  _id?: string;
  id?: string;
  from: "user" | "bot" | "admin";
  text: string;
  createdAt?: string;
  at?: number;
};

const SESSION_KEY = "luna_chat_session_id";

function getOrCreateSessionId(userId?: string): string {
  if (typeof window === "undefined") return "guest";
  if (userId) return userId;
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = "guest_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

interface ChatContextType {
  messages: ChatMessage[];
  unreadCount: number;
  isAdminTyping: boolean;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  fetchMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  markAsSeen: () => Promise<void>;
  notifyTyping: () => void;
  lastSeenByAdmin: string | null;
  adminTypingUntil: string | null;
  
  // WebRTC
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  makeCall: (withVideo?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastSeenByAdmin, setLastSeenByAdmin] = useState<string | null>(null);
  const [adminTypingUntil, setAdminTypingUntil] = useState<string | null>(null);

  const sessionId = getOrCreateSessionId(user?._id);

  const stateRef = useRef({
    token: user?.token,
    sessionId,
    messagesLength: messages.length,
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const webrtc = useWebRTC(socket, sessionId, 'user');

  useEffect(() => {
    stateRef.current = {
      token: user?.token,
      sessionId,
      messagesLength: messages.length,
    };
  }, [user?.token, sessionId, messages.length]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (err) {
      console.warn("Audio play blocked:", err);
    }
  };

  const fetchMessages = useCallback(async () => {
    const { token, sessionId, messagesLength } = stateRef.current;
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${getApiUrl()}/chat/${sessionId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        
        if (data.messages && data.messages.length > 0) {
          // Play sound on new admin message
          if (messagesLength > 0 && data.messages.length > messagesLength) {
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg && lastMsg.from === "admin") {
              playNotificationSound();
            }
          }
          setMessages(data.messages);
        } else if (messagesLength === 0) {
          setMessages([{ id: "welcome", from: "bot", text: "Hi! How can we help you today?" }]);
        }

        if (data.lastSeenByAdmin !== undefined) setLastSeenByAdmin(data.lastSeenByAdmin);
        if (data.adminTypingUntil !== undefined) {
          setAdminTypingUntil(data.adminTypingUntil);
          setIsAdminTyping(new Date(data.adminTypingUntil).getTime() > Date.now());
        }

        // Calculate unreadCount: messages from admin that are created after lastSeenByUser
        const lastSeen = data.lastSeenByUser ? new Date(data.lastSeenByUser).getTime() : 0;
        const unread = (data.messages || []).filter(
          (m: any) => m.from === "admin" && new Date(m.createdAt).getTime() > lastSeen
        ).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      console.error("Failed to fetch chat:", e);
    }
  }, []);

  const markAsSeen = useCallback(async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      await fetch(`${getApiUrl()}/chat/seen`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, role: "user" }),
      });
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }, [sessionId, user?.token]);

  const sendMessage = useCallback(async (text: string) => {
    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text, at: Date.now() },
    ]);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${getApiUrl()}/chat/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          text,
          guestName: user ? user.name : "Guest",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }

      if (socketRef.current && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('stop_typing', { sessionId, role: 'user' });
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }, [sessionId, user]);

  const notifyTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { sessionId, role: 'user' });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop_typing', { sessionId, role: 'user' });
      }, 2000);
    }
  }, [sessionId]);

  // Handle socket.io connection
  useEffect(() => {
    fetchMessages();
    
    const rawSocketUrl = getApiUrl().replace('/api', '');
    const socketUrl = rawSocketUrl === '' 
      ? (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5001' : '') 
      : rawSocketUrl;

    const socket = io(socketUrl, {
      transports: ['websocket'],
    });
    
    socket.on('connect', () => {
      socket.emit('join_session', sessionId);
    });

    socket.on('receive_message', (updatedMessages) => {
      setMessages(updatedMessages);
      
      // Play sound if last message is from admin
      if (updatedMessages.length > 0) {
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        if (lastMsg.from === "admin") {
          playNotificationSound();
        }
      }
    });

    socket.on('typing', ({ role }: { role: string }) => {
      if (role === 'admin') setIsAdminTyping(true);
    });

    socket.on('stop_typing', ({ role }: { role: string }) => {
      if (role === 'admin') setIsAdminTyping(false);
    });

    socket.on('seen_update', (data: any) => {
      if (data.lastSeenByAdmin !== undefined) {
        setLastSeenByAdmin(data.lastSeenByAdmin);
      }
    });

    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [fetchMessages, sessionId]);

  // Keep isAdminTyping active if expiration hasn't passed (legacy for polling, keeping it just in case)
  useEffect(() => {
    if (!adminTypingUntil) return;
    const checkTyping = () => {
      const isTyping = new Date(adminTypingUntil).getTime() > Date.now();
      if (isTyping) setIsAdminTyping(true);
    };
    checkTyping();
    const interval = setInterval(checkTyping, 1000);
    return () => clearInterval(interval);
  }, [adminTypingUntil]);

  // Mark as seen when chat becomes open
  useEffect(() => {
    if (isChatOpen && messages.length > 0) {
      markAsSeen();
    }
  }, [isChatOpen, messages.length, markAsSeen]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        unreadCount,
        isAdminTyping,
        isChatOpen,
        setIsChatOpen,
        fetchMessages,
        sendMessage,
        markAsSeen,
        notifyTyping,
        lastSeenByAdmin,
        adminTypingUntil,
        ...webrtc,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
