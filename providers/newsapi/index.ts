import type { ProviderDescriptor } from "@/lib/providers/types";

/** NewsAPI — implemented live headline adapter; requires a user-supplied key. */
export const newsApiDescriptor: ProviderDescriptor = {
  id: "newsapi",
  name: "NewsAPI",
  kind: "news",
  envVar: "NEWSAPI_API_KEY",
  docsUrl: "https://newsapi.org/docs",
  keyUrl: "https://newsapi.org/register",
  adapterImplemented: true,
  plannedIn: "v0.2",
  description:
    "Headlines and article metadata from the NewsAPI top-headlines endpoint.",
};
