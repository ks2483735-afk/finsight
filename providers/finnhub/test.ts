import { getSecret } from "@/lib/database/repos/settings";
import { envKey } from "@/lib/providers/config";

export async function testFinnhubConnection(): Promise<string> {
  const key = envKey({
    id: "finnhub", name: "Finnhub", kind: "market-data",
    envVar: "FINNHUB_API_KEY", docsUrl: "", keyUrl: "",
    adapterImplemented: true, plannedIn: "v0.2", description: "",
  }) ?? getSecret("FINNHUB_API_KEY");
  if (!key) throw new Error("Finnhub API key is not configured.");

  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", "AAPL");
  url.searchParams.set("token", key);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Finnhub returned HTTP ${response.status}.`);
  const data = (await response.json()) as { c?: number };
  if (typeof data.c !== "number") throw new Error("Finnhub returned no usable quote.");
  return "Connection successful. Finnhub returned a live AAPL quote.";
}
