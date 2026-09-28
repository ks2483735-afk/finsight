"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import { formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/market-data/types";
import type { NewsStory } from "@/lib/news/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import type { WatchlistRow } from "@/lib/database/repos/watchlist";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceChip, MockBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ChangeValue } from "@/components/finance/change-value";
import { NewsCard } from "@/components/finance/news-card";

interface WatchlistItem extends WatchlistRow {
  quote: Quote | null;
}

interface WatchlistPayload {
  items: WatchlistItem[];
  source: DataSourceInfo | null;
}

export default function WatchlistPage() {
  const { data, loading, error, refetch } = useAsyncData<WatchlistPayload>(
    () => fetchJson("/api/watchlist"),
    [],
  );
  const companies = useAsyncData<{ companies: Array<{ symbol: string; name: string }> }>(
    () => fetchJson("/api/companies"),
    [],
  );
  const news = useAsyncData<{ stories: NewsStory[] }>(
    () => fetchJson("/api/news?limit=50"),
    [],
  );

  const [symbol, setSymbol] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const watchedSymbols = new Set((data?.items ?? []).map((i) => i.symbol));
  const watchlistStories = (news.data?.stories ?? []).filter((story) =>
    story.symbols.some((s) => watchedSymbols.has(s)),
  );

  const add = async () => {
    const value = symbol.trim().toUpperCase();
    if (!value) return;
    setAddBusy(true);
    setAddError(null);
    try {
      await fetchJson("/api/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol: value }),
      });
      setSymbol("");
      await refetch();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add symbol");
    } finally {
      setAddBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await fetchJson("/api/watchlist", { method: "DELETE", body: JSON.stringify({ id }) });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<WatchlistItem>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (item) => <span className="mono font-semibold text-foreground">{item.symbol}</span>,
    },
    {
      key: "name",
      header: "Name",
      cell: (item) => <span className="text-secondary">{item.quote?.name ?? "—"}</span>,
    },
    {
      key: "exchange",
      header: "Exchange",
      cell: (item) => <span className="text-muted">{item.quote?.exchange ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Last",
      numeric: true,
      sortValue: (item) => item.quote?.price ?? 0,
      cell: (item) =>
        item.quote ? formatPrice(item.quote.price, item.quote.currency) : "—",
    },
    {
      key: "change",
      header: "%",
      numeric: true,
      sortValue: (item) => item.quote?.changePercent ?? 0,
      cell: (item) =>
        item.quote ? <ChangeValue percent={item.quote.changePercent} /> : "—",
    },
    {
      key: "added",
      header: "Added",
      cell: (item) => <span className="text-2xs text-faint">{item.addedAt.slice(0, 10)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (item) => (
        <button
          type="button"
          onClick={() => remove(item.id)}
          aria-label={`Remove ${item.symbol}`}
          className="rounded p-1 text-faint transition-colors hover:bg-negative/10 hover:text-negative"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Watchlist"
        description="Track symbols with live-in-panel demo quotes and related stories. Stored locally in SQLite."
        actions={
          <>
            <MockBadge />
            {data?.source && <DataSourceChip source={data.source} />}
          </>
        }
      />

      {/* ----------------------------------------------------------- add bar */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <div className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
            <Input
              list="watchlist-symbols"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              placeholder="Add a symbol — e.g. NVDA, INFY…"
              aria-label="Symbol to watch"
            />
            <datalist id="watchlist-symbols">
              {(companies.data?.companies ?? []).map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </datalist>
            <Button variant="primary" size="md" onClick={add} loading={addBusy}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add
            </Button>
          </div>
          <span className="text-2xs text-faint">
            {data?.items.length ?? 0} tracked · v0.1 demo universe (23 symbols)
          </span>
          {addError && <span className="text-xs text-negative">{addError}</span>}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(item) => item.id}
          minWidth="760px"
          dense
          empty={
            <EmptyState
              icon={Star}
              title="No symbols tracked yet"
              description="Add tickers above — prices, moves, and related news will appear here."
            />
          }
        />
      )}

      {/* ------------------------------------------------------ watchlist news */}
      {watchedSymbols.size > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Watchlist news
              <span className="ml-2 text-2xs font-normal text-faint">
                {watchlistStories.length} stories
              </span>
            </h2>
            <MockBadge />
          </div>
          {news.loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : watchlistStories.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {watchlistStories.map((story) => (
                <NewsCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No stories for your watchlist"
              description="Demo news set has no coverage of these symbols right now."
            />
          )}
        </div>
      )}
    </div>
  );
}
