import type { ProviderDescriptor } from "@/lib/providers/types";

/** Google Gemini — descriptor only. The real adapter ships in v0.3. */
export const geminiDescriptor: ProviderDescriptor = {
  id: "gemini",
  name: "Google Gemini",
  kind: "ai",
  envVar: "GEMINI_API_KEY",
  docsUrl: "https://ai.google.dev/gemini-api/docs",
  keyUrl: "https://aistudio.google.com/apikey",
  adapterImplemented: false,
  plannedIn: "v0.3",
  description: "Google's Gemini models, reached through the FinSight AI Router.",
};
