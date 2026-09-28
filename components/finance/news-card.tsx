import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import { SourceBadge } from "@/components/finance/source-badge";
import { Badge, MockBadge } from "@/components/ui/badge";
import type { NewsStory } from "@/lib/news/types";

interface NewsCardProps {
  story: NewsStory;
  /** Show summary text (hidden in dense lists). */
  showSummary?: boolean;
  className?: string;
}

/**
 * Finance-focused story card: headline, demo summary, clustered sources,
 * time. Clustering is visually explicit via the outlet-count badge.
 */
export function NewsCard({ story, showSummary = true, className }: NewsCardProps) {
  return (
    <article
      className={cn(
        "group rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="muted">{story.category}</Badge>
        {story.outletCount > 1 && (
          <Badge variant="neutral">
            <Layers className="h-3 w-3 text-accent" aria-hidden />
            {story.outletCount} outlets
          </Badge>
        )}
        {story.isMock && <MockBadge />}
        <span className="ml-auto text-2xs text-faint">{formatRelative(story.publishedAt)}</span>
      </div>

      <h3 className="mt-2 text-sm font-medium leading-snug text-foreground">
        {story.headline}
      </h3>

      {showSummary && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
          {story.summary}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {story.sources.map((source) => (
          <SourceBadge key={source.name} source={source} />
        ))}
        {story.symbols.length > 0 && (
          <span className="mono ml-auto text-2xs text-faint">
            {story.symbols.slice(0, 4).join(" · ")}
          </span>
        )}
      </div>
    </article>
  );
}

/** One-line story row for dense panels (Top stories, watchlist news). */
export function NewsRow({ story, className }: { story: NewsStory; className?: string }) {
  return (
    <Link
      href="/news"
      className={cn(
        "block rounded-md px-3 py-2.5 transition-colors duration-100 hover:bg-elevated",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="line-clamp-2 text-xs leading-snug text-secondary group-hover:text-foreground">
          {story.headline}
        </span>
        <span className="shrink-0 text-2xs text-faint">
          {formatRelative(story.publishedAt)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-2xs text-faint">{story.sources[0]?.name}</span>
        {story.outletCount > 1 && (
          <span className="text-2xs text-accent">+{story.outletCount - 1} sources</span>
        )}
        {story.isMock && <span className="text-2xs uppercase tracking-wider text-accent/70">mock</span>}
      </div>
    </Link>
  );
}
