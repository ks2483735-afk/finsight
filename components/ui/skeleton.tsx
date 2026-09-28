import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Shimmering placeholder block used for loading states. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("fs-skeleton h-4 w-full rounded", className)} aria-hidden />;
}

/** Row-shaped skeleton for tables. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}
