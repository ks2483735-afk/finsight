import { NextRequest, NextResponse } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const PRIVATE_API_PREFIXES = [
  "/api/alerts",
  "/api/portfolio",
  "/api/settings",
  "/api/watchlist",
];

/**
 * FinSight is local-first and does not yet have per-user authentication or
 * per-user database isolation. Do not expose personal-data APIs on a public
 * production host until that architecture exists.
 *
 * Local development and local production builds remain fully functional.
 * Public hosts can still serve the read-only market/news/research demo APIs.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const hostname = request.nextUrl.hostname.toLowerCase();
  if (LOCAL_HOSTS.has(hostname)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isPrivateApi = PRIVATE_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isPrivateApi) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      error:
        "Personal data APIs are disabled on public deployments until FinSight supports authenticated, per-user storage. Run FinSight locally to use watchlists, portfolios, alerts, and provider settings.",
      code: "PUBLIC_DEPLOYMENT_PERSONAL_DATA_DISABLED",
    },
    {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
