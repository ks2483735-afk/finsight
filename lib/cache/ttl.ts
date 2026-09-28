/**
 * Tiny in-memory TTL cache (spec §22).
 *
 * Cache tiers by data class:
 *   prices        → short   (30s)
 *   news          → medium  (5min)
 *   fundamentals  → long    (24h)
 *
 * Kept deliberately small: it lives in the Node process, which is fine for
 * a local-first app. A persistent cache layer lands with v0.2.
 */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

/** Avoid sharing stale caches across dev hot-reloads. */
const globalStore = globalThis as unknown as { __finsightCache?: Map<string, Entry<unknown>> };
if (!globalStore.__finsightCache) globalStore.__finsightCache = store;
const cache = globalStore.__finsightCache;

export const CACHE_TTL = {
  price: 30_000,
  news: 300_000,
  fundamentals: 86_400_000,
} as const;

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheClear(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
