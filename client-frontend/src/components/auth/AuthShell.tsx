"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { useStore } from "@/context/StoreContext";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
  topLink?: { href: string; label: string };
};

export function AuthShell({ title, subtitle, footer, children, topLink }: AuthShellProps) {
  const { settings } = useStore();
  const storeName = settings?.storeName || "Store";

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      const locked = mq.matches;
      document.documentElement.style.overflow = locked ? "hidden" : "";
      document.body.style.overflow = locked ? "hidden" : "";
      document.body.style.overscrollBehavior = locked ? "none" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-background md:h-auto md:max-h-none md:min-h-[calc(100dvh-5rem)] md:overflow-visible md:items-center md:justify-center md:py-14">
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        <div className="absolute -left-24 top-1/4 size-72 rounded-full bg-muted/40 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 size-72 rounded-full bg-muted/30 blur-3xl" />
      </div>

      <header
        className="sticky top-0 z-20 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border/60 bg-background px-4 pb-3 md:hidden"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
      >
        <Link
          href="/"
          className="-ml-1 inline-flex items-center gap-0.5 py-1 text-sm font-medium text-foreground active:opacity-70"
        >
          <ChevronLeft className="size-5 shrink-0" strokeWidth={2} />
          Back
        </Link>

        <Link href="/" className="justify-self-center">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={storeName} className="h-5 max-w-[96px] object-contain" />
          ) : (
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-background">
              {storeName}
            </span>
          )}
        </Link>

        {topLink ? (
          <Link
            href={topLink.href}
            className="justify-self-end py-1 text-sm font-semibold text-foreground active:opacity-70"
          >
            {topLink.label}
          </Link>
        ) : (
          <span aria-hidden className="min-w-0" />
        )}
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col md:max-w-[400px] md:flex-none md:px-4">
        <div className="mb-6 hidden items-center justify-between gap-4 md:mb-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Store
          </Link>
          {topLink && (
            <Link
              href={topLink.href}
              className="text-sm font-medium text-foreground transition-opacity hover:opacity-70"
            >
              {topLink.label}
            </Link>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-5 no-scrollbar md:overflow-visible md:px-0 md:py-0">
          <div className="mb-5 space-y-1 md:mb-8">
            <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-foreground md:text-2xl md:font-semibold">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>

        <footer className="shrink-0 border-t border-border/60 px-5 py-4 text-center text-sm text-muted-foreground md:mt-8 md:border-t-0 md:px-0 md:py-0 md:pb-0">
          <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }} className="md:pb-0">
            {footer}
          </div>
        </footer>
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive md:mb-6 md:rounded-xl"
    >
      {message}
    </div>
  );
}

export const authInputClass =
  "auth-input h-12 rounded-xl border border-border bg-background px-4 text-base shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/5 focus-visible:ring-offset-0 md:h-11 md:rounded-xl md:px-3.5 md:text-sm";

export const authLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:font-medium md:normal-case md:tracking-normal md:text-foreground/70";

export const authSubmitClass =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-base font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 md:h-11 md:rounded-xl md:text-sm md:font-medium";
