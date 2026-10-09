/**
 * Bound upstream provider requests so a stalled API/feed cannot hang a page.
 * AbortSignal remains active while the response body is being consumed too.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new Error(`Upstream request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  }
}
