"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function LiveChat() {
  const { t } = useStore();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Hi! How can we help you today?" },
  ]);

  const send = () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessages((m) => [...m, { from: "user", text: userMsg }]);
    setMessage("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: "Thanks for your message! Our team will reply shortly during business hours (9am–6pm).",
        },
      ]);
    }, 600);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[min(100vw-2rem,360px)] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">{t("liveChat")}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 max-h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  msg.from === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-border/60">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 h-9 px-3 text-sm bg-muted rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={send}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label={t("liveChat")}
      >
        <MessageCircle className="size-6" />
      </button>
    </>
  );
}
