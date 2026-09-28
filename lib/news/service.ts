/**
 * News service — the ONLY thing the API layer calls for stories.
 * Same fallback chain as market data: live adapters → demo stories.
 */

import { initializeProviders } from "@/providers";
import { getRegistry } from "@/lib/providers/registry";
import { cached, CACHE_TTL } from "@/lib/cache/ttl";
import type { NewsProvider, NewsQuery, NewsStory } from "@/lib/news/types";
import type { DataSourceInfo } from "@/lib/providers/types";

export interface Served<T> {
  data: T;
  source: DataSourceInfo;
}

async function resolveNews(
  run: (adapter: NewsProvider) => Promise<NewsStory[]>,
): Promise<Served<NewsStory[]>> {
  initializeProviders();
  const registry = getRegistry();

  for (const adapter of registry.listNewsAdapters()) {
    try {
      const data = await run(adapter);
      return {
        data,
        source: { providerId: adapter.id, label: adapter.label, isMock: false, degraded: false },
      };
    } catch {
      continue;
    }
  }

  const fallback = registry.fallbackNews;
  if (!fallback) {
    throw new Error("No news provider is available. Add a key in Settings.");
  }
  const data = await run(fallback);
  return {
    data,
    source: {
      providerId: fallback.id,
      label: fallback.label,
      isMock: true,
      degraded: registry.hasLiveNews,
    },
  };
}

export const newsService = {
  getStories(query: NewsQuery = {}): Promise<Served<NewsStory[]>> {
    const key = `news:${query.category ?? "All"}:${(query.symbols ?? []).join(",")}:${query.limit ?? ""}`;
    return cached(key, CACHE_TTL.news, () =>
      resolveNews((adapter) => adapter.getStories(query)),
    );
  },
};
