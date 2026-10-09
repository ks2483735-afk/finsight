import { getSecret } from "@/lib/database/repos/settings";
import type { Company, Fundamentals, HistoryRange, MarketDataProvider, PricePoint, Quote, QuoteBatch } from "@/lib/market-data/types";
import { envKey } from "@/lib/providers/config";
import { fetchWithTimeout } from "@/lib/providers/fetch-with-timeout";

const BASE_URL = "https://finnhub.io/api/v1";
const INDEX_UNIVERSE = [
  { symbol: "^GSPC", name: "S&P 500", region: "US" as const, currency: "USD" as const },
  { symbol: "^IXIC", name: "Nasdaq Composite", region: "US" as const, currency: "USD" as const },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", region: "US" as const, currency: "USD" as const },
  { symbol: "^NSEI", name: "NIFTY 50", region: "IN" as const, currency: "INR" as const },
  { symbol: "^BSESN", name: "BSE Sensex", region: "IN" as const, currency: "INR" as const },
];

const INDIAN_SYMBOLS = new Set([
  "RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK","ITC","SBIN",
  "TATAMOTORS","HINDUNILVR","BAJFINANCE","NIFTYBEES",
]);

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  t?: number;
};

function apiKey(): string {
  const key = envKey({
    id: "finnhub", name: "Finnhub", kind: "market-data",
    envVar: "FINNHUB_API_KEY", docsUrl: "", keyUrl: "",
    adapterImplemented: true, plannedIn: "v0.2", description: "",
  }) ?? getSecret("FINNHUB_API_KEY");
  if (!key) throw new Error("Finnhub API key is not configured.");
  return key;
}

async function request(symbol: string): Promise<FinnhubQuote> {
  const url = new URL(`${BASE_URL}/quote`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", apiKey());

  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Finnhub HTTP ${response.status}`);
  const json = (await response.json()) as FinnhubQuote;
  if (typeof json.c !== "number" || typeof json.dp !== "number") {
    throw new Error(`Finnhub returned no quote for ${symbol}`);
  }
  return json;
}

function normalize(symbol: string, quote: FinnhubQuote): Quote {
  return {
    symbol,
    name: symbol,
    exchange: "US",
    region: "US",
    price: quote.c!,
    currency: "USD",
    change: quote.d ?? 0,
    changePercent: quote.dp ?? 0,
    timestamp: quote.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString(),
    source: "finnhub",
    isMock: false,
  };
}


async function history(symbol: string, range: HistoryRange): Promise<PricePoint[]> {
  const now = Math.floor(Date.now() / 1000);
  const spans: Record<HistoryRange, { seconds: number; resolution: string }> = {
    "1D": { seconds: 24 * 60 * 60, resolution: "5" },
    "1W": { seconds: 7 * 24 * 60 * 60, resolution: "30" },
    "1M": { seconds: 30 * 24 * 60 * 60, resolution: "60" },
    "1Y": { seconds: 365 * 24 * 60 * 60, resolution: "D" },
  };
  const span = spans[range];
  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", span.resolution);
  url.searchParams.set("from", String(now - span.seconds));
  url.searchParams.set("to", String(now));
  url.searchParams.set("token", apiKey());

  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Finnhub HTTP ${response.status}`);
  const json = (await response.json()) as { s?: string; t?: number[]; c?: number[] };
  if (json.s !== "ok" || !json.t?.length || !json.c?.length) {
    throw new Error(`Finnhub returned no history for ${symbol}`);
  }
  return json.t.map((time, i) => ({
    timestamp: new Date(time * 1000).toISOString(),
    price: json.c![i],
  })).filter((point) => Number.isFinite(point.price));
}

async function fundamentals(symbol: string): Promise<Fundamentals> {
  const normalized = symbol.trim().toUpperCase();
  const url = new URL(`${BASE_URL}/stock/metric`);
  url.searchParams.set("symbol", normalized);
  url.searchParams.set("metric", "all");
  url.searchParams.set("token", apiKey());

  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Finnhub HTTP ${response.status}`);
  const json = (await response.json()) as {
    metric?: Record<string, number | undefined>;
  };
  const m = json.metric;
  if (!m) throw new Error(`Finnhub returned no fundamentals for ${normalized}`);

  const value = (key: string) => {
    const n = Number(m[key]);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    symbol: normalized,
    name: normalized,
    marketCap: value("marketCapitalization") * 1_000_000,
    pe: value("peBasicExclExtraTTM") || value("peNormalizedAnnual"),
    ps: value("psTTM"),
    pb: value("pbQuarterly"),
    eps: value("epsBasicExclExtraItemsTTM"),
    revenue: 0,
    revenueGrowth: value("revenueGrowthTTMYoy"),
    epsGrowth: value("epsGrowthTTMYoy"),
    roe: value("roeTTM"),
    dividendYield: value("dividendYieldIndicatedAnnual"),
    debtToEquity: value("debtEquityAnnual"),
    week52High: value("52WeekHigh"),
    week52Low: value("52WeekLow"),
    currency: "USD",
    source: "finnhub",
    isMock: false,
  };
}

export const finnhubProvider: MarketDataProvider = {
  id: "finnhub",
  label: "Finnhub",
  isMock: false,

  async getQuotes(symbols: string[]): Promise<QuoteBatch> {
    const normalized = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
    // Finnhub's documented real-time quote endpoint is for US stocks.
    if (normalized.some((symbol) => INDIAN_SYMBOLS.has(symbol))) {
      throw new Error("Finnhub real-time adapter currently targets US equities.");
    }

    const quotes: Quote[] = [];
    const missing: string[] = [];
    for (const symbol of normalized) {
      try {
        quotes.push(normalize(symbol, await request(symbol)));
      } catch {
        missing.push(symbol);
      }
    }

    if (!quotes.length) throw new Error("Finnhub returned no usable quotes.");
    return { quotes, missing };
  },

  async getAllQuotes(): Promise<Quote[]> {
    throw new Error("Finnhub bulk universe is not enabled yet.");
  },

  async getIndices(): Promise<Quote[]> {
    const quotes: Quote[] = [];
    for (const index of INDEX_UNIVERSE) {
      try {
        const quote = await request(index.symbol);
        quotes.push({
          ...normalize(index.symbol, quote),
          name: index.name,
          region: index.region,
          currency: index.currency,
          exchange: index.region === "IN" ? "INDEX-IN" : "INDEX-US",
        });
      } catch {
        // Continue so one unsupported index does not hide the rest.
      }
    }
    if (!quotes.length) throw new Error("Finnhub returned no supported index quotes.");
    return quotes;
  },

  async getCompanies(): Promise<Company[]> {
    throw new Error("Finnhub company adapter is not enabled yet.");
  },

  getFundamentals: fundamentals,
};
