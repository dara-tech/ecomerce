import type { ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MOBILE_LIST_CLASS =
  'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:hidden';

export const MOBILE_FAB_CLASS =
  'fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-40 flex size-14 items-center justify-center bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all hover:scale-105 active:scale-95 md:hidden';

export const MOBILE_CARD_CLASS =
  'rounded-none border border-border/80 bg-card p-3 shadow-sm';

export function MobileListShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(MOBILE_LIST_CLASS, className)}>{children}</div>;
}

export function MobileFab({
  onClick,
  label,
  icon: Icon = Plus,
}: {
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={MOBILE_FAB_CLASS}>
      <Icon className="size-6" />
    </button>
  );
}

export function MobileRecordCard({
  title,
  subtitle,
  meta,
  badges,
  onClick,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  onClick?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        MOBILE_CARD_CLASS,
        onClick && 'cursor-pointer transition-colors active:bg-muted/30',
        className
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{subtitle}</div>
          ) : null}
          {meta ? <div className="mt-1.5 text-[11px] text-muted-foreground">{meta}</div> : null}
          {badges ? <div className="mt-2 flex flex-wrap gap-1">{badges}</div> : null}
          {children}
        </div>
        {actions ? <div className="flex shrink-0 items-start gap-1">{actions}</div> : null}
      </div>
    </div>
  );
}

export function MobileEmptyState({ message }: { message: string }) {
  return (
    <div className={cn(MOBILE_CARD_CLASS, 'py-10 text-center text-sm text-muted-foreground')}>
      {message}
    </div>
  );
}

export function DesktopTablePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'hidden overflow-hidden rounded-none border border-border/80 bg-card shadow-sm md:block',
        className
      )}
    >
      {children}
    </div>
  );
}
