"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "pill" | "underline";
  className?: string;
  /** Accessible name for the tab list. */
  label?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  variant = "pill",
  className,
  label = "Tabs",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        aria-label={label}
        className={cn("flex gap-1 overflow-x-auto border-b border-border", className)}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-secondary",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className="ml-1.5 text-2xs text-faint">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border bg-surface p-0.5",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-xs font-medium transition-colors duration-150",
              active
                ? "bg-elevated text-foreground"
                : "text-muted hover:text-secondary",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("tnum text-2xs", active ? "text-accent" : "text-faint")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
