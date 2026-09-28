"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BrainCircuit,
  CheckCircle2,
  CircleSlash,
  ClipboardList,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { fetchJson, useAsyncData } from "@/lib/hooks/use-async-data";
import type { ResearchResult } from "@/lib/ai/types";
import { GlobalSearch } from "@/components/layout/global-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, DataSourceChip, MockBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, UnavailableState } from "@/components/ui/states";
import { StockCard } from "@/components/finance/stock-card";
import { NewsCard } from "@/components/finance/news-card";

const EXAMPLES = [
  "Why is NVDA down today?",
  "Compare TCS and Infosys.",
  "What is moving RELIANCE?",
];

/* ------------------------------------------------------------------ hero */

function ResearchHero() {
  return (
    <div className="mx-auto max-w-3xl py-10 sm:py-16">
      <div className="flex justify-center">
        <Badge variant="accent" className="uppercase tracking-wider">
          Research pipeline · v0.1
        </Badge>
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Ask a financial question.
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted">
        FinSight collects market, news, and filing evidence first — then interprets it with
        your configured AI provider. Evidence and interpretation stay clearly separated.
      </p>

      <div className="mt-8">
        <GlobalSearch variant="hero" autoFocus />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-2xs text-faint">Try:</span>
        {EXAMPLES.map((example) => (
          <a
            key={example}
            href={`/research?q=${encodeURIComponent(example)}`}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-secondary transition-colors hover:border-accent-border hover:text-foreground"
          >
            {example}
          </a>
        ))}
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Database, label: "1 · Retrieve evidence", hint: "market · news · filings" },
          { icon: ClipboardList, label: "2 · Show the pipeline", hint: "step-by-step status" },
          { icon: BrainCircuit, label: "3 · AI interpretation", hint: "requires a BYOK key (v0.3)" },
        ].map((step) => (
          <div
            key={step.label}
            className="rounded-lg border border-border bg-card px-4 py-3.5"
          >
            <step.icon className="h-4 w-4 text-accent" aria-hidden />
            <div className="mt-2 text-xs font-medium text-foreground">{step.label}</div>
            <div className="mt-0.5 text-2xs text-faint">{step.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- results */

function StepRow({
  label,
  detail,
  status,
  visible,
}: {
  label: string;
  detail: string;
  status: "collected" | "unavailable" | "pending";
  visible: boolean;
}) {
  if (!visible) {
    return (
      <li className="flex items-center gap-3 py-2.5">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3.5 w-40" />
      </li>
    );
  }
  return (
    <li className="fs-fade-in flex items-start gap-3 py-2.5">
      {status === "collected" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive" aria-hidden />
      ) : (
        <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden />
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span
            className={cn(
              "text-2xs uppercase tracking-wider",
              status === "collected" ? "text-positive/80" : "text-faint",
            )}
          >
            {status === "collected" ? "collected" : "unavailable"}
          </span>
        </div>
        <div className="mt-0.5 text-2xs leading-relaxed text-muted">{detail}</div>
      </div>
    </li>
  );
}

function ResearchResults({ query }: { query: string }) {
  const { data, error, loading, refetch } = useAsyncData<ResearchResult>(
    () => fetchJson(`/api/research?q=${encodeURIComponent(query)}`),
    [query],
  );

  // Reveal pipeline steps progressively (restrained, spec-compliant motion).
  const [visibleSteps, setVisibleSteps] = useState(0);
  useEffect(() => {
    setVisibleSteps(0);
    if (!data) return;
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setVisibleSteps(i);
      if (i >= data.steps.length) window.clearInterval(timer);
    }, 260);
    return () => window.clearInterval(timer);
  }, [data]);

  if (error) {
    return (
      <div className="py-6">
        <ErrorState description={error} onRetry={refetch} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ------------------------------------------------------ main column */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Research pipeline</CardTitle>
            <div className="flex items-center gap-2">
              {data.isMock && <MockBadge />}
              <span className="text-2xs text-faint">
                {formatTime(new Date(data.generatedAt))}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {data.steps.map((step, i) => (
                <StepRow
                  key={step.id}
                  label={step.label}
                  detail={step.detail}
                  status={step.status}
                  visible={i < visibleSteps}
                />
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Evidence observations
            </CardTitle>
            <Badge variant="neutral">
              <ClipboardList className="h-3 w-3" aria-hidden />
              computed by code
            </Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {data.observations.map((observation) => (
                <li
                  key={observation}
                  className="flex gap-2.5 text-xs leading-relaxed text-secondary"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
                  {observation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              AI interpretation
            </h2>
            {data.matchedSymbols.length > 0 && (
              <span className="mono text-2xs text-faint">
                matched: {data.matchedSymbols.join(", ")}
              </span>
            )}
          </div>
          {data.ai.available && data.ai.answer ? (
            <Card>
              <CardContent className="text-sm leading-relaxed text-foreground">
                {data.ai.answer}
              </CardContent>
            </Card>
          ) : (
            <UnavailableState
              title="AI interpretation is not available yet"
              description={data.ai.message}
              actionLabel="Configure a provider"
              actionHref="/settings"
            />
          )}
        </div>
      </div>

      {/* ----------------------------------------------------- side column */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Retrieved evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.evidence.map((item) => (
              <div key={item.id} className="border-b border-border/60 pb-3.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                  <DataSourceChip source={item.source} />
                </div>
                <p className="mt-1.5 break-words text-2xs leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {data.quotes.length > 0 && (
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
              Securities
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {data.quotes.map((quote) => (
                <StockCard key={quote.symbol} quote={quote} />
              ))}
            </div>
          </div>
        )}

        {data.stories.length > 0 && (
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
              Related stories
            </h3>
            <div className="space-y-2.5">
              {data.stories.slice(0, 3).map((story) => (
                <NewsCard key={story.id} story={story} showSummary={false} />
              ))}
            </div>
          </div>
        )}

        {data.quotes.length === 0 && data.stories.length === 0 && (
          <EmptyState
            title="No evidence matched"
            description="The demo universe has no data for this query yet. Live providers arrive in v0.2."
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- page */

function ResearchView() {
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  if (!query) return <ResearchHero />;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-muted">Research query</div>
          <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground">
            “{query}”
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = "/research";
          }}
        >
          New research
        </Button>
      </div>

      <div className="mb-6">
        <GlobalSearch />
      </div>

      <ResearchResults query={query} />
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="py-16"><Skeleton className="mx-auto h-40 w-full max-w-3xl rounded-lg" /></div>}>
      <ResearchView />
    </Suspense>
  );
}
