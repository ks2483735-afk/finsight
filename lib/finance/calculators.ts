/**
 * Deterministic financial calculators (spec §19).
 * All arithmetic is plain code — AI never performs math in FinSight.
 */

const yearsOf = (months: number) => months / 12;

export interface GrowthResult {
  invested: number;
  gains: number;
  total: number;
}

/** Systematic investment plan — monthly contribution, compounding monthly. */
export function sip(
  monthly: number,
  annualRatePct: number,
  years: number,
): GrowthResult & { schedule: Array<{ year: number; invested: number; value: number }> } {
  const r = annualRatePct / 100 / 12;
  const months = Math.round(years * 12);
  const future =
    r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);

  const schedule: Array<{ year: number; invested: number; value: number }> = [];
  for (let y = 1; y <= Math.min(years, 40); y++) {
    const m = y * 12;
    const value = r === 0 ? monthly * m : monthly * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
    schedule.push({ year: y, invested: monthly * m, value });
  }

  const invested = monthly * months;
  return { invested, gains: future - invested, total: future, schedule };
}

/** Lump-sum investment compounded at the given annual rate. */
export function lumpsum(
  principal: number,
  annualRatePct: number,
  years: number,
): GrowthResult {
  const r = annualRatePct / 100;
  const total = principal * Math.pow(1 + r, years);
  return { invested: principal, gains: total - principal, total };
}

/** CAGR as a percentage. */
export function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/** Compound interest with n compounding periods per year. */
export function compoundInterest(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear: number,
): GrowthResult {
  const r = annualRatePct / 100;
  const n = compoundsPerYear;
  const total = principal * Math.pow(1 + r / n, n * years);
  return { invested: principal, gains: total - principal, total };
}

export interface LoanResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
}

/** Loan EMI (equal monthly installment). */
export function loanEmi(
  principal: number,
  annualRatePct: number,
  years: number,
): LoanResult {
  const n = Math.round(years * 12);
  if (n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 };
  const r = annualRatePct / 100 / 12;
  const emi =
    r === 0
      ? principal / n
      : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  return { emi, totalPayment, totalInterest: totalPayment - principal };
}

/** Dividend yield as a percentage. */
export function dividendYield(annualDividendPerShare: number, price: number): number {
  if (price <= 0) return 0;
  return (annualDividendPerShare / price) * 100;
}

/** Absolute and percentage return on an invested amount. */
export function simpleReturn(
  invested: number,
  current: number,
): { value: number; pl: number; plPct: number } {
  return { value: current, pl: current - invested, plPct: invested > 0 ? ((current - invested) / invested) * 100 : 0 };
}
