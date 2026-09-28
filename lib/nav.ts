/**
 * Single source of truth for navigation. Sidebar, header, search, and
 * research "pages" results all read from this list.
 */

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  Calculator,
  Filter,
  LayoutGrid,
  LineChart,
  Newspaper,
  Search,
  Settings,
  Star,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short description used in search results. */
  hint: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: "Terminal",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutGrid, hint: "Dashboard, brief, movers" },
      { label: "Research", href: "/research", icon: Search, hint: "Ask a financial question" },
      { label: "Markets", href: "/markets", icon: LineChart, hint: "Indices, quotes, movers" },
      { label: "Companies", href: "/companies", icon: Building2, hint: "Directory & metrics" },
      { label: "News", href: "/news", icon: Newspaper, hint: "Clustered market stories" },
      { label: "Screener", href: "/screener", icon: Filter, hint: "Filter the universe" },
    ],
  },
  {
    group: "Personal",
    items: [
      { label: "Portfolio", href: "/portfolio", icon: Wallet, hint: "Holdings, P/L, allocation" },
      { label: "Watchlist", href: "/watchlist", icon: Star, hint: "Tracked symbols" },
      { label: "Alerts", href: "/alerts", icon: Bell, hint: "Local alert rules" },
      { label: "Calculators", href: "/calculators", icon: Calculator, hint: "SIP, CAGR, EMI, DCF" },
    ],
  },
  {
    group: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, hint: "Providers, keys, storage" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Demo mode badge shown wherever mock data is rendered. */
export const APP_VERSION = "0.1.0";
