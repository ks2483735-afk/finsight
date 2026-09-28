"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Loader2, Newspaper, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice } from "@/lib/format";
import { fetchJson } from "@/lib/hooks/use-async-data";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { SearchResponse } from "@/lib/search/service";
import type { NewsStory } from "@/lib/news/types";

interface GlobalSearchProps {
  variant?: "header" | "hero";
  autoFocus?: boolean;
  className?: string;
  /** Called after navigating (used to close the mobile modal). */
  onNavigate?: () => void;
}

interface Indexed<T> {
  item: T;
  index: number;
}

/**
 * The global financial research search (spec: launches the research
 * experience, not a plain text search).
 *   Enter        → /research?q=…  (research pipeline)
 *   Click result → company / news / page
 *   /            → focus (app-wide shortcut)
 */
export function GlobalSearch({
  variant = "header",
  autoFocus = false,
  className,
  onNavigate,
}: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebounce(query, 180);

  // --- fetch suggestions --------------------------------------------------
  useEffect(() => {
    const q = debounced.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetchJson<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`)
      .then((data) => {
        if (alive) setResults(data);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced]);

  // --- "/" keyboard shortcut ---------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (target?.closest("[data-finsight-modal]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // --- indexed sections for keyboard navigation ---------------------------
  const sections = useMemo(() => {
    if (!results) {
      return {
        companies: [] as Indexed<SearchResponse["companies"][number]>[],
        stories: [] as Indexed<NewsStory>[],
        pages: [] as Indexed<SearchResponse["pages"][number]>[],
        flat: [] as { href: string }[],
      };
    }
    let index = 0;
    const companies = results.companies.map((item) => ({ item, index: index++ }));
    const stories = results.stories.map((item) => ({ item, index: index++ }));
    const pages = results.pages.map((item) => ({ item, index: index++ }));
    const flat = [
      ...companies.map(({ item }) => ({ href: `/companies?symbol=${item.symbol}` })),
      ...stories.map(() => ({ href: "/news" })),
      ...pages.map(({ item }) => ({ href: item.href })),
    ];
    return { companies, stories, pages, flat };
  }, [results]);

  const hasQuery = query.trim().length > 0;
  const showPanel = open && hasQuery;

  const goResearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    onNavigate?.();
    router.push(`/research?q=${encodeURIComponent(trimmed)}`);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (!showPanel || sections.flat.length === 0) {
      if (e.key === "Enter") goResearch(query);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % sections.flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? sections.flat.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? sections.flat[activeIndex] : null;
      if (target) {
        setOpen(false);
        onNavigate?.();
        router.push(target.href);
      } else {
        goResearch(query);
      }
    }
  };

  const isHero = variant === "hero";
  const noMatches =
    results &&
    !loading &&
    sections.companies.length === 0 &&
    sections.stories.length === 0 &&
    sections.pages.length === 0;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-surface transition-colors duration-150 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/30",
          isHero ? "h-12 px-3.5" : "h-9 px-3",
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-muted",
            isHero ? "h-[18px] w-[18px]" : "h-3.5 w-3.5",
          )}
          aria-hidden
        />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so result clicks register before the panel closes.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          placeholder={
            isHero
              ? 'Ask anything — "Why is NVDA down today?"'
              : "Search tickers, companies, news…"
          }
          aria-label="Global financial research search"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-foreground placeholder:text-faint focus:outline-none",
            isHero ? "text-base" : "text-sm",
          )}
        />
        {loading && <Loader2 className="fs-spinner h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
        {!isHero && !loading && hasQuery && (
          <span className="hidden shrink-0 items-center gap-1 text-2xs text-faint sm:flex">
            <CornerDownLeft className="h-3 w-3" aria-hidden />
            research
          </span>
        )}
        {!isHero && !hasQuery && (
          <kbd className="hidden shrink-0 rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-faint sm:block">
            /
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          className={cn(
            "fs-fade-in absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-border bg-overlay shadow-pop",
            !isHero && "sm:w-[520px] sm:right-auto",
          )}
        >
          {loading && !results && (
            <div className="flex items-center gap-2 px-3.5 py-3 text-xs text-muted">
              <Loader2 className="fs-spinner h-3.5 w-3.5" aria-hidden />
              Searching the demo universe…
            </div>
          )}

          {error && <div className="px-3.5 py-3 text-xs text-negative">{error}</div>}

          {noMatches && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => goResearch(query)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-3 text-left text-xs text-secondary transition-colors hover:bg-elevated"
            >
              <span className="truncate">No direct matches for “{query.trim()}”</span>
              <span className="flex shrink-0 items-center gap-1 text-2xs text-accent">
                Research anyway
                <CornerDownLeft className="h-3 w-3" aria-hidden />
              </span>
            </button>
          )}

          {sections.companies.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3.5 pb-1 pt-2 text-2xs font-medium uppercase tracking-wider text-faint">
                Companies
              </div>
              {sections.companies.map(({ item: company, index }) => (
                <button
                  key={company.symbol}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                    router.push(`/companies?symbol=${company.symbol}`);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors",
                    activeIndex === index ? "bg-elevated" : "hover:bg-elevated/60",
                  )}
                >
                  <span className="mono w-24 shrink-0 text-xs font-semibold text-foreground">
                    {company.symbol}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                    {company.name}
                  </span>
                  <span className="tnum shrink-0 text-xs text-foreground">
                    {formatPrice(company.price, company.currency)}
                  </span>
                  <span
                    className={cn(
                      "tnum w-16 shrink-0 text-right text-xs",
                      company.changePercent > 0
                        ? "text-positive"
                        : company.changePercent < 0
                          ? "text-negative"
                          : "text-muted",
                    )}
                  >
                    {formatPercent(company.changePercent)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {sections.stories.length > 0 && (
            <div className="border-b border-border py-1">
              <div className="px-3.5 pb-1 pt-2 text-2xs font-medium uppercase tracking-wider text-faint">
                News
              </div>
              {sections.stories.map(({ item: story, index }) => (
                <button
                  key={story.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                    router.push("/news");
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                    activeIndex === index ? "bg-elevated" : "hover:bg-elevated/60",
                  )}
                >
                  <Newspaper className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="truncate text-xs text-secondary">{story.headline}</span>
                </button>
              ))}
            </div>
          )}

          {sections.pages.length > 0 && (
            <div className="py-1">
              <div className="px-3.5 pb-1 pt-2 text-2xs font-medium uppercase tracking-wider text-faint">
                Pages
              </div>
              {sections.pages.map(({ item: page, index }) => (
                <button
                  key={page.href}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                    router.push(page.href);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors",
                    activeIndex === index ? "bg-elevated" : "hover:bg-elevated/60",
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
                  <span className="text-xs text-secondary">{page.label}</span>
                  <span className="ml-auto truncate text-2xs text-faint">{page.hint}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-3.5 py-2 text-2xs text-faint">
            <span>Enter to run research</span>
            <span>↑↓ to navigate</span>
          </div>
        </div>
      )}
    </div>
  );
}
