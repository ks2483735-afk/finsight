/**
 * MOCK daily market brief content — demo copy for the Overview dashboard.
 * Real AI-generated briefs arrive in v0.4.
 */

export const MOCK_DAILY_BRIEF = {
  headline: "Demo brief: risk appetite steady, chip strength offsets auto weakness",
  bullets: [
    "Demo: Broad benchmarks are mildly green; rate volatility eased after the policy hold.",
    "Demo: Semiconductors lead on reaffirmed cloud capex, while auto names lag on delivery numbers.",
    "Demo: In India, financials outperform after policy hold; IT is steady with currency support.",
  ],
  editorNote:
    "Authored demo brief rendered from mock data. AI summarization and live source links arrive in v0.4.",
  stocksInFocus: ["NVDA", "TSLA", "RELIANCE", "HDFCBANK", "META"],
  whatToWatch: [
    { time: "09:30 ET", label: "US equity open", detail: "Futures point to a modestly higher start." },
    { time: "14:00 IST", label: "Policy minutes", detail: "Central bank minutes released (demo)." },
    { time: "After close", label: "Earnings flow", detail: "Two large caps report after the close (demo)." },
  ],
};
