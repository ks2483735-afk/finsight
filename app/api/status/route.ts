import { ok, routeError } from "@/lib/api";
import { getDbStatus } from "@/lib/database/sqlite";
import { getKeyStatus, isProviderEnabled } from "@/lib/providers/config";
import { getRegistry } from "@/lib/providers/registry";
import { initializeProviders } from "@/providers";
import { APP_VERSION } from "@/lib/nav";

export const dynamic = "force-dynamic";

/** App health: database + provider configuration (no secrets exposed). */
export async function GET() {
  try {
    initializeProviders();
    const registry = getRegistry();
    const providers = registry.listDescriptors().map((descriptor) => ({
      id: descriptor.id,
      name: descriptor.name,
      kind: descriptor.kind,
      configured: getKeyStatus(descriptor).configured,
      enabled: isProviderEnabled(descriptor.id),
      adapterImplemented: descriptor.adapterImplemented,
      plannedIn: descriptor.plannedIn,
    }));

    return ok({
      version: APP_VERSION,
      mode: "demo",
      database: getDbStatus(),
      providers,
      liveMarketData: registry.hasLiveMarketData,
      liveNews: registry.hasLiveNews,
      asOf: new Date().toISOString(),
    });
  } catch (err) {
    return routeError(err);
  }
}
