import { type Money, money } from '../money';
import { type SplitError, splitError } from '../errors';
import { type Result, ok, err } from '../result';
import type { Share, UserId } from '../types';
import { allocateByWeight, allocateEvenly } from './allocate';

/**
 * §4.2.1 -- a restaurant bill is never just line items. This is the domain half
 * of the receipt/claim flow; the scanning and claim UI come in Phase 8 and
 * depend on this being correct first.
 */
export interface Itemization {
  readonly items: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly amount: Money;
    readonly claimedBy: readonly UserId[];
  }>;
  readonly tax?: Money;
  readonly serviceCharge?: Money;
  readonly tip?: Money;
  /** Negative. */
  readonly discount?: Money;
  readonly printedTotal: Money;
  readonly unclaimedPolicy: 'SPLIT_EQUALLY' | 'ASSIGN_TO_PAYER' | 'BLOCK';
  /** Required when unclaimedPolicy is ASSIGN_TO_PAYER. */
  readonly payerId?: UserId | undefined;
}

/** An extracted receipt is never trusted: it must reconcile to what was printed. */
const RECONCILIATION_TOLERANCE_MINOR = 1;

const ancillaryTotal = (it: Itemization): number =>
  (it.tax?.minor ?? 0) +
  (it.serviceCharge?.minor ?? 0) +
  (it.tip?.minor ?? 0) +
  (it.discount?.minor ?? 0);

const currencyProblem = (it: Itemization): SplitError | undefined => {
  const expected = it.printedTotal.currency;
  const parts: Array<Money | undefined> = [it.tax, it.serviceCharge, it.tip, it.discount];
  for (const item of it.items) {
    if (item.amount.currency !== expected) {
      return splitError(
        'CURRENCY_MISMATCH',
        `item "${item.id}" is in ${item.amount.currency}, receipt is in ${expected}`,
      );
    }
  }
  for (const part of parts) {
    if (part !== undefined && part.currency !== expected) {
      return splitError('CURRENCY_MISMATCH', `an ancillary amount is in ${part.currency}, receipt is in ${expected}`);
    }
  }
  return undefined;
};

/**
 * Splits each item among its claimants, resolves unclaimed items by policy, then
 * apportions tax / service / tip / discount pro-rata by claimed subtotal.
 * Everything uses the §4.3 allocator, so the pieces sum exactly.
 */
export const apportionAncillary = (it: Itemization): Result<Share[], SplitError> => {
  if (it.items.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'an itemization needs at least one item'));
  }

  const mismatch = currencyProblem(it);
  if (mismatch !== undefined) return err(mismatch);

  const currency = it.printedTotal.currency;
  const claimed = it.items.filter((i) => i.claimedBy.length > 0);
  const unclaimed = it.items.filter((i) => i.claimedBy.length === 0);

  if (unclaimed.length > 0 && it.unclaimedPolicy === 'BLOCK') {
    return err(
      splitError('UNCLAIMED_ITEMS', `${unclaimed.length} item(s) are unclaimed and the policy is BLOCK`),
    );
  }
  if (claimed.length === 0) {
    return err(splitError('UNCLAIMED_ITEMS', 'no item has been claimed by anyone'));
  }

  const running = new Map<UserId, number>();
  const bump = (userId: UserId, minor: number) =>
    running.set(userId, (running.get(userId) ?? 0) + minor);

  // 1. Each claimed item splits evenly among its claimants, per item.
  for (const item of claimed) {
    for (const s of allocateEvenly(item.amount, item.claimedBy)) bump(s.userId, s.amount.minor);
  }

  // 2. Unclaimed items resolve by policy, before ancillary apportionment.
  if (unclaimed.length > 0) {
    const unclaimedTotal = unclaimed.reduce((a, i) => a + i.amount.minor, 0);

    if (it.unclaimedPolicy === 'ASSIGN_TO_PAYER') {
      if (it.payerId === undefined) {
        return err(
          splitError('UNCLAIMED_ITEMS', 'ASSIGN_TO_PAYER requires a payerId to assign them to'),
        );
      }
      bump(it.payerId, unclaimedTotal);
    } else {
      const everyone = [...running.keys()].sort();
      for (const s of allocateEvenly(money(unclaimedTotal, currency), everyone)) {
        bump(s.userId, s.amount.minor);
      }
    }
  }

  // 3. Tax, service, tip and discount apportion pro-rata by claimed subtotal.
  const subtotal = [...running.values()].reduce((a, b) => a + b, 0);
  const ancillary = ancillaryTotal(it);
  if (ancillary !== 0) {
    const weights = [...running.entries()].map(([userId, minor]) => ({ userId, weight: minor }));
    for (const s of allocateByWeight(money(ancillary, currency), weights)) {
      bump(s.userId, s.amount.minor);
    }
  }

  // 4. Reconcile against the printed total. Outside tolerance we reject: the
  //    user corrects the receipt rather than the ledger absorbing a bad scan.
  const computed = subtotal + ancillary;
  const drift = Math.abs(computed - it.printedTotal.minor);
  if (drift > RECONCILIATION_TOLERANCE_MINOR) {
    return err(
      splitError(
        'RECONCILIATION_FAILED',
        `items and extras come to ${computed} but the receipt shows ${it.printedTotal.minor}`,
      ),
    );
  }

  return ok(
    [...running.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([userId, minor]) => ({ userId, amount: money(minor, currency) })),
  );
};
