import { ok, routeError } from "@/lib/api";
import { marketDataService } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

/** GET /api/companies — full directory (client filters live for snappy UX). */
export async function GET() {
  try {
    const served = await marketDataService.getCompanies();
    return ok({ companies: served.data, source: served.source });
  } catch (err) {
    return routeError(err);
  }
}
