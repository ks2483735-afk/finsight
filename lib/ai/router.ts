/**
 * AI router (v0.1: status + research orchestration only).
 *
 * Responsibilities per spec §4: pick a configured provider, gather evidence,
 * and keep AI interpretation separate from retrieved evidence. No adapter is
 * implemented yet, so runResearch() collects (mock) evidence and reports the
 * AI step honestly as unavailable — it never fabricates an answer.
 */

import { initializeProviders } from "@/providers";
import { getRegistry } from "@/lib/providers/registry";
import { getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { marketDataService } from "@/lib/market-data/service";
import { newsService } from "@/lib/news/service";
import { MOCK_UNIVERSE, getCompany } from "@/lib/mock/companies";
import { formatMarketCap, formatPercent, formatPrice } from "@/lib/format";
import type {
  AIResult,
  ResearchEvidence,
  ResearchResult,
  ResearchStep,
} from "@/lib/ai/types";
import type { Fundamentals, Quote } from "@/lib/market-data/types";

export async function getAIResult(): Promise<AIResult> {
  initializeProviders();
  const registry = getRegistry();
  const aiDescriptors = registry
    .listDescriptors("ai")
    .filter((d) => isProviderEnabled(d.id));

  const configured = aiDescriptors.filter((d) => getKeyStatus(d).configured);
  const implemented = configured.filter((d) => d.adapterImplemented);

  if (implemented.length > 0) {
    // Future (v0.3): dispatch to the first healthy adapter.
    return {
      available: false,
      providerId: implemented[0].id,
      reason: "adapter-not-implemented",
      message: "AI adapters are registered but no analysis engine is wired yet.",
    };
  }

  if (configured.length > 0) {
    const descriptor = configured[0];
    return {
      available: false,
      providerId: descriptor.id,
      reason: "adapter-not-implemented",
      message: `${descriptor.name} key detected and stored locally. The adapter ships in ${descriptor.plannedIn}; no request was sent.`,
    };
  }

  return {
    available: false,
    providerId: null,
    reason: "not-configured",
    message:
      "No AI provider configured. Add a key in Settings → Providers (BYOK). Keys stay on this machine and are never sent to FinSight.",
  };
}

/** Deterministic symbol detection from natural language. */
function detectSymbols(query: string): string[] {
  const q = ` ${query.toLowerCase()} `;
  const found = new Set<string>();
  for (const company of MOCK_UNIVERSE) {
    if (q.includes(` ${company.symbol.toLowerCase()} `)) {
      found.add(company.symbol);
      continue;
    }
    const firstWord = company.name.split(/[\s,]+/)[0].toLowerCase();
    if (firstWord.length >= 4 && q.includes(` ${firstWord} `)) {
      found.add(company.symbol);
    }
  }
  return Array.from(found);
}

function marketObservation(quotes: Quote[]): string | null {
  if (quotes.length === 0) return null;
  const ranked = [...MOCK_UNIVERSE].sort(
    (a, b) => b.changePercent - a.changePercent,
  );
  const lines = quotes.map((quote) => {
    const rank = ranked.findIndex((c) => c.symbol === quote.symbol);
    const rankText =
      rank >= 0 ? `; rank ${rank + 1}/${ranked.length} by % move in the demo universe` : "";
    return `${quote.symbol} is ${formatPercent(quote.changePercent)} today at ${formatPrice(
      quote.price,
      quote.currency,
    )}${rankText}.`;
  });
  return lines.join(" ");
}

function sectorObservation(symbol: string): string | null {
  const company = getCompany(symbol);
  if (!company) return null;
  const peers = MOCK_UNIVERSE.filter((c) => c.sector === company.sector);
  const up = peers.filter((c) => c.changePercent > 0).length;
  return `Sector context: ${up}/${peers.length} ${company.sector} names are up today in the demo universe.`;
}

export async function runResearch(query: string): Promise<ResearchResult> {
  initializeProviders();

  const matchedSymbols = detectSymbols(query);
  const ai = await getAIResult();

  // --- Evidence collection (market data + news services) ------------------
  const [marketServed, newsServed, fundamentalsServed] = await Promise.all([
    matchedSymbols.length > 0
      ? marketDataService.getQuotes(matchedSymbols).then((served) => ({
          quotes: served.data.quotes,
          source: served.source,
        }))
      : marketDataService.getIndices().then((served) => ({
          quotes: served.data,
          source: served.source,
        })),
    newsService.getStories(
      matchedSymbols.length > 0
        ? { symbols: matchedSymbols, limit: 6 }
        : { limit: 6 },
    ),
    matchedSymbols[0]
      ? marketDataService.getFundamentals(matchedSymbols[0]).catch(() => null)
      : Promise.resolve(null),
  ]);

  const quotes: Quote[] = marketServed.quotes;
  const stories = newsServed.data;

  // --- Pipeline steps ------------------------------------------------------
  const steps: ResearchStep[] = [
    {
      id: "market",
      label: "Market movement",
      status: "collected",
      detail: `${quotes.length} quote${quotes.length === 1 ? "" : "s"} retrieved · ${marketServed.source.label}`,
    },
    {
      id: "news",
      label: "Latest news",
      status: "collected",
      detail: `${stories.length} clustered stor${stories.length === 1 ? "y" : "ies"} · ${newsServed.source.label}`,
    },
    {
      id: "sector",
      label: "Sector movement",
      status: "collected",
      detail: matchedSymbols.length > 0 ? "Live company and market data available; peer-sector breadth remains limited to the configured universe." : "Live index context available; sector breadth requires a broader fundamentals universe.",
    },
    {
      id: "events",
      label: "Company events",
      status: "unavailable",
      detail: "Earnings & event calendar ingestion arrives in v0.5",
    },
    {
      id: "filings",
      label: "Recent filings",
      status: "unavailable",
      detail: "SEC/MCA filings ingestion arrives in v0.5",
    },
    {
      id: "ai",
      label: "AI interpretation",
      status: "unavailable",
      detail: ai.message,
    },
  ];

  // --- Evidence cards ------------------------------------------------------
  const evidence: ResearchEvidence[] = [
    {
      id: "ev-market",
      kind: "market",
      label: matchedSymbols.length ? "Matched securities" : "Market context",
      status: "collected",
      detail: quotes
        .map(
          (q) =>
            `${q.symbol} ${formatPercent(q.changePercent)} @ ${formatPrice(q.price, q.currency)}`,
        )
        .join("  ·  "),
      source: marketServed.source,
    },
    {
      id: "ev-news",
      kind: "news",
      label: "Related stories",
      status: stories.length ? "collected" : "unavailable",
      detail: stories.length
        ? stories
            .slice(0, 3)
            .map((s) => s.headline)
            .join("  |  ")
        : "No stories matched the query in the demo set.",
      source: newsServed.source,
    },
  ];

  const firstMatched = matchedSymbols[0] ? getCompany(matchedSymbols[0]) : undefined;
  const liveFundamentals: Fundamentals | null = fundamentalsServed?.data ?? null;
  if (firstMatched) {
    const fundamentals = liveFundamentals;
    evidence.push({
      id: "ev-fundamentals",
      kind: "fundamentals",
      label: fundamentals ? "Fundamentals" : "Fundamentals (demo fallback)",
      status: "collected",
      detail: fundamentals
        ? `P/E ${fundamentals.pe}  ·  ROE ${fundamentals.roe}%  ·  Mkt cap ${formatMarketCap(
            fundamentals.marketCap,
            fundamentals.currency,
          )}  ·  52w ${formatPrice(fundamentals.week52Low, fundamentals.currency)} – ${formatPrice(
            fundamentals.week52High,
            fundamentals.currency,
          )}`
        : `P/E ${firstMatched.pe}  ·  ROE ${firstMatched.roe}%  ·  Mkt cap ${formatMarketCap(
            firstMatched.marketCap,
            firstMatched.currency,
          )}  ·  52w ${formatPrice(firstMatched.week52Low, firstMatched.currency)} – ${formatPrice(
            firstMatched.week52High,
            firstMatched.currency,
          )}`,
      source: fundamentalsServed?.source ?? { providerId: "mock", label: "Demo data (mock)", isMock: true, degraded: false },
    });
  }

  // --- Deterministic observations (code, NOT AI) ---------------------------
  const observations: string[] = [];
  if (!matchedSymbols.length) {
    observations.push(
      "No specific securities detected in the question — showing broad market context.",
    );
  }
  const marketLine = marketObservation(quotes);
  if (marketLine) observations.push(marketLine);
  if (firstMatched) {
    const sectorLine = sectorObservation(firstMatched.symbol);
    if (sectorLine) observations.push(sectorLine);
  }
  if (stories.length) {
    observations.push(
      `${stories.length} recent demo stor${stories.length === 1 ? "y mentions" : "ies mention"} ${
        matchedSymbols.length ? matchedSymbols.join(", ") : "the market"
      }.`,
    );
  }

  return {
    query,
    matchedSymbols,
    steps,
    evidence,
    observations,
    quotes,
    stories,
    ai,
    generatedAt: new Date().toISOString(),
    isMock: marketServed.source.isMock || newsServed.source.isMock,
  };
}
