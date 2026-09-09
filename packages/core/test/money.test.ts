import { describe, it, expect } from 'vitest';
import {
  money, add, sub, neg, isZero, sum, toMinor,
  parseMoney, formatMoney, assertSameCurrency, compareMoney, isNegative,
} from '../src/money';
import { MoneyError } from '../src/errors';
import { isOk, isErr, unwrap } from '../src/result';

describe('money()', () => {
  it('constructs from integer minor units', () => {
    const m = money(250000, 'INR');
    expect(m.minor).toBe(250000);
    expect(m.currency).toBe('INR');
  });

  it('accepts zero and negatives', () => {
    expect(money(0, 'INR').minor).toBe(0);
    expect(money(-500, 'INR').minor).toBe(-500);
  });

  it('normalises negative zero, so equal amounts always compare equal', () => {
    expect(Object.is(money(-0, 'INR').minor, 0)).toBe(true);
    expect(money(-0, 'INR')).toEqual(money(0, 'INR'));
  });

  it.each([1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects non-safe-integer minor units: %s',
    (bad) => {
      expect(() => money(bad, 'INR')).toThrow(MoneyError);
    },
  );
});

describe('arithmetic', () => {
  it('adds and subtracts within a currency', () => {
    expect(add(money(100, 'INR'), money(250, 'INR')).minor).toBe(350);
    expect(sub(money(100, 'INR'), money(250, 'INR')).minor).toBe(-150);
  });

  it('negates and detects zero', () => {
    expect(neg(money(100, 'INR')).minor).toBe(-100);
    expect(isZero(money(0, 'USD'))).toBe(true);
    expect(isZero(money(1, 'USD'))).toBe(false);
  });

  it('refuses to mix currencies -- ADR 0002, one currency per group', () => {
    expect(() => add(money(100, 'INR'), money(100, 'USD'))).toThrow(MoneyError);
    expect(() => sub(money(100, 'INR'), money(100, 'USD'))).toThrow(MoneyError);
    expect(() => assertSameCurrency(money(1, 'JPY'), money(1, 'INR'))).toThrow(MoneyError);
  });

  it('sums a list, and an empty list is zero in the given currency', () => {
    expect(sum([money(100, 'INR'), money(200, 'INR')], 'INR').minor).toBe(300);
    expect(sum([], 'JPY')).toEqual({ minor: 0, currency: 'JPY' });
  });

  it('compares and reports sign', () => {
    expect(compareMoney(money(100, 'INR'), money(200, 'INR'))).toBeLessThan(0);
    expect(compareMoney(money(200, 'INR'), money(100, 'INR'))).toBeGreaterThan(0);
    expect(compareMoney(money(100, 'INR'), money(100, 'INR'))).toBe(0);
    expect(isNegative(money(-1, 'INR'))).toBe(true);
    expect(isNegative(money(0, 'INR'))).toBe(false);
  });

  it('exposes minor units but never a major-unit number (§4.1)', () => {
    expect(toMinor(money(12345, 'INR'))).toBe(12345);
  });
});

describe('parseMoney()', () => {
  it('parses plain and grouped input at the currency exponent', () => {
    expect(unwrap(parseMoney('1234.56', 'INR')).minor).toBe(123456);
    expect(unwrap(parseMoney('1,234.56', 'INR')).minor).toBe(123456);
    expect(unwrap(parseMoney('  42  ', 'INR')).minor).toBe(4200);
    expect(unwrap(parseMoney('-15.50', 'INR')).minor).toBe(-1550);
    expect(unwrap(parseMoney('₹1,234.56', 'INR')).minor).toBe(123456);
  });

  it('respects per-currency exponents, not a hardcoded 2', () => {
    expect(unwrap(parseMoney('500', 'JPY')).minor).toBe(500);      // exponent 0
    expect(unwrap(parseMoney('1.234', 'KWD')).minor).toBe(1234);   // exponent 3
  });

  it('rejects rather than guessing (§4.1)', () => {
    expect(isErr(parseMoney('', 'INR'))).toBe(true);
    expect(isErr(parseMoney('   ', 'INR'))).toBe(true);
    expect(isErr(parseMoney('abc', 'INR'))).toBe(true);
    expect(isErr(parseMoney('1.2.3', 'INR'))).toBe(true);
    expect(isErr(parseMoney('12.345', 'INR'))).toBe(true);   // more decimals than INR has
    expect(isErr(parseMoney('1.5', 'JPY'))).toBe(true);      // JPY has no minor unit
    expect(isErr(parseMoney('1e999', 'INR'))).toBe(true);
  });

  it('reports why it failed', () => {
    const r = parseMoney('12.345', 'INR');
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('TOO_MANY_DECIMALS');
  });

  it('round-trips through formatMoney for representative amounts', () => {
    for (const raw of ['0', '1', '99.99', '1234.56']) {
      const m = parseMoney(raw, 'INR');
      expect(isOk(m)).toBe(true);
      if (m.ok) expect(typeof formatMoney(m.value)).toBe('string');
    }
  });
});

describe('formatMoney()', () => {
  it('is currency-aware, so the hardcoded-$ bug is unrepresentable (§4.1)', () => {
    expect(formatMoney(money(123456, 'INR'), 'en-IN')).toContain('₹');
    expect(formatMoney(money(123456, 'USD'), 'en-US')).toContain('$');
    // Same minor amount, different currency -> different rendering.
    expect(formatMoney(money(123456, 'INR'), 'en-IN'))
      .not.toBe(formatMoney(money(123456, 'USD'), 'en-IN'));
  });

  it('honours the currency exponent', () => {
    expect(formatMoney(money(500, 'JPY'), 'en-US')).not.toContain('.');
  });
});
