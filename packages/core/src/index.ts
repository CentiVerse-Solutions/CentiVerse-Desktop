/**
 * @centiverse/core -- the pure domain.
 *
 * Invariant 8: this package imports nothing. No React, no Prisma, no Node
 * built-ins. Everything here is a pure function over plain data, so the client,
 * the API and any recompute job produce byte-identical results (invariant 4).
 */

export { CURRENCY_EXPONENTS, type CurrencyCode, exponentOf, isCurrencyCode } from './currency';
export { MoneyError, type ParseError, type SplitError } from './errors';
export { type Result, ok, err, isOk, isErr, unwrap } from './result';

export {
  type Money,
  money,
  add,
  sub,
  neg,
  sum,
  isZero,
  isNegative,
  compareMoney,
  assertSameCurrency,
  toMinor,
  parseMoney,
  formatMoney,
} from './money';

export type { UserId, Share, Payer, ExpenseRecord, SettlementRecord } from './types';

export { computeShares, type SplitInput, type SplitStrategy } from './split';
export { allocateEvenly, allocateByWeight } from './split/allocate';
export { apportionAncillary, type Itemization } from './split/itemize';

export { netBalances, pairwiseBalances, simplifyDebts, type Transfer } from './balance';
