/**
 * §4.1: "Minor-unit exponent is per currency (INR/USD = 2, JPY = 0, KWD = 3).
 *        Keep a small table; do not assume 2."
 */
export const CURRENCY_EXPONENTS = {
  INR: 2, USD: 2, EUR: 2, GBP: 2, AUD: 2, CAD: 2, SGD: 2, CHF: 2,
  AED: 2, THB: 2, MYR: 2, NZD: 2, ZAR: 2, HKD: 2, CNY: 2,
  JPY: 0, KRW: 0, VND: 0, IDR: 0,
  KWD: 3, BHD: 3, OMR: 3, TND: 3,
} as const;

export type CurrencyCode = keyof typeof CURRENCY_EXPONENTS;

export const isCurrencyCode = (v: string): v is CurrencyCode =>
  Object.prototype.hasOwnProperty.call(CURRENCY_EXPONENTS, v);

/** Number of decimal places this currency's minor unit represents. */
export const exponentOf = (currency: CurrencyCode): number => CURRENCY_EXPONENTS[currency];
