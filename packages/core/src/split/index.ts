import { type Money, add, money, sum } from '../money';
import { type SplitError, splitError } from '../errors';
import { type Result, ok, err } from '../result';
import type { Payer, Share, UserId } from '../types';
import { allocateByWeight, allocateEvenly } from './allocate';
import type { SplitInput, SplitStrategy } from './strategies';

export type { SplitInput, SplitStrategy };

const BPS_TOTAL = 10_000;

const findDuplicate = (ids: readonly UserId[]): UserId | undefined => {
  const seen = new Set<UserId>();
  for (const id of ids) {
    if (seen.has(id)) return id;
    seen.add(id);
  }
  return undefined;
};

/** Payers must be non-empty, same-currency, and sum exactly to the total (§4.3). */
const validatePayers = (total: Money, payers: readonly Payer[]): SplitError | undefined => {
  if (payers.length === 0) {
    return splitError('PAYERS_DO_NOT_SUM', 'an expense needs at least one payer');
  }
  for (const p of payers) {
    if (p.amount.currency !== total.currency) {
      return splitError(
        'CURRENCY_MISMATCH',
        `payer ${p.userId} is in ${p.amount.currency}, expense is in ${total.currency}`,
      );
    }
  }
  const paid = payers.reduce((acc, p) => acc + p.amount.minor, 0);
  if (paid !== total.minor) {
    return splitError(
      'PAYERS_DO_NOT_SUM',
      `payers sum to ${paid} but the total is ${total.minor}`,
    );
  }
  return undefined;
};

const equalShares = (total: Money, participants: readonly UserId[]): Result<Share[], SplitError> => {
  if (participants.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'no participants to split between'));
  }
  const dup = findDuplicate(participants);
  if (dup !== undefined) {
    return err(splitError('DUPLICATE_PARTICIPANT', `participant "${dup}" appears more than once`));
  }
  return ok(allocateEvenly(total, participants));
};

const exactShares = (
  total: Money,
  entries: ReadonlyArray<{ userId: UserId; amount: Money }>,
): Result<Share[], SplitError> => {
  if (entries.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'no participants to split between'));
  }
  const dup = findDuplicate(entries.map((e) => e.userId));
  if (dup !== undefined) {
    return err(splitError('DUPLICATE_PARTICIPANT', `participant "${dup}" appears more than once`));
  }
  for (const e of entries) {
    if (e.amount.currency !== total.currency) {
      return err(
        splitError(
          'CURRENCY_MISMATCH',
          `share for ${e.userId} is in ${e.amount.currency}, expense is in ${total.currency}`,
        ),
      );
    }
  }
  const assigned = entries.reduce((acc, e) => acc + e.amount.minor, 0);
  if (assigned !== total.minor) {
    return err(
      splitError('SHARES_DO_NOT_SUM', `shares sum to ${assigned} but the total is ${total.minor}`),
    );
  }
  return ok(entries.map((e) => ({ userId: e.userId, amount: e.amount })));
};

const percentShares = (
  total: Money,
  entries: ReadonlyArray<{ userId: UserId; bps: number }>,
): Result<Share[], SplitError> => {
  if (entries.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'no participants to split between'));
  }
  const dup = findDuplicate(entries.map((e) => e.userId));
  if (dup !== undefined) {
    return err(splitError('DUPLICATE_PARTICIPANT', `participant "${dup}" appears more than once`));
  }
  for (const e of entries) {
    if (!Number.isInteger(e.bps) || e.bps < 0) {
      return err(
        splitError('BPS_DO_NOT_SUM', `basis points must be non-negative integers, got ${e.bps}`),
      );
    }
  }
  const totalBps = entries.reduce((acc, e) => acc + e.bps, 0);
  if (totalBps !== BPS_TOTAL) {
    return err(
      splitError('BPS_DO_NOT_SUM', `basis points sum to ${totalBps}, expected ${BPS_TOTAL}`),
    );
  }
  return ok(allocateByWeight(total, entries.map((e) => ({ userId: e.userId, weight: e.bps }))));
};

const weightedShares = (
  total: Money,
  entries: ReadonlyArray<{ userId: UserId; weight: number }>,
): Result<Share[], SplitError> => {
  if (entries.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'no participants to split between'));
  }
  const dup = findDuplicate(entries.map((e) => e.userId));
  if (dup !== undefined) {
    return err(splitError('DUPLICATE_PARTICIPANT', `participant "${dup}" appears more than once`));
  }
  for (const e of entries) {
    if (!Number.isInteger(e.weight) || e.weight < 0) {
      return err(
        splitError('WEIGHTS_NOT_POSITIVE', `weights must be non-negative integers, got ${e.weight}`),
      );
    }
  }
  const totalWeight = entries.reduce((acc, e) => acc + e.weight, 0);
  if (totalWeight === 0) {
    return err(splitError('WEIGHTS_NOT_POSITIVE', 'at least one weight must be greater than zero'));
  }
  return ok(allocateByWeight(total, entries));
};

/**
 * Deltas come off the top for the named participants; whatever is left splits
 * evenly across everyone. This is the only strategy that may produce a negative
 * share (§4.5) -- a large enough delta on one person credits the others.
 */
const adjustmentShares = (
  total: Money,
  participants: readonly UserId[],
  adjustments: ReadonlyArray<{ userId: UserId; delta: Money }>,
): Result<Share[], SplitError> => {
  if (participants.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'no participants to split between'));
  }
  const dup = findDuplicate(participants);
  if (dup !== undefined) {
    return err(splitError('DUPLICATE_PARTICIPANT', `participant "${dup}" appears more than once`));
  }
  const members = new Set(participants);
  for (const a of adjustments) {
    if (!members.has(a.userId)) {
      return err(
        splitError('NO_PARTICIPANTS', `adjustment for "${a.userId}", who is not a participant`),
      );
    }
    if (a.delta.currency !== total.currency) {
      return err(
        splitError(
          'CURRENCY_MISMATCH',
          `adjustment for ${a.userId} is in ${a.delta.currency}, expense is in ${total.currency}`,
        ),
      );
    }
  }

  const deltaTotal = adjustments.reduce((acc, a) => acc + a.delta.minor, 0);
  const base = allocateEvenly(money(total.minor - deltaTotal, total.currency), participants);
  const deltaBy = new Map(adjustments.map((a) => [a.userId, a.delta.minor]));

  return ok(
    base.map((s) => ({
      userId: s.userId,
      amount: money(s.amount.minor + (deltaBy.get(s.userId) ?? 0), total.currency),
    })),
  );
};

/** Each item splits evenly among its claimants, per item, then sums (§4.2.1). */
const itemizedShares = (
  total: Money,
  items: ReadonlyArray<{ amount: Money; participants: readonly UserId[] }>,
  tax: Money | undefined,
  tip: Money | undefined,
): Result<Share[], SplitError> => {
  if (items.length === 0) {
    return err(splitError('NO_PARTICIPANTS', 'an itemized split needs at least one item'));
  }

  const running = new Map<UserId, number>();
  const bump = (userId: UserId, minor: number) =>
    running.set(userId, (running.get(userId) ?? 0) + minor);

  for (const item of items) {
    if (item.participants.length === 0) {
      return err(splitError('UNCLAIMED_ITEMS', 'every item must be claimed by someone'));
    }
    if (item.amount.currency !== total.currency) {
      return err(
        splitError(
          'CURRENCY_MISMATCH',
          `an item is in ${item.amount.currency}, expense is in ${total.currency}`,
        ),
      );
    }
    for (const s of allocateEvenly(item.amount, item.participants)) bump(s.userId, s.amount.minor);
  }

  // Tax and tip are apportioned pro-rata by claimed subtotal (§4.2.1).
  const claimedSubtotal = [...running.values()].reduce((a, b) => a + b, 0);
  const ancillary = (tax?.minor ?? 0) + (tip?.minor ?? 0);
  if (ancillary !== 0) {
    const weights = [...running.entries()].map(([userId, minor]) => ({ userId, weight: minor }));
    for (const s of allocateByWeight(money(ancillary, total.currency), weights)) {
      bump(s.userId, s.amount.minor);
    }
  }

  const shares = [...running.entries()].map(([userId, minor]) => ({
    userId,
    amount: money(minor, total.currency),
  }));

  const assigned = claimedSubtotal + ancillary;
  if (assigned !== total.minor) {
    return err(
      splitError(
        'RECONCILIATION_FAILED',
        `items plus tax and tip come to ${assigned} but the total is ${total.minor}`,
      ),
    );
  }
  return ok(shares);
};

const dispatch = (input: SplitInput): Result<Share[], SplitError> => {
  const { total, strategy } = input;
  switch (strategy.kind) {
    case 'EQUAL':
      return equalShares(total, strategy.participants);
    case 'EXACT':
      return exactShares(total, strategy.shares);
    case 'PERCENT':
      return percentShares(total, strategy.shares);
    case 'SHARES':
      return weightedShares(total, strategy.shares);
    case 'ADJUSTMENT':
      return adjustmentShares(total, strategy.participants, strategy.adjustments);
    case 'ITEMIZED':
      return itemizedShares(total, strategy.items, strategy.tax, strategy.tip);
  }
};

/**
 * The single entry point for turning an expense into per-person shares.
 * Non-negotiable 2: nothing else in the system computes a share.
 */
export const computeShares = (input: SplitInput): Result<Share[], SplitError> => {
  const { total, payers } = input;

  if (total.minor <= 0) {
    return err(splitError('TOTAL_NOT_POSITIVE', `expense total must be positive, got ${total.minor}`));
  }

  const payerProblem = validatePayers(total, payers);
  if (payerProblem !== undefined) return err(payerProblem);

  const result = dispatch(input);
  if (!result.ok) return result;

  // §4.3: assert the invariant here as well as in tests and in the database.
  const assigned = result.value.reduce((acc, s) => acc + s.amount.minor, 0);
  if (assigned !== total.minor) {
    return err(
      splitError(
        'SHARES_DO_NOT_SUM',
        `shares sum to ${assigned} but the total is ${total.minor}`,
      ),
    );
  }

  return result;
};

export { allocateByWeight, allocateEvenly, add, money, sum };
