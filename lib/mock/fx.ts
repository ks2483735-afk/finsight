/**
 * Demo FX rate — used only to aggregate mixed-currency demo portfolios.
 * Clearly labeled in every response via FX_NOTE. Real FX arrives with a
 * live market-data provider (v0.2).
 */

export const DEMO_FX = { USDtoINR: 88.4 } as const;

export const FX_NOTE = `INR holdings converted at the demo rate 1 USD = ${DEMO_FX.USDtoINR} INR (mock).`;

export function toUsd(amount: number, currency: string): number {
  return currency === "INR" ? amount / DEMO_FX.USDtoINR : amount;
}
