"use client";

import { useEffect } from "react";
import { Headphones, Phone, Video } from "lucide-react";
import ChatPanel from "@/components/features/ChatPanel";
import { useStore } from "@/context/StoreContext";
import { useChat } from "@/context/ChatContext";

export default function ChatPage() {
  const { t } = useStore();
  const { makeCall } = useChat();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const lockScroll = () => {
      const locked = mq.matches;
      document.documentElement.style.overflow = locked ? "hidden" : "";
      document.body.style.overflow = locked ? "hidden" : "";
      document.body.style.overscrollBehavior = locked ? "none" : "";
    };
    lockScroll();
    mq.addEventListener("change", lockScroll);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      mq.removeEventListener("change", lockScroll);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden overscroll-none md:container md:mx-auto md:h-auto md:min-h-[calc(100dvh-8rem)] md:max-w-lg md:overflow-visible md:px-4 md:py-8">

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:mt-4 md:rounded-2xl md:border md:border-border/60 md:bg-card">
        <div className="flex items-center justify-between border-b border-border/60 bg-foreground px-4 py-3 text-background md:hidden">
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
          </div>
        </div>
        <ChatPanel variant="page" className="flex-1" />
      </div>
    </div>
  );
}
