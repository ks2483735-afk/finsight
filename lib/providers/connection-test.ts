/**
 * Provider connection test.
 *
 * v0.1 has no live adapters, so this reports the honest truth: whether a
 * key exists, where it came from, and that no request was sent. Real
 * health checks arrive with each adapter (v0.2+).
 */

import { envKey, getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { getSecret } from "@/lib/database/repos/settings";
import { getRegistry } from "@/lib/providers/registry";
import { initializeProviders } from "@/providers";
import { testAlphaVantageConnection } from "@/providers/alphavantage/test";
import { testFinnhubConnection } from "@/providers/finnhub/test";

export interface TestResult {
  ok: boolean;
  requestSent: boolean;
  message: string;
}

async function keyFor(envVar: string): Promise<string | null> {
  return envKey({
    id: envVar, name: envVar, kind: "market-data", envVar,
    docsUrl: "", keyUrl: "", adapterImplemented: true,
    plannedIn: "v0.2", description: "",
  }) ?? getSecret(envVar);
}

async function liveTest(id: string, key: string): Promise<TestResult> {
  if (id === "finnhub") {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${encodeURIComponent(key)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return { ok: false, requestSent: true, message: `Finnhub returned HTTP ${response.status}.` };
    }
    const data = (await response.json()) as { c?: number };
    return typeof data.c === "number"
      ? { ok: true, requestSent: true, message: "Connection successful. Finnhub returned a live AAPL quote." }
      : { ok: false, requestSent: true, message: "Finnhub responded, but no usable quote was returned." };
  }

  if (id === "alphavantage") {
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("function", "GLOBAL_QUOTE");
    url.searchParams.set("symbol", "IBM");
    url.searchParams.set("apikey", key);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, requestSent: true, message: `Alpha Vantage returned HTTP ${response.status}.` };
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (data["Error Message"] || data.Note || data.Information) {
      return {
        ok: false,
        requestSent: true,
        message: String(data["Error Message"] || data.Note || data.Information),
      };
    }
    const quote = data["Global Quote"] as Record<string, unknown> | undefined;
    return quote?.["05. price"]
      ? { ok: true, requestSent: true, message: "Connection successful. Alpha Vantage returned an IBM quote." }
      : { ok: false, requestSent: true, message: "Alpha Vantage responded, but no usable quote was returned." };
  }

  try {
    const message =
      descriptor.id === "alphavantage"
        ? await testAlphaVantageConnection()
        : descriptor.id === "finnhub"
          ? await testFinnhubConnection()
          : "Key present.";
    return { ok: true, requestSent: true, message };
  } catch (error) {
    return {
      ok: false,
      requestSent: true,
      message: error instanceof Error ? error.message : "Connection test failed.",
    };
  }
}

export async function buildTestResult(id: string): Promise<TestResult | null> {
  initializeProviders();
  const descriptor = getRegistry().getDescriptor(id);
  if (!descriptor) return null;

  if (!descriptor.envVar) {
    return {
      ok: true,
      requestSent: false,
      message: "No API key required — this source is available in zero-key mode.",
    };
  }

  const keyStatus = getKeyStatus(descriptor);
  if (!keyStatus.configured) {
    return {
      ok: false,
      requestSent: false,
      message: `No key configured. Add your ${descriptor.name} API key first.`,
    };
  }

  if (!isProviderEnabled(descriptor.id)) {
    return {
      ok: false,
      requestSent: false,
      message: `${descriptor.name} is disabled. Enable it to use this provider.`,
    };
  }

  if (!descriptor.adapterImplemented) {
    return {
      ok: true,
      requestSent: false,
      message: `Key detected (${
        keyStatus.source === "env" ? "from environment" : "stored locally"
      }). Live connection testing starts when the ${descriptor.name} adapter ships in ${
        descriptor.plannedIn
      }. No request was sent.`,
    };
  }

  return { ok: true, requestSent: false, message: "Key present." };
}
