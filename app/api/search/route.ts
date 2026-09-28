import { ok, routeError } from "@/lib/api";
import { runSearch } from "@/lib/search/service";

export const dynamic = "force-dynamic";

/** GET /api/search?q=nvda — deterministic search over companies, news, pages. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").slice(0, 200);
    const results = await runSearch(q);
    return ok(results);
  } catch (err) {
    return routeError(err);
  }
}
