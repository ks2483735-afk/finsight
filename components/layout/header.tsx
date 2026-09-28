"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Search, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { fetchJson } from "@/lib/hooks/use-async-data";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileMenuButton, LogoMark } from "@/components/layout/sidebar";
import { MockBadge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

interface StatusPayload {
  database: { ok: boolean };
  providers: Array<{ configured: boolean }>;
}

/** Sticky top header: context, global search, demo + system status. */
export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [status, setStatus] = useState<StatusPayload | null>(null);

  // Lazy status fetch on mount — cheap local route, refreshed never (per session).
  useEffect(() => {
    fetchJson<StatusPayload>("/api/status")
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const current = NAV_GROUPS.flatMap((g) => g.items).find(
    (item) => pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href)),
  );
  const CurrentIcon = current?.icon;
  const configuredKeys =
    status?.providers.filter((p) => p.configured).length ?? 0;
  const dbOk = status?.database.ok ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileMenuButton />

        {/* Mobile branding */}
        <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="FinSight home">
          <LogoMark size={22} />
          <span className="text-sm font-semibold tracking-tight text-foreground">FinSight</span>
        </Link>

        {/* Desktop context */}
        {CurrentIcon && (
          <div className="hidden items-center gap-2 lg:flex">
            <CurrentIcon className="h-4 w-4 text-muted" aria-hidden />
            <span className="text-sm font-medium text-foreground">{current?.label}</span>
          </div>
        )}

        {/* Global search (md+) */}
        <GlobalSearch className="mx-auto hidden w-full max-w-xl md:block" />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <MockBadge className="hidden sm:inline-flex" />

          <Tooltip label={
            dbOk === null
              ? "Checking local status…"
              : dbOk
                ? `Local SQLite ready · ${configuredKeys} provider key${configuredKeys === 1 ? "" : "s"} configured`
                : "Local database unavailable"
          }>
            <Link
              href="/settings"
              aria-label="System status"
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground",
                dbOk === false && "border-negative/40 text-negative",
              )}
            >
              <Database className="h-3.5 w-3.5" aria-hidden />
              <span className="tnum hidden sm:inline">
                {configuredKeys > 0 ? `${configuredKeys} keys` : "local"}
              </span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  dbOk === null ? "bg-muted" : dbOk ? "bg-positive" : "bg-negative",
                )}
                aria-hidden
              />
            </Link>
          </Tooltip>

          <Link
            href="/settings"
            aria-label="Settings"
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground sm:flex"
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Link>

          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground md:hidden"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div data-finsight-modal className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <LogoMark size={22} />
            <GlobalSearch
              autoFocus
              className="flex-1"
              onNavigate={() => setSearchOpen(false)}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="rounded p-1.5 text-muted hover:bg-elevated hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="px-4 py-3 text-2xs text-faint">
            Press Enter to run research on your question.
          </div>
        </div>
      )}
    </header>
  );
}
