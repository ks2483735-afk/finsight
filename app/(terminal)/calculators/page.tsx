"use client";

import { useMemo, useState } from "react";
import { Calculator, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/format";
import {
  cagr,
  compoundInterest,
  dividendYield,
  loanEmi,
  lumpsum,
  sip,
} from "@/lib/finance/calculators";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Field, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CalculatorId = "sip" | "lumpsum" | "cagr" | "compound" | "emi" | "dividend";

/** Discriminated result shapes so rendering narrows cleanly. */
type CalcResults =
  | {
      kind: "growth";
      invested: number;
      gains: number;
      total: number;
      schedule?: Array<{ year: number; invested: number; value: number }>;
    }
  | { kind: "rate"; value: number }
  | { kind: "loan"; emi: number; totalInterest: number; totalPayment: number };

const CALCULATORS: Array<{ id: CalculatorId; label: string; hint: string }> = [
  { id: "sip", label: "SIP", hint: "Monthly investing" },
  { id: "lumpsum", label: "Lumpsum", hint: "One-time investment" },
  { id: "cagr", label: "CAGR", hint: "Annualized growth" },
  { id: "compound", label: "Compound interest", hint: "Periodic compounding" },
  { id: "emi", label: "Loan / EMI", hint: "Monthly installment" },
  { id: "dividend", label: "Dividend yield", hint: "Income on price" },
];

function ResultRow({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span
        className={cn(
          "tnum text-sm font-semibold",
          tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export default function CalculatorsPage() {
  const [active, setActive] = useState<CalculatorId>("sip");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const symbol = currency === "INR" ? "₹" : "$";
  const money = (value: number) => `${symbol}${formatNumber(value, 0)}`;

  // inputs (strings for free-form typing)
  const [sipMonthly, setSipMonthly] = useState("10000");
  const [sipRate, setSipRate] = useState("12");
  const [sipYears, setSipYears] = useState("10");

  const [lumpAmount, setLumpAmount] = useState("500000");
  const [lumpRate, setLumpRate] = useState("12");
  const [lumpYears, setLumpYears] = useState("10");

  const [cagrStart, setCagrStart] = useState("100000");
  const [cagrEnd, setCagrEnd] = useState("180000");
  const [cagrYears, setCagrYears] = useState("5");

  const [ciPrincipal, setCiPrincipal] = useState("100000");
  const [ciRate, setCiRate] = useState("8");
  const [ciYears, setCiYears] = useState("5");
  const [ciFreq, setCiFreq] = useState("4");

  const [loanPrincipal, setLoanPrincipal] = useState("2500000");
  const [loanRate, setLoanRate] = useState("9");
  const [loanYears, setLoanYears] = useState("20");

  const [divDividend, setDivDividend] = useState("12");
  const [divPrice, setDivPrice] = useState("300");

  const n = (v: string) => {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const results = useMemo((): CalcResults | null => {
    switch (active) {
      case "sip": {
        const r = sip(n(sipMonthly), n(sipRate), Math.max(1, n(sipYears)));
        return { kind: "growth", ...r };
      }
      case "lumpsum": {
        const r = lumpsum(n(lumpAmount), n(lumpRate), n(lumpYears));
        return { kind: "growth", ...r };
      }
      case "cagr":
        return { kind: "rate", value: cagr(n(cagrStart), n(cagrEnd), Math.max(0.1, n(cagrYears))) };
      case "compound": {
        const r = compoundInterest(n(ciPrincipal), n(ciRate), n(ciYears), Math.max(1, n(ciFreq)));
        return { kind: "growth", ...r };
      }
      case "emi":
        return { kind: "loan", ...loanEmi(n(loanPrincipal), n(loanRate), Math.max(1, n(loanYears))) };
      case "dividend":
        return { kind: "rate", value: dividendYield(n(divDividend), n(divPrice)) };
      default:
        return null;
    }
  }, [
    active,
    sipMonthly, sipRate, sipYears,
    lumpAmount, lumpRate, lumpYears,
    cagrStart, cagrEnd, cagrYears,
    ciPrincipal, ciRate, ciYears, ciFreq,
    loanPrincipal, loanRate, loanYears,
    divDividend, divPrice,
  ]);

  return (
    <div>
      <PageHeader
        title="Calculators"
        description="Deterministic financial math — SIP, CAGR, EMI and more. Every number comes from plain arithmetic, never model output."
        actions={
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
            className="w-28"
            aria-label="Display currency"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </Select>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-4">
        {/* ------------------------------------------------ calculator list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5 text-muted" aria-hidden />
              Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {CALCULATORS.map((calc) => (
              <button
                key={calc.id}
                type="button"
                onClick={() => setActive(calc.id)}
                className={cn(
                  "flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors",
                  active === calc.id
                    ? "bg-elevated"
                    : "hover:bg-elevated/60",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    active === calc.id ? "text-foreground" : "text-secondary",
                  )}
                >
                  {calc.label}
                </span>
                <span className="text-2xs text-faint">{calc.hint}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------ calculator */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{CALCULATORS.find((c) => c.id === active)?.label}</CardTitle>
              <Badge variant="accent">
                <Sigma className="h-3 w-3" aria-hidden />
                deterministic
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* inputs */}
                <div className="space-y-4">
                  {active === "sip" && (
                    <>
                      <NumberField label={`Monthly investment (${symbol})`} value={sipMonthly} onChange={setSipMonthly} />
                      <NumberField label="Expected return (% p.a.)" value={sipRate} onChange={setSipRate} />
                      <NumberField label="Time period (years)" value={sipYears} onChange={setSipYears} />
                    </>
                  )}
                  {active === "lumpsum" && (
                    <>
                      <NumberField label={`Investment amount (${symbol})`} value={lumpAmount} onChange={setLumpAmount} />
                      <NumberField label="Expected return (% p.a.)" value={lumpRate} onChange={setLumpRate} />
                      <NumberField label="Time period (years)" value={lumpYears} onChange={setLumpYears} />
                    </>
                  )}
                  {active === "cagr" && (
                    <>
                      <NumberField label={`Start value (${symbol})`} value={cagrStart} onChange={setCagrStart} />
                      <NumberField label={`End value (${symbol})`} value={cagrEnd} onChange={setCagrEnd} />
                      <NumberField label="Years" value={cagrYears} onChange={setCagrYears} />
                    </>
                  )}
                  {active === "compound" && (
                    <>
                      <NumberField label={`Principal (${symbol})`} value={ciPrincipal} onChange={setCiPrincipal} />
                      <NumberField label="Annual rate (%)" value={ciRate} onChange={setCiRate} />
                      <NumberField label="Years" value={ciYears} onChange={setCiYears} />
                      <Field label="Compounding">
                        <Select value={ciFreq} onChange={(e) => setCiFreq(e.target.value)}>
                          <option value="1">Annually</option>
                          <option value="2">Semi-annually</option>
                          <option value="4">Quarterly</option>
                          <option value="12">Monthly</option>
                        </Select>
                      </Field>
                    </>
                  )}
                  {active === "emi" && (
                    <>
                      <NumberField label={`Loan amount (${symbol})`} value={loanPrincipal} onChange={setLoanPrincipal} />
                      <NumberField label="Interest rate (% p.a.)" value={loanRate} onChange={setLoanRate} />
                      <NumberField label="Tenure (years)" value={loanYears} onChange={setLoanYears} />
                    </>
                  )}
                  {active === "dividend" && (
                    <>
                      <NumberField label={`Annual dividend per share (${symbol})`} value={divDividend} onChange={setDivDividend} />
                      <NumberField label={`Share price (${symbol})`} value={divPrice} onChange={setDivPrice} />
                    </>
                  )}
                </div>

                {/* results */}
                <div className="rounded-lg border border-border bg-background p-4">
                  {active === "sip" && results?.kind === "growth" && (
                    <>
                      <ResultRow label="Total invested" value={money(results.invested)} />
                      <ResultRow label="Estimated gains" value={money(results.gains)} tone="positive" />
                      <ResultRow label="Future value" value={money(results.total)} />
                      <div className="mt-4 max-h-48 overflow-y-auto">
                        <table className="w-full text-2xs">
                          <thead>
                            <tr className="text-left text-faint">
                              <th className="pb-1.5 font-medium">Year</th>
                              <th className="pb-1.5 text-right font-medium">Invested</th>
                              <th className="pb-1.5 text-right font-medium">Value</th>
                            </tr>
                          </thead>
                          <tbody className="tnum">
                            {(results.schedule ?? []).map((row) => (
                              <tr key={row.year} className="border-t border-border/60">
                                <td className="py-1.5 text-muted">{row.year}</td>
                                <td className="py-1.5 text-right text-secondary">{money(row.invested)}</td>
                                <td className="py-1.5 text-right text-foreground">{money(row.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {active === "lumpsum" && results?.kind === "growth" && (
                    <>
                      <ResultRow label="Initial investment" value={money(results.invested)} />
                      <ResultRow label="Wealth gained" value={money(results.gains)} tone="positive" />
                      <ResultRow label="Final value" value={money(results.total)} />
                    </>
                  )}

                  {active === "cagr" && results?.kind === "rate" && (
                    <>
                      <ResultRow label="CAGR" value={formatPercent(results.value)} tone={results.value >= 0 ? "positive" : "negative"} />
                      <p className="mt-3 text-2xs leading-relaxed text-faint">
                        CAGR smooths volatility into a single annual rate — it does not reflect
                        the path taken between start and end.
                      </p>
                    </>
                  )}

                  {active === "compound" && results?.kind === "growth" && (
                    <>
                      <ResultRow label="Principal" value={money(results.invested)} />
                      <ResultRow label="Interest earned" value={money(results.gains)} tone="positive" />
                      <ResultRow label="Maturity value" value={money(results.total)} />
                    </>
                  )}

                  {active === "emi" && results?.kind === "loan" && (
                    <>
                      <ResultRow label="Monthly EMI" value={money(results.emi)} />
                      <ResultRow label="Total interest" value={money(results.totalInterest)} tone="negative" />
                      <ResultRow label="Total payment" value={money(results.totalPayment)} />
                    </>
                  )}

                  {active === "dividend" && results?.kind === "rate" && (
                    <>
                      <ResultRow label="Dividend yield" value={formatPercent(results.value)} tone="positive" />
                      <p className="mt-3 text-2xs leading-relaxed text-faint">
                        Yield = annual dividend per share ÷ share price.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-5 border-t border-border pt-3 text-2xs text-faint">
                Rates and returns are assumptions you enter — FinSight never suggests them.
                Results are illustrative and not investment advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
