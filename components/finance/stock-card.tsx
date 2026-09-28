import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { generateSeries } from "@/lib/mock/series";
import { ChangeValue } from "@/components/finance/change-value";
import { Sparkline } from "@/components/finance/sparkline";
import { MockBadge } from "@/components/ui/badge";
import type { Quote } from "@/lib/market-data/types";

interface StockCardProps {
  quote: Quote;
  onClick?: () => void;
  className?: string;
}

/** Compact quote tile: symbol, price, change, mini trend. */
export function StockCard({ quote, onClick, className }: StockCardProps) {
  const series = generateSeries(`stock-${quote.symbol}`, {
    points: 32,
    endValue: quote.price,
    volatility: 0.006,
    trend: quote.changePercent / 100,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors duration-150 hover:border-border-strong hover:bg-elevated",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="mono text-sm font-semibold text-foreground">{quote.symbol}</span>
            {quote.isMock && <MockBadge className="h-4 px-1" />}
          </div>
          <div className="truncate text-2xs text-muted">{quote.name}</div>
        </div>
        <Sparkline data={series} width={72} height={26} />
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="tnum text-base font-semibold text-foreground">
          {formatPrice(quote.price, quote.currency)}
        </span>
        <ChangeValue percent={quote.changePercent} />
      </div>
    </button>
  );
}
