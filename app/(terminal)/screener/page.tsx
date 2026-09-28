"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, Play, RotateCcw, Sparkles } from "lucide-react";
import { fetchJson } from "@/lib/hooks/use-async-data";
import type { Company } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import {
  EMPTY_FILTERS,
  parseScreeningQuery,
  type Criteria,
  type ScreenerFilters,
} from "@/lib/screener/parse";
import { SECTORS } from "@/lib/mock/companies";
import { formatMarketCap } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge, DataSourceChip, MockBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ChangeValue } from "@/components/finance/change-value";

interface ScreenerPayload {
  results: Company[];
  total: number;
  matched: number;
  source: DataSourceInfo;
}

interface FormState {
  region: "ALL" | "US" | "IN";
  sector: string;
  assetClass: "stock" | "etf" | "ALL";
  marketCapMin: string;
  peMax: string;
  roeMin: string;
  dividendYieldMin: string;
  revenueGrowthMin: string;
  debtToEquityMax: string;
}

const EMPTY_FORM: FormState = {
  region: "ALL",
  sector: "ALL",
  assetClass: "stock",
  marketCapMin: "",
  peMax: "",
  roeMin: "",
  dividendYieldMin: "",
  revenueGrowthMin: "",
  debtToEquityMax: "",
};

function num(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFilters(form: FormState): ScreenerFilters {
  const criteria: Criteria = {};
  const marketCapMin = num(form.marketCapMin);
  const peMax = num(form.peMax);
  const roeMin = num(form.roeMin);
  const dividendYieldMin = num(form.dividendYieldMin);
  const revenueGrowthMin = num(form.revenueGrowthMin);
  const debtToEquityMax = num(form.debtToEquityMax);

  if (marketCapMin !== undefined) criteria.marketCap = { min: marketCapMin };
  if (peMax !== undefined) criteria.pe = { max: peMax };
  if (roeMin !== undefined) criteria.roe = { min: roeMin };
  if (dividendYieldMin !== undefined) criteria.dividendYield = { min: dividendYieldMin };
  if (revenueGrowthMin !== undefined) criteria.revenueGrowth = { min: revenueGrowthMin };
  if (debtToEquityMax !== undefined) criteria.debtToEquity = { max: debtToEquityMax };

  return {
    region: form.region,
    sector: form.sector,
    assetClass: form.assetClass,
    criteria,
  };
}

/** Reflect parsed criteria back into the structured form where possible. */
function criteriaToForm(filters: ScreenerFilters): FormState {
  const c = filters.criteria;
  return {
    region: filters.region,
    sector: filters.sector,
    assetClass: filters.assetClass,
    marketCapMin: c.marketCap?.min !== undefined ? String(c.marketCap.min) : "",
    peMax: c.pe?.max !== undefined ? String(c.pe.max) : "",
    roeMin: c.roe?.min !== undefined ? String(c.roe.min) : "",
    dividendYieldMin: c.dividendYield?.min !== undefined ? String(c.dividendYield.min) : "",
    revenueGrowthMin: c.revenueGrowth?.min !== undefined ? String(c.revenueGrowth.min) : "",
    debtToEquityMax: c.debtToEquity?.max !== undefined ? String(c.debtToEquity.max) : "",
  };
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<ScreenerFilters>(EMPTY_FILTERS);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [nlText, setNlText] = useState("");
  const [nlMessage, setNlMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [data, setData] = useState<ScreenerPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Run whenever filters change (initial run uses the default filter set).
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchJson<ScreenerPayload>("/api/screener", {
      method: "POST",
      body: JSON.stringify({ filters }),
    })
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : "Screening failed");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [filters, nonce]);

  const applyFilters = useCallback((next: ScreenerFilters) => {
    setFilters(next);
    setNonce((n) => n + 1);
  }, []);

  const parseQuery = () => {
    const text = nlText.trim();
    if (!text) {
      setNlMessage({ ok: false, text: "Enter a screening question first." });
      return;
    }
    const result = parseScreeningQuery(text);
    setNlMessage({ ok: result.ok, text: result.message });
    setConditions(
      result.conditions.map((c) => `${c.label} ${c.op} ${c.value}${c.unit ?? ""}`),
    );
    if (result.ok) {
      setForm(criteriaToForm(result.filters));
      applyFilters(result.filters);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setNlText("");
    setNlMessage(null);
    setConditions([]);
    applyFilters(EMPTY_FILTERS);
  };

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
      key: "market",
      header: "Market",
      cell: (c) => <span className="text-muted">{c.region === "US" ? "US" : "India"}</span>,
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
      key: "div",
      header: "Div yield",
      numeric: true,
      sortValue: (c) => c.dividendYield,
      cell: (c) => `${c.dividendYield}%`,
    },
    {
      key: "chg",
      header: "%",
      numeric: true,
      sortValue: (c) => c.changePercent,
      cell: (c) => <ChangeValue percent={c.changePercent} />,
    },
  ];

  const activeCriteria = Object.entries(filters.criteria).filter(([, v]) => v);

  return (
    <div>
      <PageHeader
        title="Screener"
        description="Filter the demo universe with structured controls or plain English. Parsing is deterministic — no AI involved."
        actions={
          <>
            <MockBadge />
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-4">
        {/* -------------------------------------------------- filter panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted" aria-hidden />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* natural language */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-secondary">
                Ask in plain English
              </span>
              <div className="flex gap-2">
                <Input
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") parseQuery();
                  }}
                  placeholder="Indian companies with ROE > 20%"
                  aria-label="Natural language screening query"
                />
                <Button variant="secondary" size="sm" onClick={parseQuery} className="shrink-0">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Parse
                </Button>
              </div>
              {nlMessage && (
                <p
                  className={
                    nlMessage.ok
                      ? "mt-1.5 text-2xs text-accent"
                      : "mt-1.5 text-2xs text-negative"
                  }
                >
                  {nlMessage.text}
                </p>
              )}
              {conditions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {conditions.map((condition) => (
                    <Badge key={condition} variant="accent">
                      {condition}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <span className="mb-1.5 block text-xs font-medium text-secondary">
                Structured filters
              </span>
              <div className="space-y-3">
                <Select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value as FormState["region"] })}
                  aria-label="Region"
                >
                  <option value="ALL">All markets</option>
                  <option value="US">US</option>
                  <option value="IN">India</option>
                </Select>
                <Select
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  aria-label="Sector"
                >
                  <option value="ALL">All sectors</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  value={form.marketCapMin}
                  onChange={(e) => setForm({ ...form, marketCapMin: e.target.value })}
                  placeholder="Min market cap (billions)"
                  aria-label="Minimum market cap in billions"
                />
                <Input
                  type="number"
                  value={form.peMax}
                  onChange={(e) => setForm({ ...form, peMax: e.target.value })}
                  placeholder="Max P/E"
                  aria-label="Maximum P/E"
                />
                <Input
                  type="number"
                  value={form.roeMin}
                  onChange={(e) => setForm({ ...form, roeMin: e.target.value })}
                  placeholder="Min ROE (%)"
                  aria-label="Minimum ROE percent"
                />
                <Input
                  type="number"
                  value={form.dividendYieldMin}
                  onChange={(e) => setForm({ ...form, dividendYieldMin: e.target.value })}
                  placeholder="Min dividend yield (%)"
                  aria-label="Minimum dividend yield percent"
                />
                <Input
                  type="number"
                  value={form.revenueGrowthMin}
                  onChange={(e) => setForm({ ...form, revenueGrowthMin: e.target.value })}
                  placeholder="Min revenue growth (%)"
                  aria-label="Minimum revenue growth percent"
                />
                <Input
                  type="number"
                  value={form.debtToEquityMax}
                  onChange={(e) => setForm({ ...form, debtToEquityMax: e.target.value })}
                  placeholder="Max debt/equity"
                  aria-label="Maximum debt to equity"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => applyFilters(buildFilters(form))}
              loading={loading}
            >
              <Play className="h-3.5 w-3.5" aria-hidden />
              Run screen
            </Button>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------ results */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {loading ? "Screening…" : `${data?.matched ?? 0} of ${data?.total ?? 0} match`}
              </h2>
              {activeCriteria.length > 0 && (
                <span className="text-2xs text-faint">
                  {activeCriteria.length} active filter{activeCriteria.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {data && <DataSourceChip source={data.source} />}
          </div>

          {loading && !data ? (
            <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState description={error} onRetry={() => setNonce((n) => n + 1)} />
          ) : data ? (
            <DataTable
              columns={columns}
              rows={data.results}
              rowKey={(c) => c.symbol}
              minWidth="820px"
              dense
              empty={
                <EmptyState
                  icon={Filter}
                  title="No companies match these filters"
                  description="Loosen a condition — the demo universe holds 23 symbols across US and India."
                />
              }
            />
          ) : null}

          <p className="mt-3 text-2xs text-faint">
            All conditions run as deterministic code over demo data. Natural-language parsing
            is regex-based in v0.1; AI-assisted filtering arrives later.
          </p>
        </div>
      </div>
    </div>
  );
}
