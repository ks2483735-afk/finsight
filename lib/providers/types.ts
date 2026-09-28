/**
 * Provider abstraction contracts.
 *
 * The frontend NEVER talks to a provider directly. It talks to FinSight
 * services (lib/<domain>/service.ts), which resolve adapters through the registry
 * (lib/providers/registry.ts). Any provider can be swapped without touching
 * UI code.
 */

export type ProviderKind = "market-data" | "ai" | "news";

/** Where a provider's API key currently comes from. */
export type KeySource = "none" | "env" | "stored";

/**
 * Static description of a provider the user can configure (BYOK).
 * Descriptors are metadata only — no network calls, no fake adapters.
 */
export interface ProviderDescriptor {
  /** Stable id, e.g. "gemini". */
  id: string;
  /** Human-readable name. */
  name: string;
  kind: ProviderKind;
  /** Environment variable that can supply the key (see .env.example). */
  envVar: string;
  /** Provider documentation URL. */
  docsUrl: string;
  /** Where the user obtains an API key. */
  keyUrl: string;
  /**
   * Whether FinSight has implemented a real adapter for this provider yet.
   * false => Settings shows "adapter arrives in vX" and the AI/data router
   * will never claim a result came from it.
   */
  adapterImplemented: boolean;
  /** Version when the adapter ships (honest status copy for the UI). */
  plannedIn: string;
  /** Short UI hint. */
  description: string;
}

/** Runtime status of a provider as shown in Settings. */
export interface ProviderStatus extends ProviderDescriptor {
  configured: boolean;
  keySource: KeySource;
  enabled: boolean;
}

/** Common envelope every service returns so the UI can label data honestly. */
export interface DataSourceInfo {
  /** Provider id that produced the payload ("mock" for demo data). */
  providerId: string;
  label: string;
  isMock: boolean;
  /** True when live providers failed and we fell back to demo data. */
  degraded: boolean;
}
