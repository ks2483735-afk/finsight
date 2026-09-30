/**
 * Market-data domain types (normalized across providers).
 * See spec §6: the UI consumes these objects and never provider payloads.
 */

export type MarketRegion = "US" | "IN";
export type Currency = "USD" | "INR";

/** Normalized quote — the single shape the UI consumes for any asset price. */
export interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  region: MarketRegion;
  price: number;
  currency: Currency;
  change: number;
  changePercent: number;
  /** ISO timestamp of the quote. */
  timestamp: string;
  source: string;
  isMock: boolean;
}

/** A company in the research universe (screener + directories). */
export type AssetClass = "stock" | "etf";

export interface Company {
  symbol: string;
  assetClass: AssetClass;
  name: string;
  exchange: string;
  region: MarketRegion;
  country: string;
  currency: Currency;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  ps: number;
  pb: number;
  roe: number;
  epsGrowth: number;
  revenueGrowth: number;
  dividendYield: number;
  debtToEquity: number;
  week52High: number;
  week52Low: number;
  about: string;
}

export interface Movers {
  gainers: Quote[];
  losers: Quote[];
}

export interface PricePoint {\n  timestamp: string;\n  price: number;\n}\n\nexport type HistoryRange = "1D" | "1W" | "1M" | "1Y";\n\nexport interface QuoteBatch {
  quotes: Quote[];
  missing: string[];
}

/**
 * Contract every market-data adapter implements.
 * The UI never calls an adapter — services (lib/market-data/service.ts) do,
 * so providers can be swapped or added without touching frontend code.
 */
export interface MarketDataProvider {
  /** Stable id (matches the registered ProviderDescriptor). */
  id: string;
  label: string;
  /** true only for the demo adapter — the UI labels its data as MOCK. */
  isMock: boolean;
  getQuotes(symbols: string[]): Promise<QuoteBatch>;
  getAllQuotes(): Promise<Quote[]>;
  getIndices(): Promise<Quote[]>;
  getCompanies(): Promise<Company[]>;
}
