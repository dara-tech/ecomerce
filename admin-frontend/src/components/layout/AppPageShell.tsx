import { cn } from '@/lib/utils';
import { PAGE_BODY_CLASS, PAGE_ROOT_CLASS } from '@/lib/pageToolbar';

/** Standard admin page wrapper */
export default function AppPageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_ROOT_CLASS, className)}>{children}</div>;
}

export function AppPageBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_BODY_CLASS, className)}>{children}</div>;
}
