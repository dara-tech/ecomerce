"use client";

import { MessageCircle, X, Headphones, Video, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useChat } from "@/context/ChatContext";
import ChatPanel from "@/components/features/ChatPanel";

/** Desktop floating chat — mobile uses /chat in the bottom tab bar. */
export default function LiveChat() {
  const { t } = useStore();
  const { isChatOpen: open, setIsChatOpen: setOpen, unreadCount, isAdminTyping, makeCall } = useChat();
  const pathname = usePathname();

  if (pathname === "/chat") return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-4 z-40 hidden w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl animate-in slide-in-from-bottom-4 md:flex md:flex-col">
          <div className="flex items-center justify-between border-b border-border/60 bg-foreground px-4 py-3 text-background">
            <div className="flex items-center gap-2">
              <Headphones className="size-4 shrink-0" />
              <span className="text-sm font-semibold">{t("liveChat")}</span>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => makeCall(false)} aria-label="Voice Call">
                <Phone className="size-4" />
              </button>
              <button type="button" onClick={() => makeCall(true)} aria-label="Video Call">
                <Video className="size-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="size-4" />
              </button>
            </div>
          </div>
          <ChatPanel variant="widget" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-30 hidden size-14 items-center justify-center rounded-full text-foreground transition-transform hover:scale-105 md:flex"
        aria-label={t("liveChat")}
      >
        <span className="relative flex items-center justify-center">
          <MessageCircle className="size-8" />
          {isAdminTyping && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
          {unreadCount > 0 && !isAdminTyping && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </span>
      </button>
    </>
  );
}
