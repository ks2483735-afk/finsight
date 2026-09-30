import { ok, routeError } from "@/lib/api";
import { marketDataService } from "@/lib/market-data/service";
import type { HistoryRange } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";

const RANGES = new Set<HistoryRange>(["1D", "1W", "1M", "1Y"]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol")?.trim().toUpperCase();
    const range = (url.searchParams.get("range") ?? "1M") as HistoryRange;

    if (!symbol) return new Response(JSON.stringify({ error: "symbol is required" }), { status: 400 });
    if (!RANGES.has(range)) return new Response(JSON.stringify({ error: "range must be 1D, 1W, 1M, or 1Y" }), { status: 400 });

    const served = await marketDataService.getHistory(symbol, range);
    return ok({ symbol, range, points: served.data, source: served.source });
  } catch (err) {
    return routeError(err);
  }
}
