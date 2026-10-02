"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { generateSeries } from "@/lib/mock/series";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { Quote } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceChip } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { MetricCard } from "@/components/finance/metric-card";
import { ChangeValue } from "@/components/finance/change-value";
import { Sparkline } from "@/components/finance/sparkline";
import { Inbox } from "lucide-react";

interface IndicesPayload {
  indices: Quote[];
  source: DataSourceInfo;
}

interface QuotesPayload {
  quotes: Quote[];
  source: DataSourceInfo;
}

const FUTURE_ASSETS = ["Forex", "Crypto", "Commodities"];

export default function MarketsPage() {
  const router = useRouter();
  const [region, setRegion] = useState("ALL");
  const [asset, setAsset] = useState<"stock" | "etf">("stock");

  const indices = useAsyncData<IndicesPayload>(() => fetchJson("/api/market/indices"), []);
  const quotes = useAsyncData<QuotesPayload>(() => fetchJson("/api/market/quotes?all=1"), []);

  const refresh = () => {
    indices.refetch();
    quotes.refetch();
  };

  const rows = useMemo(() => {
    const all = quotes.data?.quotes ?? [];
    return all.filter(
      (q) =>
        (region === "ALL" || q.region === region) &&
        // Index quotes are not part of the equity table (shown above).
        !q.symbol.startsWith("^"),
    );
  }, [quotes.data, region]);

  // Asset class: stocks vs ETFs (equity table includes both; filter by asset).
  const visibleRows = useMemo(() => {
    const etfSymbols = new Set(["SPY", "QQQ", "NIFTYBEES"]);
    return rows.filter((q) =>
      asset === "etf" ? etfSymbols.has(q.symbol) : !etfSymbols.has(q.symbol),
    );
  }, [rows, asset]);

  const columns: Column<Quote>[] = [
    {
      key: "symbol",
      header: "Symbol",
      sortValue: (q) => q.symbol,
      cell: (q) => (
        <span className="mono font-semibold text-foreground">{q.symbol}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (q) => <span className="text-secondary">{q.name}</span>,
    },
    {
      key: "exchange",
      header: "Exchange",
      cell: (q) => <span className="text-muted">{q.exchange}</span>,
    },
    {
      key: "region",
      header: "Market",
      cell: (q) => <span className="text-muted">{q.region === "US" ? "US" : "India"}</span>,
    },
    {
      key: "price",
      header: "Last",
      numeric: true,
      sortValue: (q) => q.price,
      cell: (q) => formatPrice(q.price, q.currency),
    },
    {
      key: "change",
      header: "Change",
      numeric: true,
      sortValue: (q) => q.change,
      cell: (q) => (
        <ChangeValue percent={q.changePercent} absolute={q.change} currency={q.currency} />
      ),
    },
    {
      key: "chgPct",
      header: "%",
      numeric: true,
      sortValue: (q) => q.changePercent,
      cell: (q) => <ChangeValue percent={q.changePercent} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Indices, equities, and ETFs across US and Indian exchanges — served through the market-data provider pipeline."
        actions={
          <>
            {quotes.data ? <DataSourceChip source={quotes.data.source} /> : null}
            <Button variant="outline" size="sm" onClick={refresh} loading={quotes.loading}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </Button>
          </>
        }
      />

      {/* --------------------------------------------------------- controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs
          items={[
            { value: "ALL", label: "All markets" },
            { value: "US", label: "US" },
            { value: "IN", label: "India" },
          ]}
          value={region}
          onChange={setRegion}
          label="Region"
        />
        <Tabs
          items={[
            { value: "stock", label: "Stocks" },
            { value: "etf", label: "ETFs" },
          ]}
          value={asset}
          onChange={(v) => setAsset(v as "stock" | "etf")}
          label="Asset class"
        />
        <div className="flex items-center gap-1.5">
          {FUTURE_ASSETS.map((label) => (
            <Tooltip key={label} label={`Arrives with live providers (v0.2+)`}>
              <span className="inline-flex h-7 cursor-not-allowed items-center rounded-md border border-border px-2.5 text-xs text-faint opacity-60">
                {label}
              </span>
            </Tooltip>
          ))}
        </div>
        {quotes.data && <div className="ml-auto"><DataSourceChip source={quotes.data.source} /></div>}
      </div>

      {/* ----------------------------------------------------------- indices */}
      {indices.error ? (
        <div className="mb-5">
          <ErrorState description={indices.error} onRetry={indices.refetch} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {indices.loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <MetricCard key={i} label="—" value="" loading />
              ))
            : (indices.data?.indices ?? [])
                .filter((q) => region === "ALL" || q.region === region)
                .map((index) => (
                  <MetricCard
                    key={index.symbol}
                    label={index.name}
                    value={formatPrice(index.price, index.currency)}
                    delta={<ChangeValue percent={index.changePercent} />}
                    chart={
                      <Sparkline
                        data={generateSeries(`mkt-${index.symbol}`, {
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
      )}

      {/* ------------------------------------------------------------- table */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {asset === "etf" ? "ETFs" : "Equities"}
            <span className="ml-2 text-2xs font-normal text-faint">
              {visibleRows.length} symbols
            </span>
          </h2>
        </div>

        {quotes.loading ? (
          <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : quotes.error ? (
          <ErrorState description={quotes.error} onRetry={quotes.refetch} />
        ) : (
          <DataTable
            columns={columns}
            rows={visibleRows}
            rowKey={(q) => q.symbol}
            onRowClick={(q) => router.push(`/companies?symbol=${q.symbol}`)}
            minWidth="860px"
            empty={
              <EmptyState
                icon={Inbox}
                title="No symbols match this filter"
                description="Try another market or asset class."
              />
            }
          />
        )}
      </div>

      <p className={cn("mt-4 text-2xs text-faint")}>
        Equity quotes use configured live providers when available. Indices and unsupported
        operations may still use demo data until their dedicated adapters ship.
      </p>
    </div>
  );
}
