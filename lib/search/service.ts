/**
 * Global research search service (deterministic).
 * Matches companies, stories, and terminal pages — no AI involved.
 */

import { marketDataService } from "@/lib/market-data/service";
import { newsService } from "@/lib/news/service";
import { ALL_NAV_ITEMS } from "@/lib/nav";
import type { NewsStory } from "@/lib/news/types";

export interface CompanyHit {
  symbol: string;
  name: string;
  exchange: string;
  region: string;
  price: number;
  currency: string;
  changePercent: number;
}

export interface PageHit {
  label: string;
  href: string;
  hint: string;
}

export interface SearchResponse {
  query: string;
  companies: CompanyHit[];
  stories: NewsStory[];
  pages: PageHit[];
}

export async function runSearch(rawQuery: string): Promise<SearchResponse> {
  const query = rawQuery.trim();
  if (!query) return { query, companies: [], stories: [], pages: [] };
  const q = query.toLowerCase();

  const [companiesServed, storiesServed] = await Promise.all([
    marketDataService.getCompanies(),
    newsService.getStories({ limit: 50 }),
  ]);

  const companies = companiesServed.data
    .filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    )
    .slice(0, 6)
    .map((c) => ({
      symbol: c.symbol,
      name: c.name,
      exchange: c.exchange,
      region: c.region,
      price: c.price,
      currency: c.currency,
      changePercent: c.changePercent,
    }));

  const stories = storiesServed.data
    .filter(
      (s) =>
        s.headline.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.symbols.some((sym) => sym.toLowerCase().includes(q)),
    )
    .slice(0, 4);

  const pages = ALL_NAV_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.hint.toLowerCase().includes(q),
  )
    .slice(0, 4)
    .map(({ label, href, hint }) => ({ label, href, hint }));

  return { query, companies, stories, pages };
}
