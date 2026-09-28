"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonStyles } from "@/components/ui/button";

/* ---------------------------------------------------------------- loading */

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-6 py-10 text-center",
        className,
      )}
      role="status"
    >
      <Loader2 className="fs-spinner h-4 w-4 text-muted" aria-hidden />
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ empty */

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-elevated text-muted">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href} className={buttonStyles("primary", "sm", "mt-2")}>
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={buttonStyles("primary", "sm", "mt-2")}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ error */

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-negative/30 bg-negative/[0.04] px-6 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-negative/30 bg-negative/10 text-negative">
        <AlertTriangle className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md break-words text-xs leading-relaxed text-muted">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={buttonStyles("outline", "sm", "mt-1.5")}>
          Retry
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------ unavailable (BYOK) */

interface UnavailableStateProps {
  title: string;
  description: string;
  /** CTA into Settings when a key/provider must be configured. */
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * The "no API key / provider not implemented" state — visually distinct
 * from errors (accent, not red) because it is a configuration state.
 */
export function UnavailableState({
  title,
  description,
  actionLabel = "Open Settings",
  actionHref = "/settings",
  className,
}: UnavailableStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-accent-border bg-accent-soft px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-accent-border bg-accent-soft text-accent">
        <KeyRound className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-xs leading-relaxed text-secondary">{description}</p>
      <a href={actionHref} className={buttonStyles("primary", "sm", "mt-1.5")}>
        {actionLabel}
      </a>
    </div>
  );
}
