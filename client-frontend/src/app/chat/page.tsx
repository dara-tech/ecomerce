"use client";

import { Headphones } from "lucide-react";
import ChatPanel from "@/components/features/ChatPanel";
import { useStore } from "@/context/StoreContext";

export default function ChatPage() {
  const { t } = useStore();

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-4.25rem-env(safe-area-inset-bottom))] flex-col md:min-h-[calc(100dvh-8rem)] md:container md:mx-auto md:max-w-lg md:px-4 md:py-8">
      <div className="shrink-0 border-b border-border/60 px-4 py-4 md:rounded-2xl md:border md:bg-card md:px-5 md:py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
            <Headphones className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{t("liveChat")}</h1>
            <p className="text-xs text-muted-foreground">{t("chatSubtitle")}</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:mt-4 md:rounded-2xl md:border md:border-border/60 md:bg-card">
        <ChatPanel variant="page" className="flex-1" />
      </div>
    </div>
  );
}
