import type { ProviderDescriptor } from "@/lib/providers/types";

/** BazaarLink — descriptor only. The real adapter ships in v0.3. */
export const bazaarlinkDescriptor: ProviderDescriptor = {
  id: "bazaarlink",
  name: "BazaarLink",
  kind: "ai",
  envVar: "BAZAARLINK_API_KEY",
  docsUrl: "https://bazaarlink.ai/en/docs",
  keyUrl: "https://bazaarlink.ai/free",
  adapterImplemented: false,
  plannedIn: "v0.3",
  description:
    "OpenAI-compatible gateway to hundreds of models (incl. a free tier).",
};
