import type { NewsProvider, NewsQuery, NewsStory } from "@/lib/news/types";
import { fetchWithTimeout } from "@/lib/providers/fetch-with-timeout";

const FEEDS = [
  { category: "Markets" as const, url: "https://news.google.com/rss/search?q=stock%20market&hl=en-US&gl=US&ceid=US:en" },
  { category: "Technology" as const, url: "https://news.google.com/rss/search?q=technology%20stocks&hl=en-US&gl=US&ceid=US:en" },
  { category: "India" as const, url: "https://news.google.com/rss/search?q=Indian%20stock%20market&hl=en-IN&gl=IN&ceid=IN:en" },
];

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(block: string, name: string): string {
  const pattern = new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i");
  return decode(block.match(pattern)?.[1] ?? "").trim();
}

export const rssProvider: NewsProvider = {
  id: "rss-public",
  label: "Public RSS feeds",
  isMock: false,

  async getStories(query = {}): Promise<NewsStory[]> {
    const feed = FEEDS.find((item) => query.category === item.category) ?? FEEDS[0];
    const response = await fetchWithTimeout(feed.url, { cache: "no-store" });
    if (!response.ok) throw new Error("RSS HTTP " + response.status);
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

    const stories = items.map((block, index) => ({
      id: "rss-" + index + "-" + tag(block, "pubDate"),
      headline: tag(block, "title"),
      summary: tag(block, "description") || "Live story from a public RSS feed.",
      category: feed.category,
      sources: [{ name: "Google News RSS", url: tag(block, "link") }],
      outletCount: 1,
      publishedAt: new Date(tag(block, "pubDate") || Date.now()).toISOString(),
      symbols: [],
      isMock: false,
    })).filter((story) => story.headline && story.sources[0].url);

    if (!stories.length) throw new Error("RSS feed returned no usable stories.");
    return stories.slice(0, Math.min(query.limit ?? 20, 50));
  },
};
