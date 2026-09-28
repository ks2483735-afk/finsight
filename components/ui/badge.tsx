import type { HTMLAttributes, ReactNode } from "react";
import { FlaskConical, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataSourceInfo } from "@/lib/providers/types";

export type BadgeVariant =
  | "neutral"
  | "accent"
  | "positive"
  | "negative"
  | "outline"
  | "muted";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "border border-border bg-elevated text-secondary",
  accent: "border border-accent-border bg-accent-soft text-accent",
  positive: "border border-positive/25 bg-positive/10 text-positive",
  negative: "border border-negative/25 bg-negative/10 text-negative",
  outline: "border border-border text-muted",
  muted: "bg-elevated text-muted",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded px-1.5 text-2xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * The single most important badge in v0.1: every mock/demo payload wears it
 * so fabricated data can never be mistaken for live market data.
 */
export function MockBadge({ className }: { className?: string }) {
  return (
    <Badge variant="accent" className={cn("uppercase tracking-wider", className)}>
      <FlaskConical className="h-3 w-3" aria-hidden />
      Mock data
    </Badge>
  );
}

/** Shows which provider produced a payload (and whether it is demo data). */
export function DataSourceChip({
  source,
  className,
}: {
  source: DataSourceInfo;
  className?: string;
}) {
  if (source.isMock) return <MockBadge className={className} />;
  return (
    <Badge variant="neutral" className={className}>
      <Radio className="h-3 w-3 text-positive" aria-hidden />
      {source.label}
      {source.degraded && " · fallback"}
    </Badge>
  );
}
