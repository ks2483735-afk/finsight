/**
 * Local SQLite connection (built-in node:sqlite driver — zero native deps).
 *
 * v0.1 foundation: connection, schema bootstrap, health status, and reset.
 * Every repository tolerates an unavailable database by throwing a clear
 * error, which routes surface as an honest "database unavailable" state.
 */

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "@/lib/database/schema";

export interface DbStatus {
  ok: boolean;
  driver: string;
  path: string | null;
  error: string | null;
}

const globalRef = globalThis as {
  __finsightDb?: DatabaseSync | null;
  __finsightDbPath?: string | null;
  __finsightDbError?: string | null;
};

function resolveDbPath(): string {
  const configured = process.env.FINSIGHT_DB_PATH?.trim();
  if (configured === ":memory:") return ":memory:";
  const relative = configured && configured.length > 0 ? configured : "./data/finsight.db";
  return resolve(process.cwd(), relative);
}

export function getDb(): DatabaseSync {
  if (globalRef.__finsightDb) return globalRef.__finsightDb;
  if (globalRef.__finsightDbError) {
    throw new Error(`Local database unavailable: ${globalRef.__finsightDbError}`);
  }
  try {
    const path = resolveDbPath();
    if (path !== ":memory:") {
      mkdirSync(dirname(path), { recursive: true });
    }
    const db = new DatabaseSync(path);
    db.exec(SCHEMA);
    globalRef.__finsightDb = db;
    globalRef.__finsightDbPath = path;
    return db;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    globalRef.__finsightDbError = message;
    throw new Error(`Local database unavailable: ${message}`);
  }
}

export function getDbStatus(): DbStatus {
  try {
    const db = getDb();
    db.prepare("SELECT 1 AS ok").get();
    return {
      ok: true,
      driver: "node:sqlite (Node built-in)",
      path: globalRef.__finsightDbPath ?? null,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      driver: "node:sqlite (Node built-in)",
      path: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const PERSONAL_TABLES = [
  "watchlist_items",
  "portfolio_holdings",
  "alert_rules",
  "saved_searches",
  "research_history",
] as const;

/** Counts shown on the Settings → Data & Storage tab. */
export function tableCounts(): Record<string, number> {
  const db = getDb();
  const counts: Record<string, number> = {};
  for (const table of PERSONAL_TABLES) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as
      | { n: number }
      | undefined;
    counts[table] = row?.n ?? 0;
  }
  const secrets = db
    .prepare("SELECT COUNT(*) AS n FROM settings WHERE key LIKE 'secret:%'")
    .get() as { n: number } | undefined;
  counts.secrets = secrets?.n ?? 0;
  return counts;
}

/**
 * Full local reset: personal data AND stored API keys. Local-first means
 * the user owns this data — the Settings page requires confirmation.
 */
export function clearAllLocalData(): void {
  const db = getDb();
  db.exec("BEGIN");
  try {
    for (const table of PERSONAL_TABLES) {
      db.exec(`DELETE FROM ${table}`);
    }
    db.exec("DELETE FROM settings");
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
