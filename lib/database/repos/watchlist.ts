/** Watchlist repository (local SQLite). */

import { getDb } from "@/lib/database/sqlite";

export interface WatchlistRow {
  id: number;
  symbol: string;
  addedAt: string;
}

interface RawRow {
  id: number;
  symbol: string;
  added_at: string;
}

function map(raw: RawRow): WatchlistRow {
  return { id: raw.id, symbol: raw.symbol, addedAt: raw.added_at };
}

export function listWatchlist(): WatchlistRow[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT id, symbol, added_at FROM watchlist_items ORDER BY added_at DESC, id DESC")
    .all() as unknown as RawRow[];
  return rows.map(map);
}

export function addToWatchlist(symbol: string): WatchlistRow {
  const db = getDb();
  const upper = symbol.trim().toUpperCase();
  const existing = db
    .prepare("SELECT id, symbol, added_at FROM watchlist_items WHERE symbol = ?")
    .get(upper) as unknown as RawRow | undefined;
  if (existing) return map(existing);
  db.prepare("INSERT INTO watchlist_items (symbol) VALUES (?)").run(upper);
  const created = db
    .prepare("SELECT id, symbol, added_at FROM watchlist_items WHERE symbol = ?")
    .get(upper) as unknown as RawRow;
  return map(created);
}

export function removeFromWatchlist(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM watchlist_items WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}
