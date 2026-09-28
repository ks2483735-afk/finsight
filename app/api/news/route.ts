import { ok, routeError } from "@/lib/api";
import { newsService } from "@/lib/news/service";
import { NEWS_FILTERS, type NewsFilter } from "@/lib/news/types";

export const dynamic = "force-dynamic";

/** GET /api/news?category=All|US|India|Markets|Technology|Earnings&limit=12 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryParam = url.searchParams.get("category") ?? "All";
    const limitParam = Number(url.searchParams.get("limit") ?? "12");

    const category = NEWS_FILTERS.includes(categoryParam as NewsFilter)
      ? (categoryParam as NewsFilter)
      : "All";
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 12;

    const served = await newsService.getStories({ category, limit });
    return ok({ stories: served.data, category, source: served.source });
  } catch (err) {
    return routeError(err);
  }
}
