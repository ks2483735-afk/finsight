"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw, Star, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateLong,
  formatPrice,
  formatTime,
  greeting,
} from "@/lib/format";
import { generateSeries } from "@/lib/mock/series";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { Quote } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import type { NewsStory } from "@/lib/news/types";
import type { WatchlistRow } from "@/lib/database/repos/watchlist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceChip, MockBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/finance/metric-card";
import { ChangeValue } from "@/components/finance/change-value";
import { Sparkline } from "@/components/finance/sparkline";
import { NewsCard } from "@/components/finance/news-card";

interface Brief {
  headline: string;
  bullets: string[];
  editorNote: string;
  stocksInFocus: string[];
  whatToWatch: { time: string; label: string; detail: string }[];
}

interface OverviewPayload {
  indices: Quote[];
  movers: { gainers: Quote[]; losers: Quote[] };
  brief: Brief;
  stories: NewsStory[];
  focus: Quote[];
  sources: { market: DataSourceInfo; news: DataSourceInfo };
  asOf: string;
}

interface WatchlistPayload {
  items: Array<WatchlistRow & { quote: Quote | null }>;
  source: DataSourceInfo | null;
}

function IndexGrid({ indices, loading }: { indices: Quote[]; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <MetricCard key={i} label="—" value="" loading />
          ))
        : indices.map((index) => (
            <MetricCard
              key={index.symbol}
              label={index.name}
              value={formatPrice(index.price, index.currency)}
              delta={<ChangeValue percent={index.changePercent} />}
              chart={
                <Sparkline
                  data={generateSeries(`dash-${index.symbol}`, {
                    points: 24,
                    endValue: index.price,
                    trend: index.changePercent / 100,
                  })}
                  width={64}
                  height={22}
                />
              }
            />
          ))}
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const overview = useAsyncData<OverviewPayload>(
    () => fetchJson("/api/market/overview"),
    [],
  );
  const watchlist = useAsyncData<WatchlistPayload>(
    () => fetchJson("/api/watchlist"),
    [],
  );
  const [moversTab, setMoversTab] = useState("gainers");

  const refresh = () => {
    overview.refetch();
    watchlist.refetch();
  };

  const movers =
    moversTab === "gainers" ? overview.data?.movers.gainers ?? [] : overview.data?.movers.losers ?? [];

  const focusColumns: Column<Quote>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (q) => <span className="mono font-semibold text-foreground">{q.symbol}</span>,
    },
    {
      key: "name",
      header: "Company",
      cell: (q) => <span className="text-secondary">{q.name}</span>,
    },
    {
      key: "price",
      header: "Last",
      numeric: true,
      cell: (q) => formatPrice(q.price, q.currency),
    },
    {
      key: "change",
      header: "Change",
      numeric: true,
      cell: (q) => <ChangeValue percent={q.changePercent} />,
    },
  ];

  return (
    <div>
      {/* -------------------------------------------------- context header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{formatDateLong()}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            {greeting()} — market snapshot
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <MockBadge />
          {overview.data && (
            <span className="text-2xs text-faint">
              as of {formatTime(new Date(overview.data.asOf))} · cached 30s
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refresh} loading={overview.loading}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {overview.error && (
        <div className="mb-6">
          <ErrorState description={overview.error} onRetry={overview.refetch} />
        </div>
      )}

      {/* ---------------------------------------------------------- markets */}
      <SectionHeader
        title="Markets"
        hint="US + India indices"
        action={
          <Link
            href="/markets"
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            All markets <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />
      <IndexGrid indices={overview.data?.indices ?? []} loading={overview.loading} />

      {/* -------------------------------------------- brief + what to watch */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Market Brief</CardTitle>
            {overview.data && <DataSourceChip source={overview.data.sources.news} />}
          </CardHeader>
          <CardContent>
            {overview.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : overview.data ? (
              <>
                <p className="text-sm font-medium leading-snug text-foreground">
                  {overview.data.brief.headline}
                </p>
                <ul className="mt-3 space-y-2">
                  {overview.data.brief.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2.5 text-xs leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-2xs uppercase tracking-wider text-faint">
                    In focus
                  </span>
                  {overview.data.brief.stocksInFocus.map((symbol) => (
                    <Link
                      key={symbol}
                      href={`/companies?symbol=${symbol}`}
                      className="mono rounded border border-border bg-elevated px-1.5 py-0.5 text-2xs text-secondary transition-colors hover:border-accent-border hover:text-foreground"
                    >
                      {symbol}
                    </Link>
                  ))}
                </div>
                <p className="mt-3 border-t border-border pt-2.5 text-2xs text-faint">
                  {overview.data.brief.editorNote}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What to watch</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : overview.data ? (
              <ul className="space-y-3.5">
                {overview.data.brief.whatToWatch.map((item) => (
                  <li key={item.label} className="flex gap-3">
                    <span className="mono w-16 shrink-0 text-2xs text-accent">{item.time}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground">{item.label}</div>
                      <div className="mt-0.5 text-2xs leading-relaxed text-muted">
                        {item.detail}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------- stories + watchlist snapshot */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top stories</CardTitle>
            <Link href="/news" className="text-xs text-muted transition-colors hover:text-foreground">
              All news →
            </Link>
          </CardHeader>
          <CardContent>
            {overview.loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : overview.data && overview.data.stories.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {overview.data.stories.map((story) => (
                  <NewsCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <EmptyState title="No stories yet" description="News providers arrive in v0.4." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist snapshot</CardTitle>
            <Link
              href="/watchlist"
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              Open →
            </Link>
          </CardHeader>
          <CardContent>
            {watchlist.loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : watchlist.error ? (
              <ErrorState description={watchlist.error} onRetry={watchlist.refetch} />
            ) : watchlist.data && watchlist.data.items.length > 0 ? (
              <ul className="-mx-1 divide-y divide-border/60">
                {watchlist.data.items.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/companies?symbol=${item.symbol}`}
                      className="flex items-center justify-between gap-2 rounded px-1 py-2 transition-colors hover:bg-elevated"
                    >
                      <span className="mono text-xs font-semibold text-foreground">
                        {item.symbol}
                      </span>
                      {item.quote ? (
                        <span className="flex items-center gap-3">
                          <span className="tnum text-xs text-secondary">
                            {formatPrice(item.quote.price, item.quote.currency)}
                          </span>
                          <ChangeValue percent={item.quote.changePercent} className="w-16 justify-end" />
                        </span>
                      ) : (
                        <span className="text-2xs text-faint">no data</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Star}
                title="Watchlist is empty"
                description="Track symbols to see prices and moves here."
                action={{ label: "Add symbols", href: "/watchlist" }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* --------------------------------------------- focus + market movers */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader
            title="Stocks in focus"
            hint="from the daily brief"
            action={
              <Link
                href="/companies"
                className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                Directory <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            }
          />
          {overview.loading ? (
            <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : overview.data ? (
            <DataTable
              columns={focusColumns}
              rows={overview.data.focus}
              rowKey={(q) => q.symbol}
              onRowClick={(q) => router.push(`/companies?symbol=${q.symbol}`)}
              minWidth="520px"
            />
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Market movers</CardTitle>
            <Tabs
              items={[
                { value: "gainers", label: "Gainers" },
                { value: "losers", label: "Losers" },
              ]}
              value={moversTab}
              onChange={setMoversTab}
              label="Movers"
            />
          </CardHeader>
          <CardContent>
            {overview.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {movers.map((quote, i) => (
                  <li key={quote.symbol}>
                    <Link
                      href={`/companies?symbol=${quote.symbol}`}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-elevated"
                    >
                      <span className="w-4 shrink-0 text-2xs text-faint">{i + 1}</span>
                      {moversTab === "gainers" ? (
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-positive" aria-hidden />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 shrink-0 text-negative" aria-hidden />
                      )}
                      <span className="mono min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                        {quote.symbol}
                      </span>
                      <span className="tnum text-xs text-secondary">
                        {formatPrice(quote.price, quote.currency)}
                      </span>
                      <ChangeValue percent={quote.changePercent} className="w-16 justify-end" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className={cn("mt-3 flex items-center justify-between border-t border-border pt-2.5 text-2xs text-faint")}>
              <span>{moversTab === "gainers" ? "Top gainers" : "Top losers"}</span>
              <span>demo universe · 23 symbols</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
