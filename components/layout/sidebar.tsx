"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { useShell } from "@/components/layout/shell";
import { Tooltip } from "@/components/ui/tooltip";

/** FinSight monogram mark, reused in sidebar and header. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded bg-accent font-semibold text-accent-foreground"
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      aria-hidden
    >
      F
    </span>
  );
}

interface NavListProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavList({ collapsed, onNavigate }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4" aria-label="Main">
      {NAV_GROUPS.map((group) => (
        <div key={group.group}>
          {!collapsed && (
            <div className="mb-1.5 px-2.5 text-2xs font-medium uppercase tracking-wider text-faint">
              {group.group}
            </div>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(item.href));
              const Icon = item.icon;
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md text-sm transition-colors duration-150",
                    collapsed ? "justify-center px-0" : "px-2.5",
                    active
                      ? "bg-elevated font-medium text-foreground"
                      : "text-secondary hover:bg-elevated/70 hover:text-foreground",
                  )}
                >
                  {active && (
                    <span
                      className="absolute -left-2.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-accent"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted")}
                    aria-hidden
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip label={item.label} side="top" className="flex w-full">
                      <span className="w-full">{link}</span>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BrandBlock({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn(
      "flex h-14 shrink-0 items-center gap-2.5 border-b border-border",
      collapsed ? "justify-center px-0" : "px-4",
    )}>
      <Link href="/" className="flex items-center gap-2.5" aria-label="FinSight home">
        <LogoMark />
        {!collapsed && (
          <span className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              FinSight
            </span>
            <span className="text-2xs font-medium text-faint">v0.1</span>
          </span>
        )}
      </Link>
    </div>
  );
}

/** Persistent left navigation: expanded/collapsed desktop + mobile drawer. */
export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useShell();

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <BrandBlock collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-10 shrink-0 items-center gap-2.5 border-t border-border text-xs text-muted transition-colors hover:bg-elevated hover:text-foreground",
            collapsed ? "justify-center" : "px-4",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fs-fade-in fixed inset-0 z-40 cursor-default bg-black/65 backdrop-blur-[1px]"
          />
          <aside className="fs-fade-in fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  FinSight
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded p-1.5 text-muted hover:bg-elevated hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

/** Hamburger button rendered in the header (mobile only). */
export function MobileMenuButton() {
  const { setMobileOpen } = useShell();
  return (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Open navigation"
      className="rounded-md p-1.5 text-muted transition-colors hover:bg-elevated hover:text-foreground lg:hidden"
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  );
}
