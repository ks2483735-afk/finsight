/**
 * Market-data service — the ONLY thing the API layer calls.
 *
 * Implements the spec §23 fallback chain:
 *   preferred configured provider → fallback provider → demo data →
 *   clear "unavailable" message.
 *
 * In v0.1 no live adapter is registered yet, so requests resolve to the
 * mock adapter with source.isMock = true and (if live providers were ever
 * attempted) source.degraded = true — the UI surfaces both honestly.
 */

import { initializeProviders } from "@/providers";
import { getRegistry } from "@/lib/providers/registry";
import { cached, CACHE_TTL } from "@/lib/cache/ttl";
import type { HistoryRange, MarketDataProvider, Company, Movers, PricePoint, Quote, QuoteBatch } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";

export interface Served<T> {
  data: T;
  source: DataSourceInfo;
}

async function resolveMarket<T>(
  run: (adapter: MarketDataProvider) => Promise<T>,
): Promise<Served<T>> {
  initializeProviders();
  const registry = getRegistry();

  // 1) Live adapters in registration order.
  for (const adapter of registry.listMarketAdapters()) {
    try {
      const data = await run(adapter);
      return {
        data,
        source: { providerId: adapter.id, label: adapter.label, isMock: false, degraded: false },
      };
    } catch {
      // Provider failed or out of quota → try the next one.
      continue;
    }
  }

  // 2) Demo fallback (always available, always labeled).
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
      degraded: registry.hasLiveMarketData,
    },
  };
}

export const marketDataService = {
  getQuotes(symbols: string[]): Promise<Served<QuoteBatch>> {
    const key = `mq:${[...symbols].map((s) => s.toUpperCase()).sort().join(",")}`;
    return cached(key, CACHE_TTL.price, () =>
      resolveMarket((adapter) => adapter.getQuotes(symbols)),
    );
  },

  async getAllQuotes(): Promise<Served<Quote[]>> {
    return cached("mq:all", CACHE_TTL.price, async () => {
      const live = await getLiveUniverseQuotes();
      if (live) return live;
      return resolveMarket((adapter) => adapter.getAllQuotes());
    });
  },

  getIndices(): Promise<Served<Quote[]>> {
    return cached("midx", CACHE_TTL.price, () =>
      resolveMarket((adapter) => adapter.getIndices()),
    );
  },

  getCompanies(): Promise<Served<Company[]>> {
    return cached("mcompanies", CACHE_TTL.fundamentals, () =>
      resolveMarket((adapter) => adapter.getCompanies()),
    );
  },


  async getHistory(symbol: string, range: HistoryRange): Promise<Served<PricePoint[]>> {
    initializeProviders();
    const registry = getRegistry();
    const normalized = symbol.trim().toUpperCase();
    for (const adapter of registry.listMarketAdapters()) {
      if (!adapter.getHistory) continue;
      try {
        const data = await adapter.getHistory(normalized, range);
        if (data.length > 1) {
          return {
            data,
            source: { providerId: adapter.id, label: adapter.label, isMock: false, degraded: false },
          };
        }
      } catch {
        // Try the next live provider.
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
