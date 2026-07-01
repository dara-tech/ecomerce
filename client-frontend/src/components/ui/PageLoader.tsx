import { cn } from "@/lib/utils";

const spinnerSizes = {
  xs: "size-3.5 border-[1.5px]",
  sm: "size-4 border-2",
  md: "size-8 border-2",
  lg: "size-10 border-[3px]",
} as const;

type SpinnerSize = keyof typeof spinnerSizes;

export function Spinner({
  size = "md",
  className,
}: {
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-muted-foreground/20 border-t-foreground",
        spinnerSizes[size],
        className
      )}
    />
  );
}

type PageLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

/** Full-page or in-page loading state — use everywhere for route/data loads. */
export function PageLoader({
  label = "Loading…",
  fullScreen = false,
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[min(50dvh,420px)] py-16",
        className
      )}
    >
      <Spinner size="lg" />
      {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
    </div>
  );
}

/** Section / list loading (products grid, reviews block, etc.). */
export function SectionLoader({
  label,
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        compact ? "py-10" : "py-20",
        className
      )}
    >
      <Spinner size="md" />
      {label ? <p className="text-sm font-medium text-muted-foreground">{label}</p> : null}
    </div>
  );
}

/** Buttons and small inline actions. */
export function InlineLoader({
  size = "sm",
  className,
}: {
  size?: Extract<SpinnerSize, "xs" | "sm">;
  className?: string;
}) {
  return <Spinner size={size} className={className} />;
}

export default PageLoader;
