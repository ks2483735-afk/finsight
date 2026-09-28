"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { formatMarketCap, formatPercent, formatPrice } from "@/lib/format";
import { generateSeries, windowLabels } from "@/lib/mock/series";
import { SECTORS } from "@/lib/mock/companies";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { Company } from "@/lib/market-data/types";
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

interface CompaniesPayload {
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
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M");
  const series = generateSeries(`company-${company.symbol}-${range}`, {
    points: range === "1D" ? 26 : range === "1W" ? 35 : range === "1M" ? 44 : 60,
    endValue: company.price,
    trend: range === "1Y" ? company.changePercent / 40 : company.changePercent / 100,
    volatility: range === "1D" ? 0.003 : range === "1Y" ? 0.012 : 0.006,
  });

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
                <MockBadge />
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
                {formatPrice(company.price, company.currency)}
              </div>
              <ChangeValue percent={company.changePercent} absolute={company.change} currency={company.currency} size="md" />
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">{company.about}</p>
        </CardContent>
      </Card>

      <ChartCard
        title="Price"
        description={`${range} demo window · deterministic series`}
        actions={
          <Tabs
            items={RANGES.map((r) => ({ value: r, label: r }))}
            value={range}
            onChange={(v) => setRange(v as (typeof RANGES)[number])}
            label="Chart range"
          />
        }
      >
        <LineChart
          data={series}
          labels={windowLabels(range)}
          height={200}
          prefix={company.currency === "INR" ? "₹" : "$"}
          compactAxis
        />
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Key metrics</CardTitle>
          <Badge variant="accent">demo fundamentals</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            <MetricTile label="Market cap" value={formatMarketCap(company.marketCap, company.currency)} />
            <MetricTile label="P/E" value={company.pe.toFixed(1)} />
            <MetricTile label="P/S" value={company.ps.toFixed(1)} />
            <MetricTile label="P/B" value={company.pb.toFixed(1)} />
            <MetricTile label="ROE" value={`${company.roe}%`} />
            <MetricTile label="Revenue growth" value={formatPercent(company.revenueGrowth, 1)} />
            <MetricTile label="EPS growth" value={formatPercent(company.epsGrowth, 1)} />
            <MetricTile label="Dividend yield" value={`${company.dividendYield}%`} />
            <MetricTile label="Debt / equity" value={company.debtToEquity.toFixed(2)} />
            <MetricTile
              label="52-week range"
              value={`${formatPrice(company.week52Low, company.currency)} – ${formatPrice(company.week52High, company.currency)}`}
            />
            <MetricTile label="Industry" value={company.industry} />
            <MetricTile label="Currency" value={company.currency} />
          </div>
        </CardContent>
      </Card>

      <p className="text-2xs text-faint">
        Financials, earnings, filings, and AI analysis tabs arrive in v0.2–v0.5 (spec §9).
      </p>
    </div>
  );
}

function CompaniesView() {
  const params = useSearchParams();
  const initialSymbol = params.get("symbol");
  const { data, loading, error, refetch } = useAsyncData<CompaniesPayload>(
    () => fetchJson("/api/companies"),
    [],
  );

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("ALL");
  const [sector, setSector] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(initialSymbol);

  const companies = data?.companies ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      if (region !== "ALL" && c.region !== region) return false;
      if (sector !== "ALL" && c.sector !== sector) return false;
      if (q && !c.symbol.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [companies, query, region, sector]);

  const active =
    companies.find((c) => c.symbol === selected) ?? filtered[0] ?? null;

  const columns: Column<Company>[] = [
    {
      key: "symbol",
      header: "Symbol",
      sortValue: (c) => c.symbol,
      cell: (c) => <span className="mono font-semibold text-foreground">{c.symbol}</span>,
    },
    {
      key: "name",
      header: "Company",
      cell: (c) => <span className="text-secondary">{c.name}</span>,
    },
    {
      key: "sector",
      header: "Sector",
      cell: (c) => <span className="text-muted">{c.sector}</span>,
    },
    {
      key: "mktcap",
      header: "Mkt cap",
      numeric: true,
      sortValue: (c) => c.marketCap,
      cell: (c) => formatMarketCap(c.marketCap, c.currency),
    },
    {
      key: "pe",
      header: "P/E",
      numeric: true,
      sortValue: (c) => c.pe,
      cell: (c) => c.pe.toFixed(1),
    },
    {
      key: "roe",
      header: "ROE",
      numeric: true,
      sortValue: (c) => c.roe,
      cell: (c) => `${c.roe}%`,
    },
    {
      key: "chg",
      header: "%",
      numeric: true,
      sortValue: (c) => c.changePercent,
      cell: (c) => <ChangeValue percent={c.changePercent} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Research directory with demo fundamentals. Select a row to inspect metrics and a price chart."
        actions={
          <>
            <MockBadge />
            {data && <DataSourceChip source={data.source} />}
          </>
        }
      />

      {/* ---------------------------------------------------------- filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by symbol or name…"
            className="pl-8"
            aria-label="Filter companies"
          />
        </div>
        <Tabs
          items={[
            { value: "ALL", label: "All" },
            { value: "US", label: "US" },
            { value: "IN", label: "India" },
          ]}
          value={region}
          onChange={setRegion}
          label="Region"
        />
        <Select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-48"
          aria-label="Sector"
        >
          <option value="ALL">All sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="space-y-2.5 rounded-lg border border-border bg-card p-4 xl:col-span-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg xl:col-span-2" />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(c) => c.symbol}
              onRowClick={(c) => setSelected(c.symbol)}
              minWidth="640px"
              dense
              empty={
                <EmptyState
                  title="No companies match"
                  description="Adjust the filters — the demo universe has 23 symbols (US + India)."
                />
              }
            />
            <p className="mt-2.5 text-2xs text-faint">
              Showing {filtered.length} of {companies.length} symbols · demo fundamentals
            </p>
          </div>

          <div className="xl:col-span-2 xl:sticky xl:top-20">
            {active ? (
              <CompanyDetail key={active.symbol} company={active} />
            ) : (
              <EmptyState
                title="Select a company"
                description="Pick a row to see price, metrics, and fundamentals."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="py-8"><Skeleton className="h-96 w-full rounded-lg" /></div>}>
      <CompaniesView />
    </Suspense>
  );
}
