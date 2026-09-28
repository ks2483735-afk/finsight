import { fail, ok, readBody, routeError } from "@/lib/api";
import {
  addHolding,
  listHoldings,
  loadDemoPortfolio,
  removeHolding,
  type HoldingRow,
} from "@/lib/database/repos/portfolio";
import { marketDataService } from "@/lib/market-data/service";
import { getCompany } from "@/lib/mock/companies";
import { FX_NOTE, toUsd } from "@/lib/mock/fx";
import type { Quote } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";

export interface EnrichedHolding extends HoldingRow {
  quote: Quote | null;
  prevClose: number | null;
  value: number | null;
  invested: number;
  pl: number | null;
  plPct: number | null;
  todayPl: number | null;
  weight: number | null;
}

interface CurrencySummary {
  invested: number;
  value: number;
  pl: number;
  plPct: number;
  todayPl: number;
}

async function buildPortfolio() {
  const holdings = listHoldings();
  const symbols = Array.from(new Set(holdings.map((h) => h.symbol)));
  const companies = await marketDataService.getCompanies();
  const companyMap = new Map(companies.data.map((c) => [c.symbol, c]));

  const quoteMap = new Map<string, Quote>();
  if (symbols.length > 0) {
    const served = await marketDataService.getQuotes(symbols);
    for (const quote of served.data.quotes) quoteMap.set(quote.symbol, quote);
  }

  let totalUsdValue = 0;
  const enriched: EnrichedHolding[] = holdings.map((holding) => {
    const quote = quoteMap.get(holding.symbol) ?? null;
    const invested = holding.quantity * holding.avgCost;
    const value = quote ? quote.price * holding.quantity : null;
    const prevClose = quote
      ? quote.price / (1 + quote.changePercent / 100)
      : null;
    const pl = value !== null ? value - invested : null;
    const plPct = invested > 0 && value !== null ? ((value - invested) / invested) * 100 : null;
    const todayPl =
      value !== null && prevClose !== null
        ? (quote!.price - prevClose) * holding.quantity
        : null;
    if (value !== null) totalUsdValue += toUsd(value, holding.currency);
    return {
      ...holding,
      quote,
      prevClose,
      value,
      invested,
      pl,
      plPct,
      todayPl,
      weight: null,
    };
  });

  // Weights use demo FX so sectors across currencies can be shown together.
  for (const holding of enriched) {
    holding.weight =
      holding.value !== null && totalUsdValue > 0
        ? (toUsd(holding.value, holding.currency) / totalUsdValue) * 100
        : null;
  }

  // Per-currency summaries (exact — no FX needed).
  const byCurrency: Record<string, CurrencySummary> = {};
  for (const holding of enriched) {
    const bucket = (byCurrency[holding.currency] ??= {
      invested: 0,
      value: 0,
      pl: 0,
      plPct: 0,
      todayPl: 0,
    });
    bucket.invested += holding.invested;
    bucket.value += holding.value ?? holding.invested;
    bucket.todayPl += holding.todayPl ?? 0;
  }
  for (const bucket of Object.values(byCurrency)) {
    bucket.pl = bucket.value - bucket.invested;
    bucket.plPct = bucket.invested > 0 ? (bucket.pl / bucket.invested) * 100 : 0;
  }

  // Sector allocation (USD equivalent at demo FX).
  const sectorMap = new Map<string, number>();
  for (const holding of enriched) {
    if (holding.value === null) continue;
    const sector = companyMap.get(holding.symbol)?.sector ?? "Other";
    sectorMap.set(
      sector,
      (sectorMap.get(sector) ?? 0) + toUsd(holding.value, holding.currency),
    );
  }
  const allocation = Array.from(sectorMap.entries())
    .map(([sector, valueUsd]) => ({
      sector,
      valueUsd,
      pct: totalUsdValue > 0 ? (valueUsd / totalUsdValue) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  return {
    holdings: enriched,
    byCurrency,
    allocation,
    totalUsd: totalUsdValue,
    fxNote: FX_NOTE,
    hasDemoRows: enriched.some((h) => h.isDemo),
  };
}

/** GET /api/portfolio */
export async function GET() {
  try {
    return ok(await buildPortfolio());
  } catch (err) {
    return routeError(err);
  }
}

/**
 * POST /api/portfolio
 *   { action: "add", symbol, quantity, avgCost }
 *   { action: "demo" } → seeds the labeled demo portfolio
 */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const action = typeof body.action === "string" ? body.action : "add";

    if (action === "demo") {
      loadDemoPortfolio();
      return ok(await buildPortfolio());
    }

    const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
    const quantity = Number(body.quantity);
    const avgCost = Number(body.avgCost);

    if (!symbol) return fail("Missing symbol.", 400);
    const company = getCompany(symbol);
    if (!company) return fail(`Unknown symbol "${symbol}" in the demo universe.`, 400);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return fail("Quantity must be greater than 0.", 400);
    }
    if (!Number.isFinite(avgCost) || avgCost < 0) {
      return fail("Average cost must be 0 or greater.", 400);
    }

    addHolding({ symbol, quantity, avgCost, currency: company.currency });
    return ok(await buildPortfolio());
  } catch (err) {
    return routeError(err);
  }
}

/** DELETE /api/portfolio { id } */
export async function DELETE(req: Request) {
  try {
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isFinite(id)) return fail("Missing id.", 400);
    if (!removeHolding(id)) return fail("Holding not found.", 404);
    return ok(await buildPortfolio());
  } catch (err) {
    return routeError(err);
  }
}
