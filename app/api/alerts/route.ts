import { fail, ok, readBody, routeError } from "@/lib/api";
import {
  addAlert,
  listAlerts,
  removeAlert,
  type AlertRuleType,
} from "@/lib/database/repos/alerts";
import { marketDataService } from "@/lib/market-data/service";
import { getCompany } from "@/lib/mock/companies";
import type { Quote } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";

const RULE_TYPES: AlertRuleType[] = ["price_above", "price_below", "pct_move"];

/** GET /api/alerts — rules joined with current (demo) prices. */
export async function GET() {
  try {
    const alerts = listAlerts();
    const symbols = Array.from(new Set(alerts.map((a) => a.symbol)));
    let quoteMap = new Map<string, Quote>();
    let source = null;

    if (symbols.length > 0) {
      const served = await marketDataService.getQuotes(symbols);
      quoteMap = new Map(served.data.quotes.map((q) => [q.symbol, q]));
      source = served.source;
    }

    return ok({
      alerts: alerts.map((alert) => ({
        ...alert,
        quote: quoteMap.get(alert.symbol) ?? null,
      })),
      source,
    });
  } catch (err) {
    return routeError(err);
  }
}

/** POST /api/alerts { symbol, ruleType, threshold, comparator? } */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
    const ruleType = typeof body.ruleType === "string" ? body.ruleType : "";
    const threshold = Number(body.threshold);

    if (!symbol) return fail("Missing symbol.", 400);
    if (!getCompany(symbol)) return fail(`Unknown symbol "${symbol}".`, 400);
    if (!RULE_TYPES.includes(ruleType as AlertRuleType)) {
      return fail(`Invalid rule type. Expected one of: ${RULE_TYPES.join(", ")}.`, 400);
    }
    if (!Number.isFinite(threshold)) return fail("Threshold must be a number.", 400);

    const comparator =
      ruleType === "price_below"
        ? ("<" as const)
        : (">" as const);

    const alert = addAlert({ symbol, ruleType: ruleType as AlertRuleType, comparator, threshold });
    const served = await marketDataService.getQuotes([symbol]);
    return ok({ alert: { ...alert, quote: served.data.quotes[0] ?? null } });
  } catch (err) {
    return routeError(err);
  }
}

/** DELETE /api/alerts { id } */
export async function DELETE(req: Request) {
  try {
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isFinite(id)) return fail("Missing id.", 400);
    if (!removeAlert(id)) return fail("Alert not found.", 404);
    return ok({ ok: true });
  } catch (err) {
    return routeError(err);
  }
}
