import { isCurrencyCode, money, type Money } from '@centiverse/core';

/**
 * The BigInt boundary (ADR 0004).
 *
 * §6.2 stores money as Postgres `bigint`, and Prisma maps that to JavaScript
 * `BigInt`. `BigInt` does not JSON-serialise and does not satisfy `MoneySchema`,
 * which requires `minor` to be a safe integer `number` (invariant 3).
 *
 * These two functions are the only place that conversion happens. Above this
 * line everything is `Money`; below it everything is `bigint`. Nothing in a
 * service or a route should ever see the other side.
 */

/**
 * `Number.MAX_SAFE_INTEGER` minor units is about 90 trillion rupees. A value
 * past it means either a corrupted row or an attack, and silently rounding it
 * — which is what `Number(bigint)` does — is the one outcome we cannot accept.
 */
export const fromMinor = (minor: bigint, currency: string): Money => {
  if (minor > BigInt(Number.MAX_SAFE_INTEGER) || minor < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(
      `money out of safe integer range: ${minor.toString()} ${currency} cannot be represented exactly`,
    );
  }
  // A currency column that is not a currency means the row is corrupt. Casting
  // past it would push the failure into formatting code much further away.
  if (!isCurrencyCode(currency)) {
    throw new RangeError(`unknown currency code in database row: "${currency}"`);
  }
  return money(Number(minor), currency);
};

export const toMinorBigInt = (value: Money): bigint => BigInt(value.minor);
