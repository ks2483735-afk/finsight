/**
 * Small in-memory TTL cache for market data and news.
 *
 * Concurrent requests for the same uncached key share one loader promise,
 * preventing duplicate upstream API/RSS requests during page loads.
 */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const pendingStore = new Map<string, Promise<unknown>>();

/** Keep both maps alive across Next.js development hot reloads. */
const globalStore = globalThis as unknown as {
  __finsightCache?: Map<string, Entry<unknown>>;
  __finsightPendingCache?: Map<string, Promise<unknown>>;
};
if (!globalStore.__finsightCache) globalStore.__finsightCache = store;
if (!globalStore.__finsightPendingCache) globalStore.__finsightPendingCache = pendingStore;
const cache = globalStore.__finsightCache;
const pending = globalStore.__finsightPendingCache;

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
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  if (hit) cache.delete(key);

  // A request already loading this key is shared by every concurrent caller.
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      // Do not delete a newer request if cacheClear/re-entry has replaced it.
      if (pending.get(key) === request) pending.delete(key);
    });

  pending.set(key, request);
  return request;
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
