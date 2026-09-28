/** Mock news adapter (DEMO STORIES ONLY) — see lib/mock/news.ts. */

import type { NewsProvider, NewsQuery, NewsStory } from "@/lib/news/types";
import { MOCK_STORIES } from "@/lib/mock/news";

const SIMULATED_LATENCY_MS = 200;

const latency = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export const mockNewsProvider: NewsProvider = {
  id: "mock",
  label: "Demo news (mock)",
  isMock: true,

  async getStories(query: NewsQuery = {}): Promise<NewsStory[]> {
    await latency();
    let stories = [...MOCK_STORIES];

    if (query.category && query.category !== "All") {
      const category = query.category;
      stories = stories.filter((s) => s.category === category);
    }

    if (query.symbols?.length) {
      const wanted = new Set(query.symbols.map((s) => s.toUpperCase()));
      stories = stories.filter((s) =>
        s.symbols.some((sym) => wanted.has(sym.toUpperCase())),
      );
    }

    stories.sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );

    return query.limit ? stories.slice(0, query.limit) : stories;
  },
};
