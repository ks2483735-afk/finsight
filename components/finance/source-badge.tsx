import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsSource } from "@/lib/news/types";

interface SourceBadgeProps {
  source: NewsSource;
  className?: string;
}

/** Pill linking to an original publisher (links go to publisher homepages). */
export function SourceBadge({ source, className }: SourceBadgeProps) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-muted transition-colors hover:border-border-strong hover:text-secondary",
        className,
      )}
    >
      {source.name}
      <ExternalLink className="h-2.5 w-2.5" aria-hidden />
    </a>
  );
}
