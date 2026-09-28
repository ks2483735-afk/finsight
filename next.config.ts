import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the development UI clean by hiding the Next.js dev indicator.
  devIndicators: false,
  // FinSight is a local-first app: server route handlers talk to internal
  // services and provider adapters. No external runtime images are used.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
