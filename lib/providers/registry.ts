/**
 * Provider registry.
 *
 * Adapters register themselves once (see providers/index.ts). Services look
 * up adapters through the registry, never through direct imports of a
 * concrete provider — this is the seam that keeps the UI provider-agnostic.
 */

import type {
  MarketDataProvider,
  Quote,
} from "@/lib/market-data/types";
import type { NewsProvider } from "@/lib/news/types";
import type { ProviderDescriptor, ProviderKind } from "@/lib/providers/types";

interface Fallbacks {
  market?: MarketDataProvider;
  news?: NewsProvider;
}

class ProviderRegistry {
  private descriptors = new Map<string, ProviderDescriptor>();
  private marketAdapters = new Map<string, MarketDataProvider>();
  private newsAdapters = new Map<string, NewsProvider>();
  private fallbacks: Fallbacks = {};

  /* ---- descriptors (BYOK metadata shown in Settings) ---- */

  registerDescriptor(descriptor: ProviderDescriptor): void {
    this.descriptors.set(descriptor.id, descriptor);
  }

  getDescriptor(id: string): ProviderDescriptor | undefined {
    return this.descriptors.get(id);
  }

  listDescriptors(kind?: ProviderKind): ProviderDescriptor[] {
    const all = Array.from(this.descriptors.values());
    return kind ? all.filter((d) => d.kind === kind) : all;
  }

  /* ---- live adapters (registered as they are implemented) ---- */

  registerMarketAdapter(adapter: MarketDataProvider): void {
    this.marketAdapters.set(adapter.id, adapter);
  }

  registerNewsAdapter(adapter: NewsProvider): void {
    this.newsAdapters.set(adapter.id, adapter);
  }

  /** Live adapters only — the mock adapter is never in this list. */
  listMarketAdapters(): MarketDataProvider[] {
    return Array.from(this.marketAdapters.values());
  }

  listNewsAdapters(): NewsProvider[] {
    return Array.from(this.newsAdapters.values());
  }

  /* ---- mock/demo fallbacks (spec §23: last step before "unavailable") ---- */

  registerFallbacks(fallbacks: Fallbacks): void {
    this.fallbacks = fallbacks;
  }

  get fallbackMarket(): MarketDataProvider | undefined {
    return this.fallbacks.market;
  }

  get fallbackNews(): NewsProvider | undefined {
    return this.fallbacks.news;
  }

  /** True when at least one live (non-mock) adapter is registered. */
  get hasLiveMarketData(): boolean {
    return this.marketAdapters.size > 0;
  }

  get hasLiveNews(): boolean {
    return this.newsAdapters.size > 0;
  }
}

/** Dev-server hot reload would otherwise re-create the registry each pass. */
const globalRef = globalThis as unknown as { __finsightRegistry?: ProviderRegistry };

export function getRegistry(): ProviderRegistry {
  if (!globalRef.__finsightRegistry) {
    globalRef.__finsightRegistry = new ProviderRegistry();
  }
  return globalRef.__finsightRegistry;
}

export type { Quote };
