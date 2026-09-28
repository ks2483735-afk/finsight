"use client";

import { useState } from "react";
import { Bell, Info, Plus, Trash2 } from "lucide-react";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import { formatPercent, formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import type { AlertRow, AlertRuleType } from "@/lib/database/repos/alerts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge, MockBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ChangeValue } from "@/components/finance/change-value";

interface AlertItem extends AlertRow {
  quote: Quote | null;
}

interface AlertsPayload {
  alerts: AlertItem[];
  source: DataSourceInfo | null;
}

const RULE_LABELS: Record<AlertRuleType, string> = {
  price_above: "Price above",
  price_below: "Price below",
  pct_move: "Daily move over",
};

function ruleText(alert: AlertItem): string {
  if (alert.ruleType === "pct_move") return `| move | > ${alert.threshold}%`;
  const symbol = alert.quote?.currency === "INR" ? "₹" : alert.quote?.currency === "USD" ? "$" : "";
  return `price ${alert.comparator} ${symbol}${alert.threshold}`;
}

export default function AlertsPage() {
  const { data, loading, error, refetch } = useAsyncData<AlertsPayload>(
    () => fetchJson("/api/alerts"),
    [],
  );
  const companies = useAsyncData<{ companies: Array<{ symbol: string; name: string }> }>(
    () => fetchJson("/api/companies"),
    [],
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", ruleType: "price_above" as AlertRuleType, threshold: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setFormError(null);
    setSaving(true);
    try {
      await fetchJson("/api/alerts", {
        method: "POST",
        body: JSON.stringify({
          symbol: form.symbol.trim().toUpperCase(),
          ruleType: form.ruleType,
          threshold: Number(form.threshold),
        }),
      });
      setOpen(false);
      setForm({ symbol: "", ruleType: "price_above", threshold: "" });
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await fetchJson("/api/alerts", { method: "DELETE", body: JSON.stringify({ id }) });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<AlertItem>[] = [
    {
      key: "symbol",
      header: "Symbol",
      cell: (alert) => <span className="mono font-semibold text-foreground">{alert.symbol}</span>,
    },
    {
      key: "rule",
      header: "Rule",
      cell: (alert) => (
        <span className="text-secondary">
          <span className="text-muted">{RULE_LABELS[alert.ruleType]}</span>{" "}
          <span className="tnum text-foreground">{ruleText(alert)}</span>
        </span>
      ),
    },
    {
      key: "current",
      header: "Current",
      numeric: true,
      sortValue: (alert) => alert.quote?.price ?? 0,
      cell: (alert) =>
        alert.quote ? (
          <span className="flex items-center justify-end gap-2">
            <span className="tnum">{formatPrice(alert.quote.price, alert.quote.currency)}</span>
            <ChangeValue percent={alert.quote.changePercent} />
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => (
        <Badge variant="muted" title="Rule evaluation ships in v0.7">
          stored · eval v0.7
        </Badge>
      ),
    },
    {
      key: "created",
      header: "Created",
      cell: (alert) => <span className="text-2xs text-faint">{alert.createdAt.slice(0, 10)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (alert) => (
        <button
          type="button"
          onClick={() => remove(alert.id)}
          aria-label="Delete alert"
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
        title="Alerts"
        description="Local alert rules for price thresholds and percentage moves — stored in SQLite on this machine."
        actions={
          <>
            <MockBadge />
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New alert
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-surface px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        <p className="text-xs leading-relaxed text-muted">
          v0.1 stores and manages rules locally. Evaluation, browser notifications, and
          earnings/filing alerts arrive in <span className="text-secondary">v0.7</span>. Current
          prices shown below are demo data.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.alerts ?? []}
          rowKey={(alert) => alert.id}
          minWidth="820px"
          dense
          empty={
            <EmptyState
              icon={Bell}
              title="No alert rules yet"
              description='Create a rule like "alert me when NVDA moves more than 4% in a day".'
              action={{ label: "New alert", onClick: () => setOpen(true) }}
            />
          }
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New alert rule"
        description="Saved to your local database."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={create}
              loading={saving}
              disabled={!form.symbol || form.threshold === ""}
            >
              Create rule
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Symbol">
            <Input
              list="alert-symbols"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="NVDA"
            />
            <datalist id="alert-symbols">
              {(companies.data?.companies ?? []).map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rule">
              <Select
                value={form.ruleType}
                onChange={(e) =>
                  setForm({ ...form, ruleType: e.target.value as AlertRuleType })
                }
              >
                <option value="price_above">Price above</option>
                <option value="price_below">Price below</option>
                <option value="pct_move">Daily move over %</option>
              </Select>
            </Field>
            <Field
              label={form.ruleType === "pct_move" ? "Threshold (%)" : "Threshold (price)"}
            >
              <Input
                type="number"
                step="any"
                min="0"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                placeholder={form.ruleType === "pct_move" ? "4" : "200"}
              />
            </Field>
          </div>
          {formError && <p className="text-xs text-negative">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
}
