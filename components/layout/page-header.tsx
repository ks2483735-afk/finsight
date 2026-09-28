import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions. */
  actions?: ReactNode;
  /** Small line above the title (section path). */
  eyebrow?: ReactNode;
  className?: string;
}

/** Consistent page title block: every feature page starts with this. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs text-muted">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

/** Dashboard section heading (Markets, Top stories, …). */
export function SectionHeader({ title, hint, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {hint && <span className="truncate text-2xs text-faint">{hint}</span>}
      </div>
      {action}
    </div>
  );
}
