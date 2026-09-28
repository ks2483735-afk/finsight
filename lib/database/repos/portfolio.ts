/** Portfolio repository (local SQLite, no broker connection). */

import { getDb } from "@/lib/database/sqlite";

export interface HoldingRow {
  id: number;
  symbol: string;
  quantity: number;
  avgCost: number;
  currency: string;
  isDemo: boolean;
  createdAt: string;
}

interface RawRow {
  id: number;
  symbol: string;
  quantity: number;
  avg_cost: number;
  currency: string;
  is_demo: number;
  created_at: string;
}

function map(raw: RawRow): HoldingRow {
  return {
    id: raw.id,
    symbol: raw.symbol,
    quantity: raw.quantity,
    avgCost: raw.avg_cost,
    currency: raw.currency,
    isDemo: raw.is_demo === 1,
    createdAt: raw.created_at,
  };
}

const SELECT = "SELECT id, symbol, quantity, avg_cost, currency, is_demo, created_at FROM portfolio_holdings";

export function listHoldings(): HoldingRow[] {
  const db = getDb();
  return (db.prepare(`${SELECT} ORDER BY id ASC`).all() as unknown as RawRow[]).map(map);
}

export function addHolding(input: {
  symbol: string;
  quantity: number;
  avgCost: number;
  currency: string;
  isDemo?: boolean;
}): HoldingRow {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO portfolio_holdings (symbol, quantity, avg_cost, currency, is_demo) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      input.symbol.trim().toUpperCase(),
      input.quantity,
      input.avgCost,
      input.currency,
      input.isDemo ? 1 : 0,
    );
  const created = db
    .prepare(`${SELECT} WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as unknown as RawRow;
  return map(created);
}

export function removeHolding(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM portfolio_holdings WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}

/**
 * Seeds the demo portfolio used to verify the portfolio UI in v0.1.
 * Explicit user action from the empty state; every row is flagged is_demo.
 */
export function loadDemoPortfolio(): HoldingRow[] {
  const db = getDb();
  db.exec("DELETE FROM portfolio_holdings");
  const insert = db.prepare(
    "INSERT INTO portfolio_holdings (symbol, quantity, avg_cost, currency, is_demo) VALUES (?, ?, ?, ?, 1)",
  );
  const demoRows: [string, number, number, string][] = [
    ["NVDA", 25, 121.4, "USD"],
    ["AAPL", 15, 198.2, "USD"],
    ["MSFT", 8, 391.0, "USD"],
    ["TSLA", 10, 372.55, "USD"],
    ["TCS", 20, 3410.0, "INR"],
    ["RELIANCE", 30, 1395.0, "INR"],
  ];
  db.exec("BEGIN");
  try {
    for (const row of demoRows) insert.run(...row);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return listHoldings();
}
