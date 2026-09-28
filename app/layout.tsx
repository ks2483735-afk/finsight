import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FinSight — Open-source finance research terminal",
    template: "%s · FinSight",
  },
  description:
    "FinSight is a local-first, BYOK finance research terminal. Provider-independent market data, news, and AI research with your own API keys.",
  applicationName: "FinSight",
  keywords: [
    "finance",
    "research terminal",
    "stock market",
    "open source",
    "BYOK",
    "local-first",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
