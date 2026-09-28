/**
 * MOCK demo news stories — authored placeholder content for UI development.
 *
 * ⚠️ NOT real journalism. Headlines and summaries are fabricated demo data.
 * Source links point to publisher homepages, never invented article URLs.
 * Everything rendered from here is labeled "MOCK" and carries isMock = true.
 * Real RSS/API ingestion arrives with v0.4 (News Intelligence).
 */

import type { NewsStory } from "@/lib/news/types";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const MOCK_STORIES: NewsStory[] = [
  {
    id: "demo-001",
    headline:
      "Chip shares extend gains as cloud providers reaffirm AI capex plans",
    summary:
      "Demo summary: semiconductor names moved higher after two large cloud providers reiterated full-year infrastructure spending. Trend has persisted across three sessions.",
    category: "Technology",
    sources: [
      { name: "Reuters", url: "https://www.reuters.com" },
      { name: "Bloomberg", url: "https://www.bloomberg.com" },
      { name: "CNBC", url: "https://www.cnbc.com" },
    ],
    outletCount: 3,
    publishedAt: minutesAgo(42),
    symbols: ["NVDA", "MSFT", "AMZN"],
    isMock: true,
  },
  {
    id: "demo-002",
    headline: "Tesla slips after quarterly deliveries miss street estimates",
    summary:
      "Demo summary: the stock is the session's biggest decliner among large caps. Volume is running above the 20-day average while the broader market trades higher.",
    category: "US",
    sources: [
      { name: "Reuters", url: "https://www.reuters.com" },
      { name: "Bloomberg", url: "https://www.bloomberg.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(28),
    symbols: ["TSLA"],
    isMock: true,
  },
  {
    id: "demo-003",
    headline: "RBI holds policy rate, signals data-dependent path ahead",
    summary:
      "Demo summary: the committee kept the benchmark rate unchanged and said future decisions depend on inflation print and monsoon progression. Banking names reacted positively.",
    category: "India",
    sources: [
      { name: "Economic Times", url: "https://economictimes.indiatimes.com" },
      { name: "Business Standard", url: "https://www.business-standard.com" },
      { name: "Mint", url: "https://www.livemint.com" },
    ],
    outletCount: 3,
    publishedAt: minutesAgo(95),
    symbols: ["HDFCBANK", "ICICIBANK", "SBIN"],
    isMock: true,
  },
  {
    id: "demo-004",
    headline: "IT services steady as rupee softens against the dollar",
    summary:
      "Demo summary: exported IT services names inched up with currency tailwinds. Deal-win commentary remains the key monitorable into earnings.",
    category: "India",
    sources: [
      { name: "Economic Times", url: "https://economictimes.indiatimes.com" },
      { name: "Moneycontrol", url: "https://www.moneycontrol.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(140),
    symbols: ["TCS", "INFY"],
    isMock: true,
  },
  {
    id: "demo-005",
    headline: "US equities nudge higher as rate volatility cools",
    summary:
      "Demo summary: benchmarks are mildly green with rate-sensitive sectors leading. Breadth is positive but turnover is below the monthly average.",
    category: "Markets",
    sources: [
      { name: "Reuters", url: "https://www.reuters.com" },
      { name: "WSJ", url: "https://www.wsj.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(64),
    symbols: ["SPY", "QQQ"],
    isMock: true,
  },
  {
    id: "demo-006",
    headline: "Supplier checks point to steady premium phone demand",
    summary:
      "Demo summary: supply-chain checks suggest stable order books for the quarter. Analysts see services revenue growth offsetting hardware seasonality.",
    category: "Technology",
    sources: [
      { name: "Bloomberg", url: "https://www.bloomberg.com" },
      { name: "The Information", url: "https://www.theinformation.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(180),
    symbols: ["AAPL"],
    isMock: true,
  },
  {
    id: "demo-007",
    headline: "Large banks rally as net interest income outlook improves",
    summary:
      "Demo summary: money-center banks led financials higher after commentary pointed to a stable NII trajectory. Credit metrics remained broadly healthy.",
    category: "Earnings",
    sources: [
      { name: "CNBC", url: "https://www.cnbc.com" },
      { name: "Reuters", url: "https://www.reuters.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(210),
    symbols: ["JPM", "V"],
    isMock: true,
  },
  {
    id: "demo-008",
    headline: "Reliance gains as retail arm posts double-digit growth",
    summary:
      "Demo summary: the conglomerate outperformed after its retail subsidiary reported stronger same-store growth. Telecom ARPU trend stayed stable.",
    category: "India",
    sources: [
      { name: "Mint", url: "https://www.livemint.com" },
      { name: "Economic Times", url: "https://economictimes.indiatimes.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(120),
    symbols: ["RELIANCE"],
    isMock: true,
  },
  {
    id: "demo-009",
    headline: "Energy majors slip as crude retreats from monthly high",
    summary:
      "Demo summary: integrated energy names underperformed as front-month crude gave back recent gains. Dividend yield remains the anchor for long-only flows.",
    category: "Markets",
    sources: [
      { name: "Reuters", url: "https://www.reuters.com" },
      { name: "OilPrice", url: "https://oilprice.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(155),
    symbols: ["XOM"],
    isMock: true,
  },
  {
    id: "demo-010",
    headline: "Microsoft to expand data-center capacity, capex set to rise",
    summary:
      "Demo summary: incremental data-center leases were disclosed in a filing. Analysts model capex staying elevated through the next two quarters.",
    category: "Technology",
    sources: [
      { name: "Bloomberg", url: "https://www.bloomberg.com" },
      { name: "CNBC", url: "https://www.cnbc.com" },
      { name: "Reuters", url: "https://www.reuters.com" },
    ],
    outletCount: 3,
    publishedAt: minutesAgo(75),
    symbols: ["MSFT"],
    isMock: true,
  },
  {
    id: "demo-011",
    headline: "HDFC Bank asset quality improves; slippages decline quarter-on-quarter",
    summary:
      "Demo summary: gross NPAs improved and management guided to stable credit costs. Loan growth tracked the system average.",
    category: "Earnings",
    sources: [
      { name: "Business Standard", url: "https://www.business-standard.com" },
      { name: "Moneycontrol", url: "https://www.moneycontrol.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(240),
    symbols: ["HDFCBANK"],
    isMock: true,
  },
  {
    id: "demo-012",
    headline: "Indian benchmarks log a third straight weekly gain",
    summary:
      "Demo summary: benchmarks closed the week higher supported by financials and auto. FII flows turned marginally positive over the week.",
    category: "India",
    sources: [
      { name: "Mint", url: "https://www.livemint.com" },
      { name: "Economic Times", url: "https://economictimes.indiatimes.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(320),
    symbols: ["NIFTYBEES"],
    isMock: true,
  },
  {
    id: "demo-013",
    headline: "Auto decline led by Tata Motors on volume expectations",
    summary:
      "Demo summary: the stock is the worst performer in its sector today after analysts trimmed near-term volume assumptions. Rural demand commentary is the next trigger.",
    category: "Markets",
    sources: [
      { name: "Moneycontrol", url: "https://www.moneycontrol.com" },
      { name: "Reuters", url: "https://www.reuters.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(52),
    symbols: ["TATAMOTORS"],
    isMock: true,
  },
  {
    id: "demo-014",
    headline: "Payments volume grows across cross-border travel corridors",
    summary:
      "Demo summary: cross-border processed volume continued to outpace domestic. Take-rate commentary was unchanged for the full year.",
    category: "Earnings",
    sources: [
      { name: "WSJ", url: "https://www.wsj.com" },
      { name: "Bloomberg", url: "https://www.bloomberg.com" },
    ],
    outletCount: 2,
    publishedAt: minutesAgo(300),
    symbols: ["V"],
    isMock: true,
  },
];

export function storiesForSymbols(symbols: string[]): NewsStory[] {
  const set = new Set(symbols.map((s) => s.toUpperCase()));
  return MOCK_STORIES.filter((s) => s.symbols.some((sym) => set.has(sym.toUpperCase())));
}
