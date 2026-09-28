import type { ProviderDescriptor } from "@/lib/providers/types";

/** Finnhub — descriptor only. The real adapter ships in v0.2. */
export const finnhubDescriptor: ProviderDescriptor = {
  id: "finnhub",
  name: "Finnhub",
  kind: "market-data",
  envVar: "FINNHUB_API_KEY",
  docsUrl: "https://finnhub.io/docs/api",
  keyUrl: "https://finnhub.io/register",
  adapterImplemented: false,
  plannedIn: "v0.2",
  description:
    "Real-time and historical quotes, company fundamentals, and filings.",
};
