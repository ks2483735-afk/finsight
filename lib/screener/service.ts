/**
 * Screener service — applies structured filters over the company universe.
 * Server-side only (imports the market-data service).
 */

import { marketDataService } from "@/lib/market-data/service";
import type { Company } from "@/lib/market-data/types";
import type { DataSourceInfo } from "@/lib/providers/types";
import type { ScreenerFilters } from "@/lib/screener/parse";

export interface ScreenerResult {
  results: Company[];
  total: number;
  source: DataSourceInfo;
}

function matches(company: Company, filters: ScreenerFilters): boolean {
  if (filters.region !== "ALL" && company.region !== filters.region) return false;
  if (filters.assetClass !== "ALL" && company.assetClass !== filters.assetClass) {
    return false;
  }
  if (filters.sector !== "ALL" && company.sector !== filters.sector) return false;

  for (const [field, bounds] of Object.entries(filters.criteria)) {
    if (!bounds) continue;
    const value =
      field === "marketCap" ? company.marketCap / 1e9 : company[field as keyof Company];
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    if (bounds.min !== undefined && value < bounds.min) return false;
    if (bounds.max !== undefined && value > bounds.max) return false;
  }
  return true;
}

export async function runScreener(filters: ScreenerFilters): Promise<ScreenerResult> {
  const served = await marketDataService.getCompanies();
  const results = served.data
    .filter((company) => matches(company, filters))
    .sort((a, b) => b.marketCap - a.marketCap);

  return {
    results,
    total: served.data.length,
    source: served.source,
  };
}
