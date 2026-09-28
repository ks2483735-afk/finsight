/**
 * Deterministic pseudo-random series generator.
 *
 * Used ONLY to render demo charts for the mock data set. Same seed always
 * produces the same series, so pages are stable across reloads and server
 * round-trips (no flicker between identical renders).
 */

function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeriesOptions {
  /** Number of points in the series. */
  points?: number;
  /** The series ends exactly at this value (e.g. the current price). */
  endValue?: number;
  /** Per-step volatility (0.006 = ±0.6%). */
  volatility?: number;
  /** Overall drift bias, e.g. +0.15 for an uptrend across the window. */
  trend?: number;
}

/**
 * Generate a plausible-looking walk that terminates at `endValue`.
 * Deterministic for a given seed.
 */
export function generateSeries(
  seed: string,
  options: SeriesOptions = {},
): number[] {
  const { points = 48, endValue = 100, volatility = 0.006, trend = 0 } = options;
  const rand = mulberry32(hashSeed(seed));
  const walk: number[] = [1];
  for (let i = 1; i < points; i++) {
    const drift = trend / points;
    const shock = (rand() - 0.5) * 2 * volatility;
    walk.push(Math.max(0.05, walk[i - 1] * (1 + drift + shock)));
  }
  const scale = endValue / walk[walk.length - 1];
  return walk.map((v) => v * scale);
}

/** Labels for chart x-axes (demo windows ending today). */
export function windowLabels(range: "1D" | "1W" | "1M" | "1Y"): string[] {
  const now = new Date();
  const days = range === "1D" ? 1 : range === "1W" ? 7 : range === "1M" ? 30 : 365;
  const points = range === "1D" ? 8 : 6;
  const labels: string[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - (days * i * 86400000) / (points - 1));
    labels.push(
      range === "1D"
        ? d.toLocaleTimeString("en-US", { hour: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }
  return labels;
}
