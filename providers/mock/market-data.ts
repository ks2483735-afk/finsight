/**
 * Mock market-data adapter (DEMO DATA ONLY).
 *
 * The demo provider is local computation, so it returns immediately instead
 * of adding artificial delays to every page that uses fallback data.
 */

import type {
  Company,
  MarketDataProvider,
  Quote,
  QuoteBatch,
} from "@/lib/market-data/types";
import {
  MOCK_UNIVERSE,
  allQuotes,
  companyToQuote,
  getCompany,
  indexQuotes,
  quotesFor,
} from "@/lib/mock/companies";

export const mockMarketProvider: MarketDataProvider = {
  id: "mock",
  label: "Demo data (mock)",
  isMock: true,

  async getQuotes(symbols: string[]): Promise<QuoteBatch> {
    return quotesFor(symbols);
  },

  async getAllQuotes(): Promise<Quote[]> {
    return allQuotes();
  },

  async getIndices(): Promise<Quote[]> {
    return indexQuotes();
  },

  async getCompanies(): Promise<Company[]> {
    return MOCK_UNIVERSE;
  },
};

/** Synchronous demo lookup for composition inside services. */
export function mockQuote(symbol: string): Quote | null {
  const company = getCompany(symbol);
  return company ? companyToQuote(company) : null;
}
