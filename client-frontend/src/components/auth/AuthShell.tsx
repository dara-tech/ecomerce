"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
  topLink?: { href: string; label: string };
};

export function AuthShell({ title, subtitle, footer, children, topLink }: AuthShellProps) {
  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 size-72 rounded-full bg-muted/40 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 size-72 rounded-full bg-muted/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="mb-8 flex items-center justify-between gap-4">
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

        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

export const authInputClass =
  "auth-input h-11 rounded-xl border border-border bg-background px-3.5 text-sm shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/5 focus-visible:ring-offset-0";

export const authLabelClass = "text-xs font-medium text-foreground/70";

export const authSubmitClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";
