import {
  PAGE_TOOLBAR_CLASS,
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_SEARCH_CLASS,
  PAGE_PRIMARY_BTN_CLASS,
} from '../../lib/pageToolbar';
import { MobileFab } from '../layout/mobileAdmin';

export default function MarketingToolbar({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionLabel,
  onAction,
}: {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          <h1 className="shrink-0 text-sm font-bold leading-none text-foreground">{title}</h1>
          <div className="relative w-full max-w-xs flex-1 sm:h-8">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={PAGE_SEARCH_CLASS}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onAction}
          className={`${PAGE_PRIMARY_BTN_CLASS} hidden md:inline-flex`}
        >
          {actionLabel}
        </button>
      </div>
      <MobileFab onClick={onAction} label={actionLabel} />
    </>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    scheduled: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    sent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-none border text-[9px] font-semibold uppercase tracking-wider ${colors[status] || colors.draft}`}
    >
      {status}
    </span>
  );
}

export const inputClass =
  'w-full h-7 px-2.5 text-[12px] bg-background border border-border/80 rounded-none focus:outline-none focus:ring-1 focus:ring-primary';

export const labelClass =
  'block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5';
