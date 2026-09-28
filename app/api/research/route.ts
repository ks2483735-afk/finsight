import { fail, ok, routeError } from "@/lib/api";
import { runResearch } from "@/lib/ai/router";

export const dynamic = "force-dynamic";

/**
 * GET /api/research?q=why%20is%20nvda%20up
 *
 * Returns evidence collected through internal services plus an honest AI
 * status. No model call is made in v0.1 (adapters arrive in v0.3).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 300);
    if (!q) return fail("Missing query parameter: q", 400);

    const result = await runResearch(q);
    return ok(result);
  } catch (err) {
    return routeError(err);
  }
}
