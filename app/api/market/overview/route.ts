import { ok, routeError } from "@/lib/api";
import { marketDataService } from "@/lib/market-data/service";
import { newsService } from "@/lib/news/service";
import { MOCK_DAILY_BRIEF } from "@/lib/mock/brief";

export const dynamic = "force-dynamic";

/** One round trip powering the Overview dashboard. */
export async function GET() {
  try {
    const [indices, movers, stories, focus] = await Promise.all([
      marketDataService.getIndices(),
      marketDataService.getMovers(5),
      newsService.getStories({ limit: 4 }),
      marketDataService.getQuotes(MOCK_DAILY_BRIEF.stocksInFocus),
    ]);

    return ok({
      indices: indices.data,
      movers: movers.data,
      brief: MOCK_DAILY_BRIEF,
      stories: stories.data,
      focus: focus.data.quotes,
      sources: {
        market: indices.source,
        news: stories.source,
      },
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    return routeError(err);
  }
}
