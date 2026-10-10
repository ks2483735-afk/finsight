import { getKeyStatus, isProviderEnabled, envKey } from "@/lib/providers/config";
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

export async function buildTestResult(
id: string,
): Promise<TestResult | null> {
initializeProviders();

const descriptor = getRegistry().getDescriptor(id);
if (!descriptor) return null;

if (!descriptor.envVar) {
if (!isProviderEnabled(descriptor.id)) {
return {
ok: false,
requestSent: false,
message: `${descriptor.name} is disabled. Enable it to use this provider.`,
};
}


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
message: `Key detected, but live connection testing is not implemented yet. No request was sent.`,
};
}

try {
if (id === "alphavantage") {
const message = await testAlphaVantageConnection();
return { ok: true, requestSent: true, message };
}

if (id === "finnhub") {
  const message = await testFinnhubConnection();
  return { ok: true, requestSent: true, message };
}

if (id === "newsapi") {
  const key =
    envKey({
      id: descriptor.id,
      name: descriptor.name,
      kind: descriptor.kind,
      envVar: descriptor.envVar,
      docsUrl: descriptor.docsUrl,
      keyUrl: descriptor.keyUrl,
      adapterImplemented: descriptor.adapterImplemented,
      plannedIn: descriptor.plannedIn,
      description: descriptor.description,
    }) ?? (await getSecret(descriptor.envVar));

  if (!key) {
    return {
      ok: false,
      requestSent: false,
      message: "NewsAPI key is not configured.",
    };
  }

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", "us");
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("apiKey", key);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as {
    status?: string;
    code?: string;
    message?: string;
  };

  if (!response.ok || data.status !== "ok") {
    return {
      ok: false,
      requestSent: true,
      message: `NewsAPI test failed: ${data.message || data.code || `HTTP ${response.status}`}.`,
    };
  }

  return {
    ok: true,
    requestSent: true,
    message: "Connection successful. NewsAPI accepted the key.",
  };
}

return {
  ok: false,
  requestSent: false,
  message: `No live connection test is implemented for ${descriptor.name}.`,
};


} catch (error) {
return {
ok: false,
requestSent: true,
message:
error instanceof Error
? error.message
: "Connection test failed.",
};
}
}


