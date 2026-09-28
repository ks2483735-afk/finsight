import { fail, ok, readBody, routeError } from "@/lib/api";
import { runScreener } from "@/lib/screener/service";
import { EMPTY_FILTERS, type ScreenerFilters } from "@/lib/screener/parse";

export const dynamic = "force-dynamic";

/** POST /api/screener { filters: ScreenerFilters } */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const raw = (body.filters ?? {}) as Partial<ScreenerFilters>;

    const filters: ScreenerFilters = {
      region: raw.region === "US" || raw.region === "IN" ? raw.region : "ALL",
      assetClass:
        raw.assetClass === "stock" || raw.assetClass === "etf"
          ? raw.assetClass
          : EMPTY_FILTERS.assetClass,
      sector: typeof raw.sector === "string" && raw.sector ? raw.sector : "ALL",
      criteria:
        raw.criteria && typeof raw.criteria === "object" ? raw.criteria : {},
    };

    const result = await runScreener(filters);
    return ok({
      results: result.results,
      total: result.total,
      matched: result.results.length,
      source: result.source,
      filters,
      appliedAt: new Date().toISOString(),
    });
  } catch (err) {
    return routeError(err);
  }
}

/** Safety: screening is a POST operation. */
export async function GET() {
  return fail("Use POST with a filters payload.", 405);
}
