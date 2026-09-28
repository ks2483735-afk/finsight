/** News domain types (normalized across providers). */

export type NewsCategory =
  | "US"
  | "India"
  | "Markets"
  | "Technology"
  | "Earnings";

/** Filter chips shown on the News page ("All" is client-side). */
export type NewsFilter = NewsCategory | "All";

export const NEWS_FILTERS: NewsFilter[] = [
  "All",
  "US",
  "India",
  "Markets",
  "Technology",
  "Earnings",
];

export interface NewsSource {
  name: string;
  url: string;
}

/** One clustered story — several outlets covering the same event. */
export interface NewsStory {
  id: string;
  headline: string;
  /** Short summary. In v0.1 these are authored demo summaries (labeled mock). */
  summary: string;
  category: NewsCategory;
  sources: NewsSource[];
  /** How many outlets are covering this event (story clustering). */
  outletCount: number;
  publishedAt: string;
  /** Related symbols. */
  symbols: string[];
  isMock: boolean;
}

export interface NewsQuery {
  category?: NewsFilter;
  symbols?: string[];
  limit?: number;
}

/** Contract every news adapter implements (API, RSS, public sources). */
export interface NewsProvider {
  id: string;
  label: string;
  isMock: boolean;
  getStories(query?: NewsQuery): Promise<NewsStory[]>;
}
