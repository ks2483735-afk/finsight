"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { formatMarketCap, formatPercent, formatPrice } from "@/lib/format";
import { generateSeries, windowLabels } from "@/lib/mock/series";
import { getCompany } from "@/lib/mock/companies";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { Company, Fundamentals, HistoryRange, PricePoint, Quote } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import { PageHeader } from "@/components/layout/page-header";
import { Input, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, DataSourceChip, MockBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ChartCard } from "@/components/finance/chart-card";
import { LineChart } from "@/components/finance/line-chart";
import { ChangeValue } from "@/components/finance/change-value";

interface QuotePayload {\n  quotes: Quote[];\n  source: DataSourceInfo;\n}\n\ninterface HistoryPayload {\n  symbol: string;\n  range: HistoryRange;\n  points: PricePoint[];\n  source: DataSourceInfo;\n}\n\ninterface CompaniesPayload {
  companies: Company[];
  source: DataSourceInfo;
}

const RANGES = ["1D", "1W", "1M", "1Y"] as const;

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <div className="text-2xs uppercase tracking-wider text-faint">{label}</div>
      <div className="tnum mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function CompanyDetail({ company }: { company: Company }) {
  const [range, setRange] = useState<HistoryRange>("1M");
  const quoteData = useAsyncData<QuotePayload>(
    () => fetchJson(`/api/market/quotes?symbols=${encodeURIComponent(company.symbol)}`),
    [company.symbol],
  );
  const fundamentals = useAsyncData<FundamentalsPayload>(
    () => fetchJson(`/api/market/fundamentals?symbol=${encodeURIComponent(company.symbol)}`),
    [company.symbol],
  );
  const history = useAsyncData<HistoryPayload>(
    () => fetchJson(`/api/market/history?symbol=${encodeURIComponent(company.symbol)}&range=${range}`),
    [company.symbol, range],
  );

  const liveQuote = quoteData.data?.quotes?.[0];
  const price = liveQuote?.price ?? company.price;
  const change = liveQuote?.change ?? company.change;
  const changePercent = liveQuote?.changePercent ?? company.changePercent;
  const currency = liveQuote?.currency ?? company.currency;
  const liveFundamentals = fundamentals.data?.data;
  const series = history.data?.points.map((point) => point.price) ?? [];
  const labels = history.data?.points.length
    ? [history.data.points[0].timestamp.slice(5, 10), history.data.points[history.data.points.length - 1].timestamp.slice(5, 10)]
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {company.name}
                </h2>
                {liveQuote ? (
                  <DataSourceChip source={quoteData.data!.source} />
                ) : (
                  <MockBadge />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="mono font-medium text-secondary">{company.symbol}</span>
                <span>·</span>
                <span>{company.exchange}</span>
                <span>·</span>
                <span>{company.region === "US" ? "United States" : company.country}</span>
                <Badge variant="muted">{company.sector}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="tnum text-2xl font-semibold text-foreground">
                {formatPrice(price, currency)}
              </div>
              <ChangeValue percent={changePercent} absolute={change} currency={currency} size="md" />
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">{company.about}</p>
        </CardContent>
      </Card>

      <ChartCard
        title="Price history"
        description={
          history.data
            ? `${range} · ${history.data.source.label}`
            : "Loading live provider history…"
        }
        actions={
          <Tabs
            items={RANGES.map((r) => ({ value: r, label: r }))}
            value={range}
            onChange={(v) => setRange(v as HistoryRange)}
            label="Chart range"
          />
        }
      >
        {history.loading ? (
          <Skeleton className="h-48 w-full" />
        ) : history.error ? (
          <div className="py-8 text-center text-xs text-muted">
            Live history is unavailable for this symbol. The current quote can still be live.
          </div>
        ) : (
          <LineChart
            data={series}
            labels={labels}
            height={200}
            prefix={currency === "INR" ? "₹" : "$"}
            compactAxis
          />
        )}
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Key metrics</CardTitle>
          {liveFundamentals ? <DataSourceChip source={fundamentals.data!.source} /> : <Badge variant="accent">demo fallback</Badge>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            <MetricTile label="Market cap" value={formatMarketCap(liveFundamentals?.marketCap ?? company.marketCap, company.currency)} />
            <MetricTile label="P/E" value={(liveFundamentals?.pe ?? company.pe).toFixed(1)} />
            <MetricTile label="P/S" value={(liveFundamentals?.ps ?? company.ps).toFixed(1)} />
            <MetricTile label="P/B" value={(liveFundamentals?.pb ?? company.pb).toFixed(1)} />
            <MetricTile label="ROE" value={`${liveFundamentals?.roe ?? company.roe}%`} />
            <MetricTile label="Revenue growth" value={formatPercent(liveFundamentals?.revenueGrowth ?? company.revenueGrowth, 1)} />
            <MetricTile label="EPS growth" value={formatPercent(liveFundamentals?.epsGrowth ?? company.epsGrowth, 1)} />
            <MetricTile label="Dividend yield" value={`${liveFundamentals?.dividendYield ?? company.dividendYield}%`} />
            <MetricTile label="Debt / equity" value={(liveFundamentals?.debtToEquity ?? company.debtToEquity).toFixed(2)} />
            <MetricTile
              label="52-week range"
              value={`${formatPrice(liveFundamentals?.week52Low ?? company.week52Low, company.currency)} – ${formatPrice(liveFundamentals?.week52High ?? company.week52High, company.currency)}`}
            />
            <MetricTile label="Industry" value={company.industry} />
            <MetricTile label="Currency" value={currency} />
          </div>
        </CardContent>
      </Card>

      <p className="text-2xs text-faint">
        Market price, history, and fundamentals are live when a configured provider supports the symbol; unsupported fields fall back to the demo universe.
      </p>
    </div>
  );
}



export default function CompaniesPage() {
  const params = useSearchParams();
  const symbol = params.get("symbol");
  const company = symbol ? getCompany(symbol) : undefined;

  if (!company) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Companies"
          description="Explore company quotes and market data."
        />
        <EmptyState
          title="Company not found"
          description="Select a company from the markets page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Live quotes, fundamentals, and historical market data."
      />
      <CompanyDetail company={company} />
    </div>
  );
}
