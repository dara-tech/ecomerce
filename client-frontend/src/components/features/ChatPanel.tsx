"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Headphones } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

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

type ChatPanelProps = {
  variant?: "page" | "widget";
  className?: string;
};

export default function ChatPanel({ variant = "page", className }: ChatPanelProps) {
  const { t } = useStore();
  const { user } = useAuth();
  const {
    messages,
    isAdminTyping,
    sendMessage,
    setIsChatOpen,
    lastSeenByAdmin,
  } = useChat();

  const [message, setMessage] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const isPage = variant === "page";
  const lastTypingSentRef = useRef<number>(0);

  const sessionId = getOrCreateSessionId(user?._id);

  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, [setIsChatOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (val: string) => {
    setMessage(val);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      fetch(`${getApiUrl()}/chat/typing`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, role: "user" }),
      }).catch((err) => console.error(err));
    }
  };

  const send = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    await sendMessage(text);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isPage ? "min-h-0 flex-1" : "h-full max-h-[min(420px,60dvh)]",
        className
      )}
    >

      <div
        ref={listRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 touch-pan-y no-scrollbar",
          isPage
            ? "min-h-0 pb-[calc(var(--mobile-chat-composer-h)+var(--mobile-tab-bar-h))] md:pb-2"
            : "max-h-64"
        )}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.from === "user";
          const isLast = idx === messages.length - 1;
          return (
            <div key={msg._id || msg.id || idx} className="space-y-0.5">
              <div
                className={cn(
                  "flex",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.text}
                </div>
              </div>
              {isLast && isUser && (
                <div className="flex justify-end pr-1.5 mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {lastSeenByAdmin && new Date(lastSeenByAdmin).getTime() >= new Date(msg.createdAt || Date.now()).getTime() ? (
                      "Seen"
                    ) : (
                      "Sent"
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {isAdminTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-muted text-muted-foreground px-3.5 py-2.5 text-[12px] rounded-2xl flex items-center gap-1.5 font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              Support agent is typing...
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          isPage
            ? "mobile-dock-above-tabs md:relative md:inset-x-auto md:bottom-auto md:z-auto md:bg-transparent md:pb-0"
            : "shrink-0 border-t border-border/60 bg-background p-3"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-lg items-center gap-2.5 md:max-w-none",
            isPage && "border-t border-border/60 px-4 py-3 md:border-t-0 md:px-3 md:py-3"
          )}
        >
          <input
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("chatPlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:bg-background"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={send}
            disabled={!message.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
