import { getSecret } from "@/lib/database/repos/settings";
import type { NewsProvider, NewsQuery, NewsStory } from "@/lib/news/types";
import { envKey } from "@/lib/providers/config";

const BASE_URL = "https://newsapi.org/v2";

function apiKey(): string {
  const key = envKey({
    id: "newsapi", name: "NewsAPI", kind: "news",
    envVar: "NEWSAPI_API_KEY", docsUrl: "https://newsapi.org/docs", keyUrl: "https://newsapi.org/register",
    adapterImplemented: true, plannedIn: "v0.2", description: "",
  }) ?? getSecret("NEWSAPI_API_KEY");
  if (!key) throw new Error("NewsAPI key is not configured.");
  return key;
}

function categoryFor(query: NewsQuery): string {
  if (query.category === "Technology") return "technology";
  return "business";
}

export const newsApiProvider: NewsProvider = {
  id: "newsapi",
  label: "NewsAPI",
  isMock: false,

  async getStories(query = {}): Promise<NewsStory[]> {
    const url = new URL(BASE_URL + "/top-headlines");
    url.searchParams.set("apiKey", apiKey());
    url.searchParams.set("pageSize", String(Math.min(query.limit ?? 20, 50)));
    url.searchParams.set("category", categoryFor(query));
    url.searchParams.set("country", query.category === "India" ? "in" : "us");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("NewsAPI HTTP " + response.status);
    const json = (await response.json()) as {
      status?: string;
      articles?: Array<{
        title?: string;
        description?: string | null;
        url?: string;
        source?: { name?: string };
        publishedAt?: string;
      }>;
    };
    if (json.status !== "ok" || !json.articles?.length) throw new Error("NewsAPI returned no stories.");

    return json.articles
      .filter((article) => article.title && article.url)
      .map((article, index) => ({
        id: "newsapi-" + index + "-" + (article.publishedAt ?? "now"),
        headline: article.title!,
        summary: article.description || "Live headline from NewsAPI.",
        category: query.category === "India" ? "India" : query.category === "Technology" ? "Technology" : "Markets",
        sources: [{ name: article.source?.name || "NewsAPI source", url: article.url! }],
        outletCount: 1,
        publishedAt: article.publishedAt || new Date().toISOString(),
        symbols: [],
        isMock: false,
      }));
  },
};
