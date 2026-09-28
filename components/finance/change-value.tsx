import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent, trendClass } from "@/lib/format";

interface ChangeValueProps {
  /** Percent change (e.g. 1.24 for +1.24%). */
  percent?: number | null;
  /** Optional absolute change shown before the percent. */
  absolute?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/** Positive / negative / neutral financial state, spec: clear semantics. */
export function ChangeValue({
  percent,
  absolute,
  currency,
  size = "sm",
  showIcon = true,
  className,
}: ChangeValueProps) {
  if (percent === undefined || percent === null || Number.isNaN(percent)) {
    return <span className={cn("tnum text-xs text-faint", className)}>—</span>;
  }

  const Icon = percent > 0 ? ArrowUpRight : percent < 0 ? ArrowDownRight : Minus;

  return (
    <span
      className={cn("tnum inline-flex items-center gap-0.5 font-medium", SIZES[size], trendClass(percent), className)}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden />}
      {absolute !== undefined && absolute !== null && !Number.isNaN(absolute) && (
        <span>
          {currency === "INR" ? "₹" : currency === "USD" ? "$" : ""}
          {formatNumber(Math.abs(absolute), 2)}{" "}
        </span>
      )}
      {formatPercent(percent)}
    </span>
  );
}
