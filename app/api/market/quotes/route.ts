import { ok, routeError } from "@/lib/api";
import { marketDataService } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/market/quotes?symbols=AAPL,MSFT   → specific symbols
 * GET /api/market/quotes?all=1               → full demo universe
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbolsParam = url.searchParams.get("symbols");
    const all = url.searchParams.get("all") === "1";

    if (all || !symbolsParam) {
      const served = await marketDataService.getAllQuotes();
      return ok({ quotes: served.data, missing: [], source: served.source });
    }

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);

    const served = await marketDataService.getQuotes(symbols);
    return ok({
      quotes: served.data.quotes,
      missing: served.data.missing,
      source: served.source,
    });
  } catch (err) {
    return routeError(err);
  }
}
