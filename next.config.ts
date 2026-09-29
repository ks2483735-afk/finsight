import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // FinSight is a local-first app: server route handlers talk to internal
  // services and provider adapters. No external runtime images are used.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
