import { getSecret } from "@/lib/database/repos/settings";
import { envKey } from "@/lib/providers/config";

export async function testAlphaVantageConnection(): Promise<string> {
  const key = envKey({
    id: "alphavantage", name: "Alpha Vantage", kind: "market-data",
    envVar: "ALPHA_VANTAGE_API_KEY", docsUrl: "", keyUrl: "",
    adapterImplemented: true, plannedIn: "v0.2", description: "",
  }) ?? getSecret("ALPHA_VANTAGE_API_KEY");
  if (!key) throw new Error("Alpha Vantage API key is not configured.");

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", "IBM");
  url.searchParams.set("apikey", key);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Alpha Vantage returned HTTP ${response.status}.`);
  const data = (await response.json()) as Record<string, unknown>;
  if (data["Error Message"] || data.Note || data.Information) {
    throw new Error(String(data["Error Message"] || data.Note || data.Information));
  }
  const quote = data["Global Quote"] as Record<string, unknown> | undefined;
  if (!quote?.["05. price"]) throw new Error("Alpha Vantage returned no usable quote.");
  return "Connection successful. Alpha Vantage returned an IBM quote.";
}
