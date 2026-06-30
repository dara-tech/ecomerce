import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  PAGE_TABLE_PANEL_CLASS,
  PAGE_TABLE_SCROLL_CLASS,
} from '@/lib/pageToolbar';

/** Scrollable table panel — keeps toolbar/sidebar fixed; only rows scroll */
export default function DataTableShell({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(PAGE_TABLE_PANEL_CLASS, 'hidden md:flex md:flex-col', className)}>
      <div className={PAGE_TABLE_SCROLL_CLASS}>{children}</div>
      {footer}
    </div>
  );
}
