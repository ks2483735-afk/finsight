/** Shared helpers for route handlers. */

import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Maps service errors to honest HTTP responses (503 when a provider/db is unavailable). */
export function routeError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Unexpected server error";
  const unavailable = /unavailable|no .* provider/i.test(message);
  return fail(message, unavailable ? 503 : 500);
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
