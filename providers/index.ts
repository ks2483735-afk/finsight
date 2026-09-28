/**
 * Provider bootstrap.
 *
 * Imports every provider descriptor, registers them with the registry, and
 * installs the mock/demo fallbacks. Live adapters (v0.2+) will register
 * here via registry.registerMarketAdapter(...) / registerNewsAdapter(...).
 *
 * Services call initializeProviders() on entry; it is idempotent and safe
 * across dev hot-reloads.
 */

import type { ProviderDescriptor } from "@/lib/providers/types";
import { getRegistry } from "@/lib/providers/registry";
import { geminiDescriptor } from "./gemini";
import { aimlapiDescriptor } from "./aimlapi";
import { bazaarlinkDescriptor } from "./bazaarlink";
import { alphaVantageDescriptor } from "./alphavantage";
import { finnhubDescriptor } from "./finnhub";
import { newsApiDescriptor } from "./newsapi";
import { rssDescriptor } from "./rss";
import { mockMarketProvider } from "./mock/market-data";
import { mockNewsProvider } from "./mock/news";

export const PROVIDER_DESCRIPTORS: ProviderDescriptor[] = [
  // AI (adapters land v0.3)
  geminiDescriptor,
  aimlapiDescriptor,
  bazaarlinkDescriptor,
  // Market data (adapters land v0.2)
  alphaVantageDescriptor,
  finnhubDescriptor,
  // News (adapters land v0.4)
  newsApiDescriptor,
  rssDescriptor,
];

const globalRef = globalThis as { __finsightProvidersReady?: boolean };

export function initializeProviders(): void {
  if (globalRef.__finsightProvidersReady) return;
  const registry = getRegistry();
  for (const descriptor of PROVIDER_DESCRIPTORS) {
    registry.registerDescriptor(descriptor);
  }
  // Spec §23 fallback chain: live providers (none yet) → demo data →
  // clear "unavailable" message. The mock adapter is never presented as a
  // real API; its payload carries isMock = true end-to-end.
  registry.registerFallbacks({
    market: mockMarketProvider,
    news: mockNewsProvider,
  });
  // Live adapters register here as they are implemented (v0.2+):
  //   registry.registerMarketAdapter(alphaVantageProvider);
  //   registry.registerNewsAdapter(newsApiProvider);
  globalRef.__finsightProvidersReady = true;
}
