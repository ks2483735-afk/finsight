import type { ProviderDescriptor } from "@/lib/providers/types";

/**
 * Public RSS / no-key sources — the zero-key path of spec §24.
 * No API key required; adapter is enabled as a zero-key fallback in v0.2.
 */
export const rssDescriptor: ProviderDescriptor = {
  id: "rss-public",
  name: "Public RSS feeds",
  kind: "news",
  envVar: "",
  docsUrl: "https://www.rssboard.org/rss-specification",
  keyUrl: "",
  adapterImplemented: true,
  plannedIn: "v0.2",
  description:
    "Zero-key public feeds and exchange announcements. No API key needed.",
};
