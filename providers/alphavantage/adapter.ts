import { getSecret } from "@/lib/database/repos/settings";
import type { Company, HistoryRange, MarketDataProvider, PricePoint, Quote, QuoteBatch } from "@/lib/market-data/types";
import { envKey } from "@/lib/providers/config";

const BASE_URL = "https://www.alphavantage.co/query";

const INDIAN_SYMBOLS = new Set([
  "RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK","ITC","SBIN",
  "TATAMOTORS","HINDUNILVR","BAJFINANCE","NIFTYBEES",
]);

type AlphaQuote = Record<string, string>;

function apiKey(): string {
  const key = envKey({
    id: "alphavantage", name: "Alpha Vantage", kind: "market-data",
    envVar: "ALPHA_VANTAGE_API_KEY", docsUrl: "", keyUrl: "",
    adapterImplemented: true, plannedIn: "v0.2", description: "",
  }) ?? getSecret("ALPHA_VANTAGE_API_KEY");
  if (!key) throw new Error("Alpha Vantage API key is not configured.");
  return key;
}

async function request(symbol: string): Promise<AlphaQuote> {
  const url = new URL(BASE_URL);
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey());

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);
  const json = (await response.json()) as {
    "Global Quote"?: AlphaQuote;
    Note?: string;
    Information?: string;
    "Error Message"?: string;
  };

  if (json["Error Message"] || json.Note || json.Information) {
    throw new Error(json["Error Message"] || json.Note || json.Information);
  }

  const quote = json["Global Quote"];
  if (!quote || !quote["05. price"]) {
    throw new Error(`Alpha Vantage returned no quote for ${symbol}`);
  }
  return quote;
}

function alphaSymbol(symbol: string): string {
  return INDIAN_SYMBOLS.has(symbol) ? `${symbol}.BSE` : symbol;
}

function normalize(input: string, quote: AlphaQuote): Quote {
  const symbol = input.toUpperCase();
  const price = Number(quote["05. price"]);
  const change = Number(quote["09. change"] ?? 0);
  const changePercent = Number(String(quote["10. change percent"] ?? "0").replace("%", ""));
  const tradingDay = quote["07. latest trading day"];
  const timestamp = tradingDay
    ? new Date(`${tradingDay}T00:00:00Z`).toISOString()
    : new Date().toISOString();
  const isIndia = INDIAN_SYMBOLS.has(symbol);

  return {
    symbol,
    name: symbol,
    exchange: isIndia ? "BSE" : "US",
    region: isIndia ? "IN" : "US",
    price,
    currency: isIndia ? "INR" : "USD",
    change,
    changePercent,
    timestamp,
    source: "alphavantage",
    isMock: false,
  };
}


async function history(symbol: string, _range: HistoryRange): Promise<PricePoint[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", alphaSymbol(symbol.toUpperCase()));
  url.searchParams.set("outputsize", "compact");
  url.searchParams.set("apikey", apiKey());

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Alpha Vantage HTTP ${response.status}`);
  const json = (await response.json()) as Record<string, unknown>;
  if (json["Error Message"] || json.Note || json.Information) {
    throw new Error(String(json["Error Message"] || json.Note || json.Information));
  }
  const series = json["Time Series (Daily)"] as Record<string, Record<string, string>> | undefined;
  if (!series) throw new Error(`Alpha Vantage returned no history for ${symbol}`);
  const points = Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      timestamp: new Date(`${date}T00:00:00Z`).toISOString(),
      price: Number(values["4. close"]),
    }))
    .filter((point) => Number.isFinite(point.price));
  const count = _range === "1D" ? 2 : _range === "1W" ? 5 : _range === "1M" ? 22 : 100;
  return points.slice(-count);
}

export const alphaVantageProvider: MarketDataProvider = {
  id: "alphavantage",
  label: "Alpha Vantage",
  isMock: false,

  async getQuotes(symbols: string[]): Promise<QuoteBatch> {
    if (!symbols.length) return { quotes: [], missing: [] };
    const normalized = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
    const quotes: Quote[] = [];
    const missing: string[] = [];

    // Keep requests sequentially to be gentle with provider quotas.
    for (const symbol of normalized) {
      try {
        quotes.push(normalize(symbol, await request(alphaSymbol(symbol))));
      } catch {
        missing.push(symbol);
      }
    }

    if (!quotes.length) throw new Error("Alpha Vantage returned no usable quotes.");
    return { quotes, missing };
  },

  async getAllQuotes(): Promise<Quote[]> {
    // Bulk universe support is intentionally deferred until we have a
    // provider endpoint that can serve it without exhausting BYOK quotas.
    throw new Error("Alpha Vantage bulk universe is not enabled yet.");
  },

  async getIndices(): Promise<Quote[]> {
    throw new Error("Alpha Vantage index adapter is not enabled yet.");
  },

  async getCompanies(): Promise<Company[]> {
    throw new Error("Alpha Vantage company adapter is not enabled yet.");
  },
};
