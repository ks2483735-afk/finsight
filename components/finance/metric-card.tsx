import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  /** Change / delta rendered under the value. */
  delta?: ReactNode;
  /** Small right-aligned visual (sparkline). */
  chart?: ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
}

/**
 * The core financial metric tile: label, big tabular value, delta, optional
 * sparkline. Dense, no glow, no gradient — spec §4A.
 */
export function MetricCard({
  label,
  value,
  delta,
  chart,
  hint,
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3.5 transition-colors duration-150 hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        {chart}
      </div>
      {loading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ) : (
        <>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tnum">
            {value}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            {delta ?? <span />}
            {hint && <span className="text-2xs text-faint">{hint}</span>}
          </div>
        </>
      )}
    </div>
  );
}
