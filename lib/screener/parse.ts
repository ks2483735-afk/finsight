/**
 * Deterministic natural-language screener parser.
 *
 * No AI: this is plain pattern matching that turns phrases like
 *   "Find Indian companies with ROE > 20% and market cap > 50000 cr"
 * into structured filters. Client and server both import this module.
 */

export type NumericField =
  | "marketCap"
  | "pe"
  | "ps"
  | "pb"
  | "roe"
  | "revenueGrowth"
  | "epsGrowth"
  | "dividendYield"
  | "debtToEquity";

export type Criteria = Partial<Record<NumericField, { min?: number; max?: number }>>;

export interface ScreenerFilters {
  region: "ALL" | "US" | "IN";
  assetClass: "ALL" | "stock" | "etf";
  /** "ALL" or an exact sector name. */
  sector: string;
  /**
   * marketCap thresholds are in BILLIONS of the listing currency
   * ($B for US names, ₹B for Indian names); all other metrics are the
   * units shown in the UI (percent or ratio).
   */
  criteria: Criteria;
}

export const EMPTY_FILTERS: ScreenerFilters = {
  region: "ALL",
  assetClass: "stock",
  sector: "ALL",
  criteria: {},
};

export interface ParsedCondition {
  field: NumericField;
  label: string;
  op: ">" | ">=" | "<" | "<=" | "=";
  value: number;
  unit: string | null;
  raw: string;
}

export interface ParseResult {
  ok: boolean;
  filters: ScreenerFilters;
  conditions: ParsedCondition[];
  message: string;
}

const UNIT_FACTORS: Record<string, number> = {
  t: 1e12,
  trillion: 1e12,
  bn: 1e9,
  b: 1e9,
  billion: 1e9,
  cr: 1e7,
  crore: 1e7,
  mn: 1e6,
  m: 1e6,
  million: 1e6,
};

interface FieldMatcher {
  field: NumericField;
  label: string;
  re: RegExp;
}

const NUMBER = "([\\d,]+(?:\\.\\d+)?)";
const OPS = "(>=|<=|>|<|=)";

const FIELD_MATCHERS: FieldMatcher[] = [
  {
    field: "marketCap",
    label: "Market cap",
    re: new RegExp(
      `\\b(?:market\\s*cap|mkt\\.?\\s*cap|market\\s*capitali[sz]ation)\\s*${OPS}\\s*${NUMBER}\\s*(t|trillion|bn|b|billion|cr|crore|mn|m|million)?`,
      "g",
    ),
  },
  {
    field: "pe",
    label: "P/E",
    re: new RegExp(`\\b(?:p\\s*\\/\\s*e|pe\\s*\\bratio|price\\s*to\\s*earnings)\\s*${OPS}\\s*${NUMBER}`, "g"),
  },
  {
    field: "ps",
    label: "P/S",
    re: new RegExp(`\\b(?:p\\s*\\/\\s*s|ps\\s*\\bratio|price\\s*to\\s*sales)\\s*${OPS}\\s*${NUMBER}`, "g"),
  },
  {
    field: "pb",
    label: "P/B",
    re: new RegExp(`\\b(?:p\\s*\\/\\s*b|pb\\s*\\bratio|price\\s*to\\s*book)\\s*${OPS}\\s*${NUMBER}`, "g"),
  },
  {
    field: "roe",
    label: "ROE",
    re: new RegExp(`\\b(?:roe|return\\s*on\\s*equity)\\s*${OPS}\\s*${NUMBER}\\s*%?`, "g"),
  },
  {
    field: "revenueGrowth",
    label: "Revenue growth",
    re: new RegExp(`\\b(?:revenue\\s*growth|sales\\s*growth)\\s*${OPS}\\s*${NUMBER}\\s*%?`, "g"),
  },
  {
    field: "epsGrowth",
    label: "EPS growth",
    re: new RegExp(`\\b(?:eps\\s*growth|earnings\\s*growth)\\s*${OPS}\\s*${NUMBER}\\s*%?`, "g"),
  },
  {
    field: "dividendYield",
    label: "Dividend yield",
    re: new RegExp(`\\b(?:dividend\\s*yield|div\\s*yield|dividend)\\s*${OPS}\\s*${NUMBER}\\s*%?`, "g"),
  },
  {
    field: "debtToEquity",
    label: "Debt/Equity",
    re: new RegExp(`\\b(?:debt\\s*\\/\\s*equity|debt\\s*to\\s*equity|d\\s*\\/\\s*e)\\s*${OPS}\\s*${NUMBER}`, "g"),
  },
];

const SECTOR_HINTS: Array<[RegExp, string]> = [
  [/\b(banks?|banking|financials?|nbfc|finance)\b/, "Financial Services"],
  [/\b(it|tech|technology|software|semiconductors?|chips)\b/, "Technology"],
  [/\b(auto|autos|automobile|vehicles?)\b/, "Consumer Cyclical"],
  [/\b(oil|energy|gas|crude)\b/, "Energy"],
  [/\b(fmcg|consumer\s+staples|household)\b/, "Consumer Defensive"],
  [/\b(telecom|media|social)\b/, "Communication Services"],
];

function applyCondition(
  criteria: Criteria,
  field: NumericField,
  op: string,
  rawValue: string,
  unit: string | null,
): void {
  const numeric = Number(rawValue.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return;

  // marketCap is stored in billions of local currency.
  let value = numeric;
  if (field === "marketCap") {
    const factor = unit ? UNIT_FACTORS[unit.toLowerCase()] ?? 1e9 : 1e9;
    value = (numeric * factor) / 1e9;
  }

  const existing = criteria[field] ?? {};
  if (op === ">" || op === ">=") {
    existing.min = existing.min !== undefined ? Math.max(existing.min, value) : value;
  } else if (op === "<" || op === "<=") {
    existing.max = existing.max !== undefined ? Math.min(existing.max, value) : value;
  } else {
    existing.min = value;
    existing.max = value;
  }
  criteria[field] = existing;
}

/** Parse free text into structured screener filters. */
export function parseScreeningQuery(text: string): ParseResult {
  const lower = text.toLowerCase();
  const filters: ScreenerFilters = {
    ...EMPTY_FILTERS,
    criteria: {},
  };
  const conditions: ParsedCondition[] = [];

  for (const matcher of FIELD_MATCHERS) {
    matcher.re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = matcher.re.exec(text)) !== null) {
      const [, op, rawValue, unit] = match;
      conditions.push({
        field: matcher.field,
        label: matcher.label,
        op: op as ParsedCondition["op"],
        value: Number(rawValue.replace(/,/g, "")),
        unit: unit ?? null,
        raw: match[0].trim(),
      });
      applyCondition(filters.criteria, matcher.field, op, rawValue, unit ?? null);
      if (matcher.re.lastIndex === match.index) matcher.re.lastIndex++;
    }
  }

  if (/\b(india|indian|nse|bse|nifty|sensex)\b/.test(lower)) {
    filters.region = "IN";
  } else if (/\b(u\.?s\.?a?|united\s+states|american|nyse|nasdaq)\b/.test(lower)) {
    filters.region = "US";
  }

  if (/\b(etfs?)\b/.test(lower)) {
    filters.assetClass = "etf";
  }

  for (const [re, sector] of SECTOR_HINTS) {
    if (re.test(lower)) {
      filters.sector = sector;
      break;
    }
  }

  const parts: string[] = [];
  if (filters.region !== "ALL") parts.push(`region = ${filters.region}`);
  if (filters.sector !== "ALL") parts.push(`sector = ${filters.sector}`);
  if (filters.assetClass !== "stock") parts.push(`asset class = ${filters.assetClass}`);

  const ok = conditions.length > 0 || filters.region !== "ALL" || filters.sector !== "ALL";
  return {
    ok,
    filters,
    conditions,
    message: ok
      ? `Parsed ${conditions.length} condition${conditions.length === 1 ? "" : "s"}${
          parts.length ? ` · ${parts.join(" · ")}` : ""
        }.`
      : 'No filter conditions found. Try: "Find Indian companies with ROE > 20% and market cap > 50000 cr".',
  };
}
