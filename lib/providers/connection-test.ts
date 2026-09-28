/**
 * Provider connection test.
 *
 * v0.1 has no live adapters, so this reports the honest truth: whether a
 * key exists, where it came from, and that no request was sent. Real
 * health checks arrive with each adapter (v0.2+).
 */

import { getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { getRegistry } from "@/lib/providers/registry";
import { initializeProviders } from "@/providers";

export interface TestResult {
  ok: boolean;
  requestSent: boolean;
  message: string;
}

export function buildTestResult(id: string): TestResult | null {
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
