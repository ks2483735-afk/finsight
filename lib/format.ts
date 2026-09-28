/** Consistent financial formatting used across every component. */

const currencyFmt = new Map<string, Intl.NumberFormat>();

export function formatPrice(value: number, currency: string): string {
  const key = currency;
  let fmt = currencyFmt.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFmt.set(key, fmt);
  }
  return fmt.format(value);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Compact magnitude: 4.35T, 812B, 12.4M, 780K. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const suffix: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [unit, label] of suffix) {
    if (abs >= unit) {
      const n = value / unit;
      return `${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)}${label}`;
    }
  }
  return formatNumber(value, 2);
}

/** Market cap with currency symbol: $3.52T / ₹19.95T. */
export function formatMarketCap(value: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${formatCompact(value)}`;
}

export function formatSigned(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatNumber(Math.abs(value), digits)}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${formatSigned(value, digits)}%`;
}

/** Semantic class for positive / negative / neutral financial states. */
export function trendClass(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-neutral";
}

export function trendWord(value: number): "up" | "down" | "flat" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "12m ago", "3h ago", "2d ago". */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}

export function formatDateLong(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Greeting used by the dashboard context header. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
