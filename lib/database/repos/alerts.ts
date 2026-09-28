/** Alert-rules repository (local SQLite; evaluation arrives in v0.7). */

import { getDb } from "@/lib/database/sqlite";

export type AlertRuleType = "price_above" | "price_below" | "pct_move";

export interface AlertRow {
  id: number;
  symbol: string;
  ruleType: AlertRuleType;
  comparator: ">" | "<";
  threshold: number;
  enabled: boolean;
  createdAt: string;
}

interface RawRow {
  id: number;
  symbol: string;
  rule_type: string;
  comparator: string;
  threshold: number;
  enabled: number;
  created_at: string;
}

function map(raw: RawRow): AlertRow {
  return {
    id: raw.id,
    symbol: raw.symbol,
    ruleType: raw.rule_type as AlertRuleType,
    comparator: raw.comparator as ">" | "<",
    threshold: raw.threshold,
    enabled: raw.enabled === 1,
    createdAt: raw.created_at,
  };
}

const SELECT =
  "SELECT id, symbol, rule_type, comparator, threshold, enabled, created_at FROM alert_rules";

export function listAlerts(): AlertRow[] {
  const db = getDb();
  return (db.prepare(`${SELECT} ORDER BY id DESC`).all() as unknown as RawRow[]).map(map);
}

export function addAlert(input: {
  symbol: string;
  ruleType: AlertRuleType;
  comparator: ">" | "<";
  threshold: number;
}): AlertRow {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO alert_rules (symbol, rule_type, comparator, threshold) VALUES (?, ?, ?, ?)",
    )
    .run(
      input.symbol.trim().toUpperCase(),
      input.ruleType,
      input.comparator,
      input.threshold,
    );
  const created = db
    .prepare(`${SELECT} WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as unknown as RawRow;
  return map(created);
}

export function removeAlert(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM alert_rules WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}
