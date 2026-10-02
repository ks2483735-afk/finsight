import { fail, ok, readBody, routeError } from "@/lib/api";
import { buildTestResult } from "@/lib/providers/connection-test";

export const dynamic = "force-dynamic";

/** POST /api/settings/providers/test { id } — honest result, no fake requests. */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return fail("Missing provider id.", 400);

    const result = await buildTestResult(id);
    if (!result) return fail(`Unknown provider: ${id}`, 404);
    return ok(result);
  } catch (err) {
    return routeError(err);
  }
}
