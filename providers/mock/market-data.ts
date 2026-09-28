/**
 * Mock market-data adapter (DEMO DATA ONLY).
 *
 * Implements the real MarketDataProvider contract over the local demo
 * universe so the entire stack — services, routes, UI states — can be built
 * and verified before live adapters exist (v0.2).
 *
 * Simulated latency is intentional and fixed so loading skeletons are
 * actually exercised in the UI.
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

const SIMULATED_LATENCY_MS = 220;

const latency = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export const mockMarketProvider: MarketDataProvider = {
  id: "mock",
  label: "Demo data (mock)",
  isMock: true,

  async getQuotes(symbols: string[]): Promise<QuoteBatch> {
    await latency();
    return quotesFor(symbols);
  },

  async getAllQuotes(): Promise<Quote[]> {
    await latency();
    return allQuotes();
  },

  async getIndices(): Promise<Quote[]> {
    await latency();
    return indexQuotes();
  },

  async getCompanies(): Promise<Company[]> {
    await latency();
    return MOCK_UNIVERSE;
  },
};

/** Synchronous demo lookup for composition inside services. */
export function mockQuote(symbol: string): Quote | null {
  const company = getCompany(symbol);
  return company ? companyToQuote(company) : null;
}
