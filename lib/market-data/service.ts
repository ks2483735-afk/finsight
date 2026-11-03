/**
 * Market-data service — the only layer API routes call.
 *
 * Live providers are used only when enabled and configured. Symbol lookups
 * can combine provider coverage (for example, Finnhub US + Alpha Vantage India)
 * before filling any remaining symbols with clearly labeled demo quotes.
 */

import { initializeProviders } from "@/providers";
import { getRegistry } from "@/lib/providers/registry";
import { getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { cached, CACHE_TTL } from "@/lib/cache/ttl";
import type {
  Fundamentals,
  HistoryRange,
  MarketDataProvider,
  Company,
  Movers,
  PricePoint,
  Quote,
  QuoteBatch,
} from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";

export interface Served<T> {
  data: T;
  source: DataSourceInfo;
}

function liveMarketAdapters(): MarketDataProvider[] {
  initializeProviders();
  const registry = getRegistry();
  return registry.listMarketAdapters().filter((adapter) => {
    const descriptor = registry.getDescriptor(adapter.id);
    return Boolean(
      descriptor?.adapterImplemented &&
        isProviderEnabled(adapter.id) &&
        getKeyStatus(descriptor).configured,
    );
  });
}

function combineSources(sources: DataSourceInfo[]): DataSourceInfo {
  const unique = Array.from(
    new Map(sources.map((source) => [source.providerId, source])).values(),
  );
  if (unique.length === 1) return unique[0];
  return {
    providerId: "mixed",
    label: unique.map((source) => source.label).join(" + "),
    isMock: unique.some((source) => source.isMock),
    degraded: unique.some((source) => source.degraded || source.isMock),
  };
}

async function resolveMarket<T>(
  run: (adapter: MarketDataProvider) => Promise<T>,
): Promise<Served<T>> {
  initializeProviders();
  const registry = getRegistry();

  for (const adapter of liveMarketAdapters()) {
    try {
      const data = await run(adapter);
      return {
        data,
        source: {
          providerId: adapter.id,
          label: adapter.label,
          isMock: false,
          degraded: false,
        },
      };
    } catch {
      // Provider failed or does not support this operation; try the next.
    }
  }

  const fallback = registry.fallbackMarket;
  if (!fallback) {
    throw new Error("No market-data provider is available. Add a key in Settings.");
  }
  const data = await run(fallback);
  return {
    data,
    source: {
      providerId: fallback.id,
      label: fallback.label,
      isMock: true,
      degraded: liveMarketAdapters().length > 0,
    },
  };
}

export const marketDataService = {
  getQuotes(symbols: string[]): Promise<Served<QuoteBatch>> {
    const normalized = Array.from(
      new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
    ).sort();
    const key = `mq:${normalized.join(",")}`;

    return cached(key, CACHE_TTL.price, async () => {
      initializeProviders();
      const registry = getRegistry();
      const collected = new Map<string, Quote>();
      const sources: DataSourceInfo[] = [];
      let remaining = [...normalized];

      // Providers can cover different exchanges. Keep successful quotes and
      // pass only unresolved symbols to the next provider instead of discarding
      // the entire batch when one symbol is unsupported.
      for (const adapter of liveMarketAdapters()) {
        if (remaining.length === 0) break;
        try {
          const result = await adapter.getQuotes(remaining);
          for (const quote of result.quotes) {
            collected.set(quote.symbol.toUpperCase(), quote);
          }
          if (result.quotes.length > 0) {
            sources.push({
              providerId: adapter.id,
              label: adapter.label,
              isMock: false,
              degraded: false,
            });
          }
          remaining = remaining.filter((symbol) => !collected.has(symbol));
        } catch {
          // Try the next provider with the same unresolved symbol set.
        }
      }

      if (remaining.length > 0) {
        const fallback = registry.fallbackMarket;
        if (fallback) {
          try {
            const result = await fallback.getQuotes(remaining);
            for (const quote of result.quotes) {
              collected.set(quote.symbol.toUpperCase(), quote);
            }
            if (result.quotes.length > 0) {
              sources.push({
                providerId: fallback.id,
                label: fallback.label,
                isMock: true,
                degraded: liveMarketAdapters().length > 0,
              });
            }
            remaining = remaining.filter((symbol) => !collected.has(symbol));
          } catch {
            // Return partial results and report unresolved symbols below.
          }
        }
      }

      const quotes = normalized
        .map((symbol) => collected.get(symbol))
        .filter((quote): quote is Quote => Boolean(quote));

      if (sources.length === 0) {
        const fallback = registry.fallbackMarket;
        if (!fallback) throw new Error("No market-data provider is available.");
        const result = await fallback.getQuotes(normalized);
        return {
          data: result,
          source: {
            providerId: fallback.id,
            label: fallback.label,
            isMock: true,
            degraded: liveMarketAdapters().length > 0,
          },
        };
      }

      return {
        data: { quotes, missing: remaining },
        source: combineSources(sources),
      };
    });
  },

  /**
   * The providers in this release do not offer a bulk-universe endpoint.
   * Keep the broad Markets grid and movers demo-backed rather than issuing
   * dozens of individual requests and exhausting free API quotas.
   */
  getAllQuotes(): Promise<Served<Quote[]>> {
    return cached("mq:all", CACHE_TTL.price, async () => {
      initializeProviders();
      const registry = getRegistry();
      const fallback = registry.fallbackMarket;
      if (!fallback) throw new Error("No market-data provider is available.");
      return {
        data: await fallback.getAllQuotes(),
        source: {
          providerId: fallback.id,
          label: fallback.label,
          isMock: true,
          degraded: liveMarketAdapters().length > 0,
        },
      };
    });
  },

  getIndices(): Promise<Served<Quote[]>> {
    return cached("midx", CACHE_TTL.price, () =>
      resolveMarket((adapter) => adapter.getIndices()),
    );
  },

  async getFundamentals(symbol: string): Promise<Served<Fundamentals>> {
    initializeProviders();
    const normalized = symbol.trim().toUpperCase();

    for (const adapter of liveMarketAdapters()) {
      if (!adapter.getFundamentals) continue;
      try {
        const data = await adapter.getFundamentals(normalized);
        return {
          data,
          source: {
            providerId: adapter.id,
            label: adapter.label,
            isMock: false,
            degraded: false,
          },
        };
      } catch {
        // Try the next configured provider.
      }
    }

    throw new Error(`No live fundamentals are available for ${normalized}.`);
  },

  getCompanies(): Promise<Served<Company[]>> {
    return cached("mcompanies", CACHE_TTL.fundamentals, () =>
      resolveMarket((adapter) => adapter.getCompanies()),
    );
  },

  async getHistory(symbol: string, range: HistoryRange): Promise<Served<PricePoint[]>> {
    initializeProviders();
    const normalized = symbol.trim().toUpperCase();
    for (const adapter of liveMarketAdapters()) {
      if (!adapter.getHistory) continue;
      try {
        const data = await adapter.getHistory(normalized, range);
        if (data.length > 1) {
          return {
            data,
            source: {
              providerId: adapter.id,
              label: adapter.label,
              isMock: false,
              degraded: false,
            },
          };
        }
      } catch {
        // Try the next configured provider.
      }
    }
    throw new Error(`No live price history is available for ${normalized}.`);
  },

  async getMovers(limit = 5): Promise<Served<Movers>> {
    const served = await this.getAllQuotes();
    const sorted = [...served.data].sort(
      (a, b) => b.changePercent - a.changePercent,
    );
    return {
      data: {
        gainers: sorted.slice(0, limit),
        losers: sorted.slice(-limit).reverse(),
      },
      source: served.source,
    };
  },
};
