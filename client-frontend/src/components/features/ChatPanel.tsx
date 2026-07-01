"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Headphones } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
  at: number;
};

const STORAGE_KEY = "luna_chat_messages";

const WELCOME: ChatMessage = {
  id: "welcome",
  from: "bot",
  text: "Hi! How can we help you today?",
  at: Date.now(),
};

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [WELCOME];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

type ChatPanelProps = {
  variant?: "page" | "widget";
  className?: string;
};

export default function ChatPanel({ variant = "page", className }: ChatPanelProps) {
  const { t } = useStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isPage = variant === "page";

  useEffect(() => {
    setMessages(loadMessages());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, ready]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = message.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text, at: Date.now() },
    ]);
    setMessage("");

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          from: "bot",
          text: "Thanks for your message! Our team will reply shortly during business hours (9am–6pm).",
          at: Date.now(),
        },
      ]);
    }, 600);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isPage ? "min-h-0 flex-1" : "h-full max-h-[min(420px,60dvh)]",
        className
      )}
    >
      {!isPage && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-foreground px-4 py-3 text-background">
          <Headphones className="size-4 shrink-0" />
          <span className="text-sm font-semibold">{t("liveChat")}</span>
        </div>
      )}

      <div
        ref={listRef}
        className={cn("flex-1 space-y-3 overflow-y-auto px-4 py-4", isPage ? "pb-2" : "max-h-64")}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              msg.from === "user"
                ? "ml-auto bg-foreground text-background"
                : "bg-muted text-foreground"
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "border-t border-border/60 bg-background p-3",
          isPage && "pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3"
        )}
      >
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("chatPlaceholder")}
            className="h-11 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/30 focus:bg-background"
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
