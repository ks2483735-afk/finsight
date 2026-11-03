"use client";

import { useEffect, useState } from "react";
import { MockBadge } from "@/components/ui/badge";
import { Sparkline } from "@/components/finance/sparkline";
import { ChangeValue } from "@/components/finance/change-value";
import { formatPrice } from "@/lib/format";
import { generateSeries } from "@/lib/mock/series";
import { MOCK_INDICES } from "@/lib/mock/companies";

type PreviewIndex = (typeof MOCK_INDICES)[number];

interface PreviewSnapshot {
  indices: PreviewIndex[];
  seed: string;
}

function createSnapshot(): PreviewSnapshot {
  const seed = Math.random().toString(36).slice(2);
  return {
    seed,
    indices: MOCK_INDICES.slice(0, 6).map((index) => {
      const price = index.price * (1 + (Math.random() - 0.5) * 0.012);
      const changePercent = (Math.random() - 0.5) * 1.8;
      return {
        ...index,
        price,
        changePercent,
        change: (price * changePercent) / 100,
      };
    }),
  };
}

/**
 * Client-only simulated preview. Keeping random demo movement here lets the
 * landing route be statically rendered and cached by the hosting platform.
 */
export function MarketPreview() {
  const [snapshot, setSnapshot] = useState<PreviewSnapshot>(() => ({
    indices: MOCK_INDICES.slice(0, 6),
    seed: "initial",
  }));

  useEffect(() => {
    const refresh = () => setSnapshot(createSnapshot());
    refresh();
    const interval = window.setInterval(refresh, 20_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-overlay">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-border-strong" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-border-strong" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-accent/70" aria-hidden />
          <span className="ml-2">finsight — markets overview</span>
        </div>
        <MockBadge />
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {snapshot.indices.map((index) => {
          const series = generateSeries(`landing-${index.symbol}-${snapshot.seed}`, {
            points: 28,
            endValue: index.price,
            trend: index.changePercent / 100,
            volatility: 0.012,
          });
          return (
            <div
              key={index.symbol}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3.5 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-foreground">
                  {index.name}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="tnum text-sm font-semibold text-foreground">
                    {formatPrice(index.price, index.currency)}
                  </span>
                  <ChangeValue percent={index.changePercent} showIcon={false} />
                </div>
              </div>
              <Sparkline data={series} width={84} height={30} />
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-2.5 text-2xs text-faint">
        Simulated mock snapshot — values and sparklines refresh every 20 seconds. These are not real-time market quotes.
      </div>
    </div>
  );
}
