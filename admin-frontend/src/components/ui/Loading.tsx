import { cn } from '@/lib/utils';

const spinnerSizes = {
  xs: 'size-3.5 border-2',
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
} as const;

export type LoadingSize = keyof typeof spinnerSizes;
export type LoadingVariant = 'page' | 'panel' | 'inline' | 'table-row' | 'spinner';

export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: LoadingSize;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 animate-spin rounded-none border-primary/30 border-t-primary',
        spinnerSizes[size],
        className
      )}
    />
  );
}

type LoadingProps = {
  variant?: LoadingVariant;
  label?: string;
  colSpan?: number;
  size?: LoadingSize;
  className?: string;
};

export default function Loading({
  variant = 'inline',
  label = 'Loading…',
  colSpan = 1,
  size = 'md',
  className,
}: LoadingProps) {
  if (variant === 'spinner') {
    return <LoadingSpinner size={size} className={className} />;
  }

  const message = (
    <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
  );

  const content = (
    <>
      <LoadingSpinner size={size} />
      {label ? message : null}
    </>
  );

  if (variant === 'table-row') {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
          <div
            role="status"
            aria-live="polite"
            aria-label={label}
            className={cn('flex flex-col items-center justify-center gap-2', className)}
          >
            {content}
          </div>
        </td>
      </tr>
    );
  }

  if (variant === 'page') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn(
          'flex h-full min-h-[200px] flex-1 flex-col items-center justify-center gap-3',
          className
        )}
      >
        {content}
      </div>
    );
  }

  if (variant === 'panel') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-none border border-border/80 bg-card py-12 text-center text-muted-foreground',
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-2', className)}
    >
      {content}
    </div>
  );
}
