import type { ReactNode } from 'react';
import { PAGE_STICKY_SHELL_CLASS, PAGE_SUB_TABS_BAR_CLASS, PAGE_TOOLBAR_INNER_CLASS } from '../../lib/pageToolbar';

export function PageStickyHeader({
  toolbar,
  subTabs,
}: {
  toolbar: ReactNode;
  subTabs?: ReactNode;
}) {
  return (
    <div className={PAGE_STICKY_SHELL_CLASS}>
      <div className={PAGE_TOOLBAR_INNER_CLASS}>{toolbar}</div>
      {subTabs && <div className={PAGE_SUB_TABS_BAR_CLASS}>{subTabs}</div>}
    </div>
  );
}
