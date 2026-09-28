"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import { formatPrice, formatPercent } from "@/lib/format";
import type { Company } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import type { HoldingRow } from "@/lib/database/repos/portfolio";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { MockBadge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { MetricCard } from "@/components/finance/metric-card";
import { ChangeValue } from "@/components/finance/change-value";

interface EnrichedHolding extends HoldingRow {
  quote: import("@/lib/market-data/types").Quote | null;
  value: number | null;
  invested: number;
  pl: number | null;
  plPct: number | null;
  todayPl: number | null;
  weight: number | null;
}

interface CurrencySummary {
  invested: number;
  value: number;
  pl: number;
  plPct: number;
  todayPl: number;
}

interface PortfolioPayload {
  holdings: EnrichedHolding[];
  byCurrency: Record<string, CurrencySummary>;
  allocation: Array<{ sector: string; valueUsd: number; pct: number }>;
  totalUsd: number;
  fxNote: string;
  hasDemoRows: boolean;
}

const ALLOCATION_COLORS = ["#e6b04c", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#2f2f2f"];

/** Convert a per-currency amount to USD at the demo rate. */
function toUsd(amount: number, currency: string): number {
  return currency === "INR" ? amount / 88.4 : amount;
}

export default function PortfolioPage() {
  const { data, loading, error, refetch } = useAsyncData<PortfolioPayload>(
    () => fetchJson("/api/portfolio"),
    [],
  );
  const companies = useAsyncData<{ companies: Company[] }>(
    () => fetchJson("/api/companies"),
    [],
  );

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", quantity: "", avgCost: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const summary = data?.byCurrency ?? {};
  const investedUsd = Object.entries(summary).reduce(
    (acc, [currency, s]) => acc + toUsd(s.invested, currency),
    0,
  );
  const todayUsd = Object.entries(summary).reduce(
    (acc, [currency, s]) => acc + toUsd(s.todayPl, currency),
    0,
  );
  const plUsd = (data?.totalUsd ?? 0) - investedUsd;
  const plPctUsd = investedUsd > 0 ? (plUsd / investedUsd) * 100 : 0;

  const submitHolding = async () => {
    setFormError(null);
    setSaving(true);
    try {
      await fetchJson("/api/portfolio", {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          symbol: form.symbol.trim().toUpperCase(),
          quantity: Number(form.quantity),
          avgCost: Number(form.avgCost),
        }),
      });
      setAddOpen(false);
      setForm({ symbol: "", quantity: "", avgCost: "" });
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add holding");
    } finally {
      setSaving(false);
    }
  };

  const loadDemo = async () => {
    try {
      await fetchJson("/api/portfolio", {
        method: "POST",
        body: JSON.stringify({ action: "demo" }),
      });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const removeHolding = async (id: number) => {
    try {
      await fetchJson("/api/portfolio", { method: "DELETE", body: JSON.stringify({ id }) });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<EnrichedHolding>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (h) => (
        <span className="flex items-center gap-1.5">
          <span className="mono font-semibold text-foreground">{h.symbol}</span>
          {h.isDemo && (
            <span className="rounded border border-accent-border bg-accent-soft px-1 text-2xs uppercase tracking-wider text-accent">
              demo
            </span>
          )}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      numeric: true,
      sortValue: (h) => h.quantity,
      cell: (h) => h.quantity,
    },
    {
      key: "avg",
      header: "Avg cost",
      numeric: true,
      sortValue: (h) => h.avgCost,
      cell: (h) => formatPrice(h.avgCost, h.currency),
    },
    {
      key: "ltp",
      header: "LTP",
      numeric: true,
      sortValue: (h) => h.quote?.price ?? 0,
      cell: (h) => (h.quote ? formatPrice(h.quote.price, h.quote.currency) : "—"),
    },
    {
      key: "value",
      header: "Value",
      numeric: true,
      sortValue: (h) => h.value ?? 0,
      cell: (h) => (h.value !== null ? formatPrice(h.value, h.currency) : "—"),
    },
    {
      key: "pl",
      header: "P/L",
      numeric: true,
      sortValue: (h) => h.pl ?? 0,
      cell: (h) => (h.pl !== null ? <ChangeValue percent={h.plPct} absolute={h.pl} currency={h.currency} showIcon={false} /> : "—"),
    },
    {
      key: "today",
      header: "Today",
      numeric: true,
      sortValue: (h) => h.todayPl ?? 0,
      cell: (h) => (h.todayPl !== null ? <ChangeValue percent={h.quote?.changePercent ?? 0} absolute={h.todayPl} currency={h.currency} showIcon={false} /> : "—"),
    },
    {
      key: "weight",
      header: "Weight",
      numeric: true,
      sortValue: (h) => h.weight ?? 0,
      cell: (h) => (h.weight !== null ? `${h.weight.toFixed(1)}%` : "—"),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (h) => (
        <button
          type="button"
          onClick={() => removeHolding(h.id)}
          aria-label={`Remove ${h.symbol}`}
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
        title="Portfolio"
        description="Local holdings with demo prices — invested amount, P/L, and allocation. No broker connection (by design, v0.1)."
        actions={
          <>
            <MockBadge />
            <Button variant="secondary" size="sm" onClick={loadDemo} disabled={loading}>
              Load demo portfolio
            </Button>
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add holding
            </Button>
          </>
        }
      />

      {error && <div className="mb-5"><ErrorState description={error} onRetry={refetch} /></div>}

      {/* --------------------------------------------------------- summary */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Total value"
          value={data ? `$${Math.round(data.totalUsd).toLocaleString("en-US")}` : "—"}
          hint="USD equiv."
          loading={loading}
        />
        <MetricCard
          label="Invested"
          value={data ? `$${Math.round(investedUsd).toLocaleString("en-US")}` : "—"}
          hint="cost basis"
          loading={loading}
        />
        <MetricCard
          label="Today's P/L"
          value={data ? `${todayUsd >= 0 ? "+" : "-"}$${Math.abs(Math.round(todayUsd)).toLocaleString("en-US")}` : "—"}
          delta={data ? <ChangeValue percent={investedUsd > 0 ? (todayUsd / investedUsd) * 100 : 0} showIcon={false} /> : undefined}
          loading={loading}
        />
        <MetricCard
          label="Total P/L"
          value={data ? `${plUsd >= 0 ? "+" : "-"}$${Math.abs(Math.round(plUsd)).toLocaleString("en-US")}` : "—"}
          delta={data ? <ChangeValue percent={plPctUsd} showIcon={false} /> : undefined}
          loading={loading}
        />
      </div>

      {data && Object.keys(summary).length > 0 && (
        <p className="mt-2.5 text-2xs text-faint">
          {Object.entries(summary)
            .map(([currency, s]) => {
              const symbol = currency === "INR" ? "₹" : "$";
              return `${currency}: value ${symbol}${Math.round(s.value).toLocaleString("en-US")} · P/L ${s.pl >= 0 ? "+" : ""}${symbol}${Math.round(s.pl).toLocaleString("en-US")} (${formatPercent(s.plPct)})`;
            })
            .join("   ·   ")}
          {"   ·   "}
          {data.fxNote}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ---------------------------------------------------- allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Allocation by sector</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : data && data.allocation.length > 0 ? (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-elevated">
                  {data.allocation.map((slice, i) => (
                    <div
                      key={slice.sector}
                      style={{
                        width: `${slice.pct}%`,
                        backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                      }}
                      title={`${slice.sector} ${slice.pct.toFixed(1)}%`}
                    />
                  ))}
                </div>
                <ul className="mt-4 space-y-2">
                  {data.allocation.map((slice, i) => (
                    <li key={slice.sector} className="flex items-center gap-2.5 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-secondary">{slice.sector}</span>
                      <span className="tnum text-faint">${Math.round(slice.valueUsd).toLocaleString("en-US")}</span>
                      <span className="tnum w-12 text-right text-foreground">{slice.pct.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No allocation yet"
                description="Add holdings or load the demo portfolio."
                action={{ label: "Load demo portfolio", onClick: loadDemo }}
              />
            )}
          </CardContent>
        </Card>

        {/* ----------------------------------------------------- holdings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
              <span className="text-2xs text-faint">
                {data?.holdings.length ?? 0} positions · prices: demo
              </span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-full" />
                  ))}
                </div>
              ) : data && data.holdings.length > 0 ? (
                <DataTable
                  columns={columns}
                  rows={data.holdings}
                  rowKey={(h) => h.id}
                  minWidth="880px"
                  dense
                  className="border-0"
                />
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="Portfolio is empty"
                  description="Track your positions locally — or load the labeled demo portfolio to explore the UI."
                  action={{ label: "Load demo portfolio", onClick: loadDemo }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --------------------------------------------------------- add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add holding"
        description="Stored in your local SQLite database."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submitHolding}
              loading={saving}
              disabled={!form.symbol || !form.quantity || form.avgCost === ""}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Symbol" hint="Demo universe: AAPL, NVDA, TCS, RELIANCE…">
            <Input
              list="portfolio-symbols"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="AAPL"
            />
            <datalist id="portfolio-symbols">
              {(companies.data?.companies ?? []).map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <Input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
              />
            </Field>
            <Field label="Average cost" hint="per share, listing currency">
              <Input
                type="number"
                min="0"
                step="any"
                value={form.avgCost}
                onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
                placeholder="150.00"
              />
            </Field>
          </div>
          {formError && <p className="text-xs text-negative">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
}
