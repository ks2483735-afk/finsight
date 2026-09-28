import { fail, ok, readBody, routeError } from "@/lib/api";
import {
  addToWatchlist,
  listWatchlist,
  removeFromWatchlist,
  type WatchlistRow,
} from "@/lib/database/repos/watchlist";
import { marketDataService } from "@/lib/market-data/service";
import { getCompany } from "@/lib/mock/companies";
import type { Quote } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";

export interface WatchlistItem extends WatchlistRow {
  quote: Quote | null;
}

/** GET /api/watchlist — items joined with current (demo) quotes. */
export async function GET() {
  try {
    const items = listWatchlist();
    const symbols = items.map((item) => item.symbol);
    let quoteMap = new Map<string, Quote>();
    let source = null;

    if (symbols.length > 0) {
      const served = await marketDataService.getQuotes(symbols);
      quoteMap = new Map(served.data.quotes.map((q) => [q.symbol, q]));
      source = served.source;
    }

    return ok({
      items: items.map((item) => ({
        ...item,
        quote: quoteMap.get(item.symbol) ?? null,
      })),
      source,
    });
  } catch (err) {
    return routeError(err);
  }
}

/** POST /api/watchlist { symbol } */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
    if (!symbol) return fail("Missing symbol.", 400);
    if (!getCompany(symbol)) {
      return fail(
        `Unknown symbol "${symbol}". v0.1 ships a demo universe of ${"23"} symbols (US + India).`,
        400,
      );
    }

    const row = addToWatchlist(symbol);
    const served = await marketDataService.getQuotes([symbol]);
    return ok({
      item: {
        ...row,
        quote: served.data.quotes[0] ?? null,
      },
      source: served.source,
    });
  } catch (err) {
    return routeError(err);
  }
}

/** DELETE /api/watchlist { id } */
export async function DELETE(req: Request) {
  try {
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isFinite(id)) return fail("Missing id.", 400);
    const removed = removeFromWatchlist(id);
    if (!removed) return fail("Watchlist item not found.", 404);
    return ok({ ok: true });
  } catch (err) {
    return routeError(err);
  }
}
