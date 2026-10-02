import type { ProviderDescriptor } from "@/lib/providers/types";

/** Alpha Vantage — descriptor only. The real adapter ships in v0.2. */
export const alphaVantageDescriptor: ProviderDescriptor = {
  id: "alphavantage",
  name: "Alpha Vantage",
  kind: "market-data",
  envVar: "ALPHA_VANTAGE_API_KEY",
  docsUrl: "https://www.alphavantage.co/documentation",
  keyUrl: "https://www.alphavantage.co/support/#api-key",
  adapterImplemented: true,
  plannedIn: "v0.2",
  description:
    "Quotes, time series, and fundamentals for US and Indian markets.",
};
