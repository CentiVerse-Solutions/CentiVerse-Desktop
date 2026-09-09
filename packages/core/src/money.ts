import { type CurrencyCode, exponentOf } from './currency';
import { MoneyError, type ParseError, type ParseErrorCode } from './errors';
import { type Result, ok, err } from './result';

/**
 * An amount in the currency's *minor units* (paise, cents). Always an integer.
 * §4.1: money is never a JavaScript number in a variable that crosses a
 * function boundary.
 */
export interface Money {
  readonly minor: number;
  readonly currency: CurrencyCode;
}

export const money = (minor: number, currency: CurrencyCode): Money => {
  if (!Number.isSafeInteger(minor)) {
    throw new MoneyError(`non-integer minor units: ${minor}`);
  }
  // Normalise negative zero. JS distinguishes -0 from 0 under Object.is and in
  // strict equality of test assertions; letting it into a Money makes otherwise
  // identical amounts compare unequal.
  return { minor: minor === 0 ? 0 : minor, currency };
};

export const assertSameCurrency = (a: Money, b: Money): void => {
  if (a.currency !== b.currency) {
    throw new MoneyError(`currency mismatch: ${a.currency} vs ${b.currency}`);
  }
};

export const add = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b);
  return money(a.minor + b.minor, a.currency);
};

export const sub = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b);
  return money(a.minor - b.minor, a.currency);
};

export const neg = (a: Money): Money => money(-a.minor, a.currency);
export const isZero = (a: Money): boolean => a.minor === 0;
export const isNegative = (a: Money): boolean => a.minor < 0;

export const sum = (xs: readonly Money[], currency: CurrencyCode): Money =>
  xs.reduce(add, money(0, currency));

/** Negative, zero or positive, like a comparator. Throws on mixed currency. */
export const compareMoney = (a: Money, b: Money): number => {
  assertSameCurrency(a, b);
  return a.minor - b.minor;
};

/**
 * The only accessor that returns a number, and it returns *minor* units.
 * §4.1: "Never expose a toNumber() that returns rupees."
 */
export const toMinor = (m: Money): number => m.minor;

const parseErr = (code: ParseErrorCode, message: string, input: string): Result<never, ParseError> =>
  err({ code, message, input });

/**
 * Parse user input ("1,234.56") into Money at the currency's exponent.
 * Rejects ambiguity rather than guessing (§4.1).
 */
export const parseMoney = (input: string, currency: CurrencyCode): Result<Money, ParseError> => {
  const raw = input.trim();
  if (raw === '') return parseErr('EMPTY', 'no amount given', input);

  // Remove whitespace and thousands separators, then strip a LEADING currency
  // symbol run only. Anything else left over must fail validation rather than
  // be silently discarded -- stripping every non-digit would turn "1e999" into
  // "1999" and quietly invent an amount (§4.1: reject, do not guess).
  const compact = raw.replace(/[\s,]/g, '');
  const cleaned = compact.replace(/^[^\d.\-]+/, '');

  if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
    return parseErr('NOT_A_NUMBER', `not a number: "${input}"`, input);
  }

  const dots = cleaned.split('.').length - 1;
  if (dots > 1) {
    return parseErr('AMBIGUOUS_SEPARATORS', `more than one decimal point: "${input}"`, input);
  }

  if (!/^-?\d*(?:\.\d*)?$/.test(cleaned)) {
    return parseErr('NOT_A_NUMBER', `not a number: "${input}"`, input);
  }

  const negative = cleaned.startsWith('-');
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [wholeDigits = '', frac = ''] = unsigned.split('.');

  const exponent = exponentOf(currency);
  if (frac.length > exponent) {
    return parseErr(
      'TOO_MANY_DECIMALS',
      `${currency} has ${exponent} decimal place(s), got ${frac.length}`,
      input,
    );
  }

  const padded = frac.padEnd(exponent, '0');
  const minorAbs = Number(`${wholeDigits === '' ? '0' : wholeDigits}${padded}`);

  if (!Number.isSafeInteger(minorAbs)) {
    return parseErr('NOT_FINITE', `amount out of safe range: "${input}"`, input);
  }

  return ok(money(negative ? -minorAbs : minorAbs, currency));
};

/**
 * The ONLY way a Money becomes a string (§4.1). Because it takes a Money and
 * not a number, an amount cannot be formatted without its currency -- which is
 * what makes the hardcoded-$ bug unrepresentable.
 */
export const formatMoney = (m: Money, locale?: string): string => {
  const exponent = exponentOf(m.currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(m.minor / 10 ** exponent);
};
