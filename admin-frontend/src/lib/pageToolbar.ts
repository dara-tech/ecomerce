import { cn } from './utils';

/** Full-height page column — horizontal padding lives here so borders align */
export const PAGE_ROOT_CLASS =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-4';

/** Sticky header shell (toolbar + optional sub-tabs) — fixed, does not scroll */
export const PAGE_STICKY_SHELL_CLASS =
  'z-20 shrink-0 bg-background border-b border-border/80';

/** Toolbar row inside sticky header */
export const PAGE_TOOLBAR_INNER_CLASS =
  'flex min-h-10 flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between';

/** Standalone toolbar (Products, Orders, Marketing) — fixed, does not scroll */
export const PAGE_TOOLBAR_CLASS =
  'z-20 flex shrink-0 flex-col gap-2 border-b border-border/80 bg-background py-2 min-h-10 sm:flex-row sm:items-center sm:justify-between';

/** Scrollable body for dashboard / forms */
export const PAGE_BODY_CLASS = 'min-h-0 flex-1 space-y-3 overflow-y-auto py-3';

/** Body for list/table pages — fills remaining height, table scrolls inside */
export const PAGE_LIST_BODY_CLASS =
  'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2';

/** Bordered table/card shell — flex column, clips scroll area */
export const PAGE_TABLE_PANEL_CLASS =
  'flex min-h-0 flex-1 flex-col overflow-hidden border border-border/80 bg-card shadow-sm';

/** Scrollable table region — scroll without visible scrollbar */
export const PAGE_TABLE_SCROLL_CLASS = 'min-h-0 flex-1 overflow-auto no-scrollbar';

/** Sticky table header while rows scroll */
export const PAGE_TABLE_HEAD_CLASS =
  'sticky top-0 z-10 bg-muted/95 backdrop-blur-sm [&_th]:bg-muted/95';

/** Legacy alias */
export const PAGE_SURFACE_CLASS = PAGE_TABLE_PANEL_CLASS;

/** Inner row for search, filters — fixed 28px control height */
export const PAGE_TOOLBAR_ROW_CLASS =
  'flex w-full min-w-0 flex-col items-start gap-2 sm:h-7 sm:flex-1 sm:flex-row sm:items-center sm:gap-3';

export const PAGE_SEARCH_CLASS =
  'h-7 w-full border border-border bg-input pl-7 pr-2 text-[12px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

/** Sub-tabs row below toolbar */
export const PAGE_SUB_TABS_BAR_CLASS =
  'flex min-h-9 items-center gap-2 overflow-x-auto border-t border-b border-border/60 bg-background py-2';

/** Separate bordered tab buttons row */
export const PAGE_TAB_GROUP_CLASS =
  'flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar pb-0.5';

/** Modal / panel tab row */
export const PAGE_MODAL_TABS_ROW_CLASS =
  'flex flex-wrap items-center gap-2 border-b border-border/80 bg-background px-4 py-2';

export function pageTabButtonClass(active: boolean) {
  return cn(
    'inline-flex h-7 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-3 text-[11px] font-medium transition-colors',
    active
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-border/80 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
  );
}

export const PAGE_PRIMARY_BTN_CLASS =
  'inline-flex h-7 w-full shrink-0 items-center justify-center gap-1.5 bg-primary px-3 text-[11px] font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:opacity-50 sm:w-auto';

export const PAGE_SECONDARY_BTN_CLASS =
  'inline-flex h-7 w-full shrink-0 items-center justify-center gap-1 border border-border/80 bg-input px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted sm:w-auto';

/** Compact form controls used across CMS / settings pages */
export const PAGE_INPUT_CLASS =
  'w-full h-7 px-2.5 text-[12px] bg-background border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary';

export const PAGE_TEXTAREA_CLASS =
  'w-full px-2.5 py-2 text-[12px] bg-background border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary';

export const PAGE_LABEL_CLASS =
  'block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1';

export const PAGE_CARD_CLASS =
  'bg-card border border-border/80 shadow-sm overflow-hidden';

export const PAGE_CARD_HEADER_CLASS =
  'px-3 py-2 border-b border-border/80 bg-muted/30';

export const PAGE_CARD_BODY_CLASS = 'p-3 space-y-3';
