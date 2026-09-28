import { ok, routeError } from "@/lib/api";
import { getDbStatus, tableCounts } from "@/lib/database/sqlite";

export const dynamic = "force-dynamic";

/** GET /api/settings/storage — local database health + row counts. */
export async function GET() {
  try {
    return ok({ database: getDbStatus(), counts: tableCounts() });
  } catch (err) {
    return routeError(err);
  }
}
