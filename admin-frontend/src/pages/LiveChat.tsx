import { useState, useEffect, useRef } from 'react';
import { getApiBase } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns'; // date-fns helper
import { Loader2, Send, MessageCircle, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  PAGE_TABLE_PANEL_CLASS,
  PAGE_PRIMARY_BTN_CLASS,
  PAGE_INPUT_CLASS
} from '../lib/pageToolbar';

type ChatMessage = {
  _id?: string;
  from: 'user' | 'admin' | 'bot';
  text: string;
  createdAt: string;
};

type ChatSession = {
  _id: string;
  sessionId: string;
  guestName: string;
  status: string;
  updatedAt: string;
  messages: ChatMessage[];
  user?: { name: string; email: string; avatar?: string };
  lastSeenByUser?: string;
  lastSeenByAdmin?: string;
  userTypingUntil?: string;
  adminTypingUntil?: string;
};

export default function LiveChat() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'members' | 'guests'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionsRef = useRef<ChatSession[]>([]);
  const lastTypingSentRef = useRef<number>(0);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'); // Subtle chime
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (err) {
      console.warn('Audio play blocked or failed:', err);
    }
  };

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/chat/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        
        // Notify on new user messages
        if (prevSessionsRef.current.length > 0) {
          data.forEach((newS: ChatSession) => {
            const oldS = prevSessionsRef.current.find(s => s.sessionId === newS.sessionId);
            const newCount = newS.messages.length;
            const oldCount = oldS ? oldS.messages.length : 0;
            if (newCount > oldCount) {
              const lastMsg = newS.messages[newCount - 1];
              if (lastMsg && lastMsg.from === 'user') {
                if (newS.sessionId !== activeSessionId || document.hidden) {
                  playNotificationSound();
                  toast.info(`New message from ${newS.user?.name || newS.guestName || 'Guest'}`);
                }
              }
            }
          });
        }

        setSessions(data);
        prevSessionsRef.current = data;
        if (data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].sessionId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [token, activeSessionId]);

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);
  const messagesCount = activeSession?.messages?.length || 0;

  useEffect(() => {
    if (activeSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesCount, activeSessionId]);

  // Mark session as seen by admin
  const markAsSeen = async (sessId: string) => {
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/chat/seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: sessId, role: 'admin' }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      markAsSeen(activeSessionId);
    }
  }, [activeSessionId, messagesCount]);

  const handleInputChange = (val: string) => {
    setReplyText(val);
    if (!token || !activeSessionId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      fetch(`${getApiBase()}/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: activeSessionId, role: 'admin' }),
      }).catch(err => console.error(err));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeSessionId || !token) return;

    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/chat/admin/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: activeSessionId, text: replyText }),
      });

      if (res.ok) {
        setReplyText('');
        fetchSessions(); // Refresh immediately
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (sessId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this chat session?')) return;
    try {
      const res = await fetch(`${getApiBase()}/chat/admin/session/${sessId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Chat session deleted');
        if (activeSessionId === sessId) {
          setActiveSessionId(null);
        }
        fetchSessions();
      } else {
        toast.error('Failed to delete chat session');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const getInitials = (name: string) => {
    const clean = (name || '').trim();
    if (!clean) return '?';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isUserTyping = activeSession?.userTypingUntil && new Date(activeSession.userTypingUntil).getTime() > Date.now();
  const isActiveSessionOnline = activeSession?.lastSeenByUser && (Date.now() - new Date(activeSession.lastSeenByUser).getTime()) < 10000;

  const filteredSessions = sessions.filter((s) => {
    const displayName = (s.user?.name || s.guestName || '').toLowerCase();
    const email = (s.user?.email || '').toLowerCase();
    const matchesSearch = displayName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const isOnline = s.lastSeenByUser && (Date.now() - new Date(s.lastSeenByUser).getTime()) < 10000;

    switch (filterType) {
      case 'online': return !!isOnline;
      case 'members': return !!s.user;
      case 'guests': return !s.user;
      default: return true;
    }
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn(PAGE_TABLE_PANEL_CLASS, "flex-row h-full rounded-none border-0 shadow-none")}>
        {/* Sidebar: Session List */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border/80 bg-muted/20">
          <div className="border-b border-border/80 bg-muted/40 p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[13px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> Active Chats
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                {filteredSessions.length}
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or email..."
                className={cn(PAGE_INPUT_CLASS, "h-8 text-[11px] pl-8 pr-2.5 w-full")}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 border-t border-border/40 pt-2 text-[8px] font-bold uppercase tracking-wider">
              {(['all', 'online', 'members', 'guests'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "flex-1 py-1 text-center transition-colors rounded-none border border-transparent",
                    filterType === type 
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs" 
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/65 border-border/40"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-muted-foreground">
                No active chats found.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const lastMsg = s.messages[s.messages.length - 1];
                const isActive = s.sessionId === activeSessionId;
                const displayName = s.user?.name || s.guestName || 'Guest';
                const isMember = !!s.user;
                const isOnline = s.lastSeenByUser && (Date.now() - new Date(s.lastSeenByUser).getTime()) < 10000;
                
                // Calculate if session is unread for admin
                const isUnread = lastMsg && lastMsg.from === 'user' && (!s.lastSeenByAdmin || new Date(lastMsg.createdAt).getTime() > new Date(s.lastSeenByAdmin).getTime());

                return (
                  <button
                    key={s._id}
                    onClick={() => setActiveSessionId(s.sessionId)}
                    className={cn(
                      'w-full border-b border-border/60 p-3 text-left transition-colors rounded-none flex gap-3 items-center',
                      isActive 
                        ? 'bg-primary/10 border-l-[3px] border-l-primary pl-[9px]' 
                        : 'hover:bg-muted/40 border-l-[3px] border-l-transparent'
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={cn(
                        "size-8 flex items-center justify-center rounded-none text-[10px] font-bold border overflow-hidden",
                        isActive 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted text-muted-foreground border-border/80"
                      )}>
                        {s.user?.avatar ? (
                          <img src={s.user.avatar} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(displayName)
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn(
                          "text-[12px] truncate", 
                          isActive ? "text-primary font-bold" : "text-foreground",
                          isUnread ? "font-extrabold" : "font-semibold"
                        )}>
                          {displayName}
                        </span>
                        <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                          {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "truncate text-[11px] flex-1", 
                          isUnread ? "text-foreground font-bold" : "text-muted-foreground font-medium"
                        )}>
                          {lastMsg ? lastMsg.text : 'No messages'}
                        </p>
                        {isUnread && (
                          <span className="size-2 rounded-full bg-blue-500 shrink-0" title="Unread message" />
                        )}
                        <span className={cn(
                          "px-1 py-0.5 text-[8px] font-bold border shrink-0 rounded-none tracking-wider uppercase",
                          isMember 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-muted text-muted-foreground border-border/80"
                        )}>
                          {isMember ? 'User' : 'Guest'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main: Chat Window */}
        <div className="flex flex-1 flex-col bg-background">
          {activeSession ? (
            <>
              <div className="border-b border-border/80 bg-muted/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {activeSession.user?.avatar ? (
                      <div className="size-9 border border-border/80 overflow-hidden rounded-none">
                        <img 
                          src={activeSession.user.avatar} 
                          alt={activeSession.user.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="size-9 flex items-center justify-center rounded-none text-[11px] font-bold border bg-muted text-muted-foreground border-border/80">
                        {getInitials(activeSession.user?.name || activeSession.guestName || 'Guest')}
                      </div>
                    )}
                    {isActiveSessionOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[13px] text-foreground leading-tight">
                        {activeSession.user?.name || activeSession.guestName || 'Guest'}
                      </h3>
                      <span className={cn(
                        "px-1 py-0.2 text-[8px] font-bold border rounded-none tracking-wider uppercase",
                        activeSession.user 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-muted text-muted-foreground border-border/80"
                      )}>
                        {activeSession.user ? 'Member' : 'Guest'}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.2 text-[8px] font-bold border rounded-none tracking-wider uppercase flex items-center gap-1",
                        isActiveSessionOnline 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-muted text-muted-foreground border-border/80"
                      )}>
                        <span className={cn("size-1.5 rounded-full", isActiveSessionOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60")} />
                        {isActiveSessionOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {activeSession.user?.email || 'Guest Client'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-border/80 bg-muted/30 text-muted-foreground">
                    Session: {activeSession.sessionId}
                  </span>
                  <button
                    onClick={() => handleDeleteSession(activeSession.sessionId)}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors border border-border/60 bg-muted/20"
                    title="Delete Chat Session"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-card/10">
                {activeSession.messages.map((m, idx) => {
                  const isAdmin = m.from === 'admin' || m.from === 'bot';
                  const isLast = idx === activeSession.messages.length - 1;
                  return (
                    <div key={m._id || idx} className="space-y-1">
                      <div className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[70%] px-3 py-2 text-[12px] rounded-none border font-medium',
                            isAdmin
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted/50 text-foreground border-border/80'
                          )}
                        >
                          {m.text}
                        </div>
                      </div>
                      {isLast && isAdmin && (
                        <div className="flex justify-end pr-1">
                          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                            {activeSession.lastSeenByUser && new Date(activeSession.lastSeenByUser).getTime() >= new Date(m.createdAt || Date.now()).getTime() ? (
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
                {isUserTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-muted/40 text-muted-foreground border border-border/60 px-3 py-1.5 text-[10px] font-medium flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                      </span>
                      Typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border/80 p-3 bg-muted/10">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Type your reply..."
                    className={cn(PAGE_INPUT_CLASS, "h-8 text-[12px]")}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !replyText.trim()}
                    className={cn(PAGE_PRIMARY_BTN_CLASS, "h-8 w-auto px-4")}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Send
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-[12px] font-medium">Select a active chat from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
