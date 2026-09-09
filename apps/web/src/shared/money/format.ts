import { formatMoney, money, type CurrencyCode } from '@centiverse/core';

/**
 * §4.1 -- the app's single bridge to formatMoney.
 *
 * The old code had four different formatters: Dashboard and Activity hardcoded
 * "$", GroupCard hardcoded USD via Intl, and only GroupDetails read
 * group.currency. Because formatMoney takes a Money and not a number, that class
 * of bug is now unrepresentable -- an amount cannot be rendered without saying
 * what currency it is in.
 *
 * Mock amounts are still major-unit floats. This converts at the edge; the
 * Phase 3 seam replaces it by carrying Money end to end.
 */
export const formatAmount = (
  majorUnits: number,
  currency: CurrencyCode = 'INR',
  locale = 'en-IN',
): string => {
  const minor = Math.round((majorUnits ?? 0) * 100);
  return formatMoney(money(minor, currency), locale);
};

/** Absolute value, for "you owe X" phrasing where the sign is carried by words. */
export const formatAbsAmount = (
  majorUnits: number,
  currency: CurrencyCode = 'INR',
  locale = 'en-IN',
): string => formatAmount(Math.abs(majorUnits ?? 0), currency, locale);
