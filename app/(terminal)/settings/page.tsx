"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  RefreshCw,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/nav";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { ProviderStatus } from "@/lib/providers/types";
import type { TestResult } from "@/lib/providers/connection-test";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/states";

interface StoragePayload {
  database: { ok: boolean; driver: string; path: string | null; error: string | null };
  counts: Record<string, number>;
}

const COUNT_LABELS: Record<string, string> = {
  watchlist_items: "Watchlist symbols",
  portfolio_holdings: "Portfolio holdings",
  alert_rules: "Alert rules",
  saved_searches: "Saved searches",
  research_history: "Research history",
  secrets: "Stored API keys",
};

const KIND_LABELS: Record<string, string> = {
  ai: "AI providers",
  "market-data": "Market data providers",
  news: "News providers",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-150",
        checked ? "bg-accent" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all duration-150",
          checked ? "left-3.5" : "left-0.5",
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------- providers */

function ProviderRow({
  provider,
  draft,
  onDraftChange,
  onSaved,
  onToggle,
  testResult,
  onTest,
  busy,
}: {
  provider: ProviderStatus;
  draft: string;
  onDraftChange: (value: string) => void;
  onSaved: (id: string, key: string) => Promise<void>;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  testResult: TestResult | null;
  onTest: (id: string) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="border-b border-border/60 py-4 last:border-0 last:pb-0 first:pt-0" data-provider-row={provider.id}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {/* identity */}
        <div className="min-w-56 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{provider.name}</span>
            {!provider.adapterImplemented ? (
              <Badge variant="muted">adapter · {provider.plannedIn}</Badge>
            ) : (
              <Badge variant="positive">adapter live</Badge>
            )}
            {!provider.enabled && <Badge variant="negative">disabled</Badge>}
          </div>
          <p className="mt-1 text-2xs leading-relaxed text-muted">{provider.description}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-2xs text-faint">
            {provider.envVar && (
              <code className="mono rounded border border-border bg-background px-1.5 py-0.5">
                {provider.envVar}
              </code>
            )}
            {provider.docsUrl && (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
              >
                docs <ExternalLink className="h-2.5 w-2.5" aria-hidden />
              </a>
            )}
            {provider.keyUrl && (
              <a
                href={provider.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
              >
                get key <ExternalLink className="h-2.5 w-2.5" aria-hidden />
              </a>
            )}
          </div>
        </div>

        {/* status */}
        <div className="flex min-w-40 flex-col gap-1.5">
          {!provider.envVar ? (
            <Badge variant="positive">no key required</Badge>
          ) : provider.configured ? (
            <Badge variant="accent">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              configured ({provider.keySource === "env" ? "env" : "stored"})
            </Badge>
          ) : (
            <Badge variant="muted">not configured</Badge>
          )}
          <Toggle
            checked={provider.enabled}
            onChange={(next) => onToggle(provider.id, next)}
            label={`Enable ${provider.name}`}
          />
        </div>

        {/* key controls */}
        {provider.envVar && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-56">
              <Input
                type="password"
                autoComplete="off"
                spellCheck={false}
                inputSize="sm"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder={
                  provider.configured && provider.keySource === "stored"
                    ? "•••••••• (stored locally)"
                    : provider.configured
                      ? "•••••••• (from environment)"
                      : "Paste API key"
                }
                aria-label={`${provider.name} API key`}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={draft.trim().length === 0}
              loading={busy}
              onClick={() => onSaved(provider.id, draft.trim())}
            >
              Save
            </Button>
            {provider.configured && provider.keySource === "stored" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaved(provider.id, "")}
                title="Remove the stored key"
              >
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onTest(provider.id)}>
              Test
            </Button>
          </div>
        )}
      </div>

      {testResult && (
        <p
          className={cn(
            "mt-2.5 flex items-start gap-1.5 rounded-md border px-3 py-2 text-2xs leading-relaxed",
            testResult.ok
              ? "border-border bg-surface text-secondary"
              : "border-negative/30 bg-negative/[0.05] text-negative",
          )}
        >
          {testResult.ok ? (
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-positive" aria-hidden />
          ) : (
            <XCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          )}
          {testResult.message}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function SettingsPage() {
  const [tab, setTab] = useState<"providers" | "storage" | "about">("providers");
  const providers = useAsyncData<{ providers: ProviderStatus[] }>(
    () => fetchJson("/api/settings/providers"),
    [],
  );
  const storage = useAsyncData<StoragePayload>(() => fetchJson("/api/settings/storage"), []);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, TestResult>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const saveKey = async (id: string, key: string) => {
    setBusyId(id);
    try {
      const response = await fetchJson<{ providers: ProviderStatus[] }>(
        "/api/settings/providers",
        { method: "PUT", body: JSON.stringify({ id, key }) },
      );
      providers.setData?.(response);
      setDrafts((d) => ({ ...d, [id]: "" }));
      setFlash(`${id} key saved to local database`);
      window.setTimeout(() => setFlash(null), 2600);
    } catch (err) {
      setTests((t) => ({
        ...t,
        [id]: { ok: false, requestSent: false, message: err instanceof Error ? err.message : "Save failed" },
      }));
    } finally {
      setBusyId(null);
    }
  };

  const toggleProvider = async (id: string, enabled: boolean) => {
    try {
      const response = await fetchJson<{ providers: ProviderStatus[] }>(
        "/api/settings/providers",
        { method: "PUT", body: JSON.stringify({ id, enabled }) },
      );
      providers.setData?.(response);
    } catch (err) {
      console.error(err);
    }
  };

  const runTest = async (id: string) => {
    try {
      const result = await fetchJson<TestResult>("/api/settings/providers/test", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setTests((t) => ({ ...t, [id]: result }));
    } catch (err) {
      setTests((t) => ({
        ...t,
        [id]: { ok: false, requestSent: false, message: err instanceof Error ? err.message : "Test failed" },
      }));
    }
  };

  const resetAll = async () => {
    setResetBusy(true);
    try {
      await fetchJson("/api/settings/reset", { method: "POST" });
      setResetOpen(false);
      providers.refetch();
      storage.refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setResetBusy(false);
    }
  };

  const tabs = [
    { value: "providers", label: "Providers" },
    { value: "storage", label: "Data & storage" },
    { value: "about", label: "About" },
  ] as const;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Settings"
        description="Bring your own keys, local storage, and app information. Keys never leave this machine."
        actions={
          <div className="flex gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
                  tab === t.value
                    ? "border-accent-border bg-accent-soft text-accent"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {flash && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-positive/30 bg-positive/[0.06] px-4 py-2.5 text-xs text-positive">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {flash}
        </div>
      )}

      {/* -------------------------------------------------------- providers */}
      {tab === "providers" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2.5 rounded-lg border border-accent-border bg-accent-soft px-4 py-3">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                <p className="text-xs leading-relaxed text-secondary">
                  Keys are stored server-side in your local SQLite database (or read from
                  environment variables) and are <span className="text-foreground">never sent
                  to the browser</span>. Use <code className="mono text-2xs">env.example</code>{" "}
                  for environment-based keys. Rotate keys at the provider if a value ever
                  leaks.
                </p>
              </div>
            </CardContent>
          </Card>

          {providers.loading ? (
            <Card>
              <CardContent className="space-y-3 pt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : providers.error ? (
            <ErrorState description={providers.error} onRetry={providers.refetch} />
          ) : (
            (["ai", "market-data", "news"] as const).map((kind) => {
              const group = (providers.data?.providers ?? []).filter((p) => p.kind === kind);
              if (group.length === 0) return null;
              return (
                <Card key={kind}>
                  <CardHeader>
                    <CardTitle>{KIND_LABELS[kind]}</CardTitle>
                    <CardDescription>
                      {kind === "ai"
                        ? "Used by the AI router (adapters in v0.3)"
                        : kind === "market-data"
                          ? "Quotes, fundamentals, filings (adapters in v0.2)"
                          : "Headlines and clustering (adapters in v0.4)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {group.map((provider) => (
                      <ProviderRow
                        key={provider.id}
                        provider={provider}
                        draft={drafts[provider.id] ?? ""}
                        onDraftChange={(value) =>
                          setDrafts((d) => ({ ...d, [provider.id]: value }))
                        }
                        onSaved={saveKey}
                        onToggle={toggleProvider}
                        testResult={tests[provider.id] ?? null}
                        onTest={runTest}
                        busy={busyId === provider.id}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- storage */}
      {tab === "storage" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-muted" aria-hidden />
                Local database
              </CardTitle>
              <Button variant="outline" size="sm" onClick={storage.refetch} loading={storage.loading}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {storage.loading ? (
                <Skeleton className="h-20 w-full" />
              ) : storage.error ? (
                <ErrorState description={storage.error} onRetry={storage.refetch} />
              ) : storage.data ? (
                <div className="space-y-3">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-md border border-border bg-background px-3 py-2.5">
                      <div className="text-2xs uppercase tracking-wider text-faint">Status</div>
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1.5 text-sm font-medium",
                          storage.data.database.ok ? "text-positive" : "text-negative",
                        )}
                      >
                        {storage.data.database.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {storage.data.database.ok ? "Connected" : "Unavailable"}
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-background px-3 py-2.5">
                      <div className="text-2xs uppercase tracking-wider text-faint">Driver</div>
                      <div className="mono mt-1 truncate text-sm text-foreground">
                        {storage.data.database.driver}
                      </div>
                    </div>
                  </div>
                  {storage.data.database.path && (
                    <div className="rounded-md border border-border bg-background px-3 py-2.5">
                      <div className="text-2xs uppercase tracking-wider text-faint">Path</div>
                      <div className="mono mt-1 break-all text-xs text-secondary">
                        {storage.data.database.path}
                      </div>
                    </div>
                  )}
                  {storage.data.database.error && (
                    <p className="rounded-md border border-negative/30 bg-negative/[0.05] px-3 py-2.5 text-xs text-negative">
                      {storage.data.database.error}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {Object.entries(COUNT_LABELS).map(([key, label]) => (
                      <div key={key} className="rounded-md border border-border bg-background px-3 py-2.5">
                        <div className="text-2xs uppercase tracking-wider text-faint">{label}</div>
                        <div className="tnum mt-1 text-lg font-semibold text-foreground">
                          {storage.data?.counts?.[key] ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-negative/30">
            <CardHeader>
              <CardTitle className="text-negative">Danger zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted">
                Deletes every local record — watchlist, portfolio, alerts, saved searches,
                research history, preferences, and stored API keys. This cannot be undone.
              </p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => setResetOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Reset local data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------ about */}
      {tab === "about" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About FinSight</CardTitle>
              <Badge variant="accent">v{APP_VERSION}</Badge>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Release", `v${APP_VERSION} — Foundation (Phase 0)`],
                  ["Mode", "Demo data (mock providers) until live adapters land"],
                  ["License", "MIT — open source"],
                  ["Stack", "Next.js · React · TypeScript · Tailwind CSS"],
                  ["Database", "SQLite via Node's built-in node:sqlite"],
                  ["Architecture", "UI → services → provider registry → adapters"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border bg-background px-3 py-2.5">
                    <dt className="text-2xs uppercase tracking-wider text-faint">{label}</dt>
                    <dd className="mt-1 text-xs text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-secondary">
                {[
                  ["v0.2", "Market data adapters (Alpha Vantage, Finnhub) + company pages"],
                  ["v0.3", "AI router, research agent, citations"],
                  ["v0.4", "News intelligence: RSS/API, clustering, daily brief"],
                  ["v0.5", "Fundamentals, filings, earnings, comparison"],
                  ["v0.6", "Portfolio & watchlist polish"],
                  ["v0.7", "Alert evaluation + notifications"],
                ].map(([version, item]) => (
                  <li key={version} className="flex gap-3">
                    <span className="mono w-10 shrink-0 text-accent">{version}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/overview"
                className="mt-4 inline-block text-xs text-muted transition-colors hover:text-foreground"
              >
                ← Back to terminal
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all local data?"
        description="Watchlist, portfolio, alerts, history and stored keys will be deleted."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={resetAll} loading={resetBusy}>
              Delete everything
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-muted">
          This affects only this machine — FinSight is local-first. There is no cloud copy to
          restore from.
        </p>
      </Modal>
    </div>
  );
}
