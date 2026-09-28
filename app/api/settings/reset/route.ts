import { ok, routeError } from "@/lib/api";
import { clearAllLocalData, tableCounts } from "@/lib/database/sqlite";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/reset
 * Deletes ALL local data: watchlist, portfolio, alerts, saved searches,
 * research history, preferences and stored API keys. Requires explicit
 * confirmation in the Settings UI.
 */
export async function POST() {
  try {
    clearAllLocalData();
    return ok({ ok: true, counts: tableCounts() });
  } catch (err) {
    return routeError(err);
  }
}
