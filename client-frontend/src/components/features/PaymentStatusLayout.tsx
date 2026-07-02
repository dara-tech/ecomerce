"use client";

import Link from "next/link";
import { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const btnPrimary =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98] hover:bg-foreground/90";

const btnSecondary =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-background text-sm font-semibold transition-colors hover:bg-muted/40";

export function PaymentStatusLayout({
  icon,
  title,
  description,
  children,
  actions,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "container mx-auto flex max-w-lg flex-col items-center px-4 pb-[var(--mobile-tab-bar-h)] pt-8 text-center md:max-w-md md:py-16",
        className
      )}
    >
      <div className="mb-5 flex size-16 items-center justify-center">{icon}</div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
        {description}
      </p>
      {children}
      <div className="flex w-full max-w-sm flex-col gap-3">{actions}</div>
    </div>
  );
}

export function OrderInfoCard({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="mb-8 w-full max-w-sm rounded-2xl border border-border/60 bg-muted/20 p-4 text-left text-sm">
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
          >
            <span className="shrink-0 text-muted-foreground">{row.label}</span>
            <span className="min-w-0 text-right font-medium break-all">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaymentStatusButton({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      className={cn(variant === "primary" ? btnPrimary : btnSecondary, className)}
      {...props}
    />
  );
}

export function PaymentStatusLink({
  href,
  variant = "secondary",
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link href={href} className={cn(variant === "primary" ? btnPrimary : btnSecondary, className)} {...props}>
      {children}
    </Link>
  );
}
