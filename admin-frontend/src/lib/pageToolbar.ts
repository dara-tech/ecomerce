import { cn } from './utils';

/** Full-height page column — horizontal padding lives here so borders align */
export const PAGE_ROOT_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden px-6';

/** Sticky header shell (toolbar + optional sub-tabs) — fixed, does not scroll */
export const PAGE_STICKY_SHELL_CLASS =
  'z-20 shrink-0 bg-background border-b border-border/80';

/** Toolbar row inside sticky header */
export const PAGE_TOOLBAR_INNER_CLASS =
  'flex min-h-14 flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between';

/** Sub-tabs row below toolbar */
export const PAGE_SUB_TABS_BAR_CLASS =
  'flex min-h-12 items-center gap-3 overflow-x-auto border-t border-border/60 bg-muted/30 py-3';

/** Standalone toolbar (Products, Orders, Marketing) — fixed, does not scroll */
export const PAGE_TOOLBAR_CLASS =
  'z-20 flex shrink-0 flex-col gap-3 border-b border-border/80 bg-background py-3.5 min-h-14 sm:flex-row sm:items-center sm:justify-between';

/** Scrollable body for dashboard / forms */
export const PAGE_BODY_CLASS = 'min-h-0 flex-1 space-y-4 overflow-y-auto py-6';

/** Body for list/table pages — fills remaining height, table scrolls inside */
export const PAGE_LIST_BODY_CLASS =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-4';

/** Bordered table/card shell — flex column, clips scroll area */
export const PAGE_TABLE_PANEL_CLASS =
  'flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm';

/** Scrollable table region — scroll without visible scrollbar */
export const PAGE_TABLE_SCROLL_CLASS = 'min-h-0 flex-1 overflow-auto no-scrollbar';

/** Sticky table header while rows scroll */
export const PAGE_TABLE_HEAD_CLASS =
  'sticky top-0 z-10 bg-muted/95 backdrop-blur-sm [&_th]:bg-muted/95';

/** Legacy alias */
export const PAGE_SURFACE_CLASS = PAGE_TABLE_PANEL_CLASS;

/** Inner row for search, filters — fixed 32px control height */
export const PAGE_TOOLBAR_ROW_CLASS =
  'flex w-full min-w-0 flex-col items-start gap-3 sm:h-8 sm:flex-1 sm:flex-row sm:items-center sm:gap-4';

export const PAGE_SEARCH_CLASS =
  'h-8 w-full rounded-md border border-border bg-input pl-8 pr-3 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

/** Tab pill group */
export const PAGE_TAB_GROUP_CLASS =
  'inline-flex h-9 max-w-full shrink-0 items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1';

export function pageTabButtonClass(active: boolean) {
  return cn(
    'inline-flex h-7 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 text-[12px] font-medium transition-colors',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground'
  );
}

export const PAGE_PRIMARY_BTN_CLASS =
  'inline-flex h-8 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[12px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:opacity-50 sm:w-auto';

export const PAGE_SECONDARY_BTN_CLASS =
  'inline-flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-border/80 bg-input px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted sm:w-auto';
