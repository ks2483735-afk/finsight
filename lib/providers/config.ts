/**
 * Resolves whether a provider key is configured.
 *
 * Key material itself never leaves the server: Settings only ever sees
 * `configured: true/false` and the key's source (env vs. locally stored).
 */

import { getPreference, getSecret } from "@/lib/database/repos/settings";
import type { KeySource, ProviderDescriptor } from "@/lib/providers/types";

export function envKey(descriptor: ProviderDescriptor): string | null {
  if (!descriptor.envVar) return null;
  const value = process.env[descriptor.envVar];
  return value && value.trim() ? value.trim() : null;
}

export interface KeyStatus {
  configured: boolean;
  source: KeySource;
}

/** Provider on/off switch (stored locally in settings). Default: enabled. */
export function isProviderEnabled(id: string): boolean {
  try {
    return getPreference(`provider:${id}:enabled`, "1") !== "0";
  } catch {
    return true;
  }
}

export function getKeyStatus(descriptor: ProviderDescriptor): KeyStatus {
  if (!descriptor.envVar) {
    // No-key provider (e.g. public RSS): always available.
    return { configured: true, source: "none" };
  }
  if (envKey(descriptor)) return { configured: true, source: "env" };
  try {
    if (getSecret(descriptor.envVar)) return { configured: true, source: "stored" };
  } catch {
    // Database unavailable — fall through to "not configured".
  }
  return { configured: false, source: "none" };
}
