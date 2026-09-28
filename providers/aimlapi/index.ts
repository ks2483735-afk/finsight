import type { ProviderDescriptor } from "@/lib/providers/types";

/** AIMLAPI — descriptor only. The real adapter ships in v0.3. */
export const aimlapiDescriptor: ProviderDescriptor = {
  id: "aimlapi",
  name: "AIMLAPI",
  kind: "ai",
  envVar: "AIMLAPI_API_KEY",
  docsUrl: "https://docs.aimlapi.com",
  keyUrl: "https://aimlapi.com",
  adapterImplemented: false,
  plannedIn: "v0.3",
  description:
    "OpenAI-compatible API gateway with access to a broad model catalog.",
};
