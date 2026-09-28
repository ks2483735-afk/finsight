import { fail, ok, readBody, routeError } from "@/lib/api";
import { getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { getRegistry } from "@/lib/providers/registry";
import { deleteSecret, setSecret, setPreference } from "@/lib/database/repos/settings";
import { initializeProviders } from "@/providers";
import type { ProviderStatus } from "@/lib/providers/types";

export const dynamic = "force-dynamic";

function currentProviders(): ProviderStatus[] {
  initializeProviders();
  return getRegistry().listDescriptors().map((descriptor) => {
    const keyStatus = getKeyStatus(descriptor);
    return {
      ...descriptor,
      configured: keyStatus.configured,
      keySource: keyStatus.source,
      enabled: isProviderEnabled(descriptor.id),
    };
  });
}

/**
 * GET /api/settings/providers
 * Returns provider status only — stored key values never leave the server.
 */
export async function GET() {
  try {
    return ok({ providers: currentProviders() });
  } catch (err) {
    return routeError(err);
  }
}

/**
 * PUT /api/settings/providers
 * Body: { id, key?: string | null, enabled?: boolean }
 *   key "" / null  → removes the stored key
 */
export async function PUT(req: Request) {
  try {
    const body = await readBody(req);
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return fail("Missing provider id.", 400);

    initializeProviders();
    const descriptor = getRegistry().getDescriptor(id);
    if (!descriptor) return fail(`Unknown provider: ${id}`, 404);

    if ("key" in body) {
      if (!descriptor.envVar) {
        return fail(`${descriptor.name} does not use an API key.`, 400);
      }
      const key = typeof body.key === "string" ? body.key.trim() : "";
      if (key) setSecret(descriptor.envVar, key);
      else deleteSecret(descriptor.envVar);
    }

    if ("enabled" in body) {
      setPreference(`provider:${id}:enabled`, body.enabled ? "1" : "0");
    }

    return ok({ providers: currentProviders() });
  } catch (err) {
    return routeError(err);
  }
}
