/**
 * Settings repository — provider secrets and local preferences.
 *
 * Secrets are write-only from the UI's perspective: reads of the value
 * happen only inside the server process and are never returned by API
 * routes (only `configured: true/false` is).
 */

import { getDb } from "@/lib/database/sqlite";

const SECRET_PREFIX = "secret:";
const PREF_PREFIX = "pref:";

export function getSecret(envVar: string): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(SECRET_PREFIX + envVar) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSecret(envVar: string, value: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
  ).run(SECRET_PREFIX + envVar, value);
}

export function deleteSecret(envVar: string): void {
  const db = getDb();
  db.prepare("DELETE FROM settings WHERE key = ?").run(SECRET_PREFIX + envVar);
}

export function getPreference(key: string, fallback: string | null = null): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(PREF_PREFIX + key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function setPreference(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
  ).run(PREF_PREFIX + key, value);
}
