"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import ChatPanel from "@/components/features/ChatPanel";

/** Desktop floating chat — mobile uses /chat in the bottom tab bar. */
export default function LiveChat() {
  const { t } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-6 right-4 z-40 hidden w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl animate-in slide-in-from-bottom-4 md:flex md:flex-col">
          <div className="flex items-center justify-between border-b border-border/60 bg-foreground px-4 py-3 text-background">
            <span className="text-sm font-semibold">{t("liveChat")}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="size-4" />
            </button>
          </div>
          <ChatPanel variant="widget" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 hidden size-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 md:flex"
        aria-label={t("liveChat")}
      >
        <MessageCircle className="size-6" />
      </button>
    </>
  );
}
