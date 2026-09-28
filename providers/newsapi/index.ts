import type { ProviderDescriptor } from "@/lib/providers/types";

/** NewsAPI — descriptor only. The real adapter ships in v0.4. */
export const newsApiDescriptor: ProviderDescriptor = {
  id: "newsapi",
  name: "NewsAPI",
  kind: "news",
  envVar: "NEWSAPI_API_KEY",
  docsUrl: "https://newsapi.org/docs",
  keyUrl: "https://newsapi.org/register",
  adapterImplemented: false,
  plannedIn: "v0.4",
  description:
    "Headlines and article metadata across global outlets, with clustering.",
};
