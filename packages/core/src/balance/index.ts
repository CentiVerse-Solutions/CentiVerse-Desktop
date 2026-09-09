import type { CurrencyCode } from '../currency';
import { type Money, money } from '../money';
import type { ExpenseRecord, SettlementRecord, UserId } from '../types';
import { allocateByWeight } from '../split/allocate';

export { simplifyDebts, type Transfer } from './simplify';

/**
 * §4.4 -- balances are DERIVED, never authored. `balance_cache` in the schema is
 * a cache; these two functions are the truth, and the nightly reconciliation job
 * asserts they agree.
 *
 * Sign convention: a positive balance means the user is OWED money.
 */

/**
 * Each member's single net position. What the summary cards show.
 *
 * For every expense: each payer is credited what they paid, each participant is
 * debited their share. A settlement moves the payer toward zero and the payee
 * away from it. Both operations are sign-symmetric, so the values always sum to
 * exactly zero (invariant 2).
 */
export const netBalances = (
  expenses: readonly ExpenseRecord[],
  settlements: readonly SettlementRecord[],
  currency: CurrencyCode,
): Map<UserId, Money> => {
  const net = new Map<UserId, number>();
  const bump = (userId: UserId, minor: number) => net.set(userId, (net.get(userId) ?? 0) + minor);

  for (const expense of expenses) {
    for (const payer of expense.payers) bump(payer.userId, payer.amount.minor);
    for (const share of expense.shares) bump(share.userId, -share.amount.minor);
  }

  for (const s of settlements) {
    bump(s.from, s.amount.minor);
    bump(s.to, -s.amount.minor);
  }

  return new Map([...net].map(([userId, minor]) => [userId, money(minor, currency)]));
};

/**
 * Who owes whom, edge by edge. This is the truth users argue about, and the
 * reason `simplifyDebts` output must never be written back as a settlement.
 *
 * Edges run participant -> payer. When an expense has several payers, each
 * participant's share is apportioned across them pro-rata to what each paid,
 * using the same largest-remainder allocator as everything else so no minor
 * unit is lost.
 *
 * Keys are `debtor:creditor` and amounts are always positive; opposing debts
 * between the same pair are netted into a single edge, and edges that come to
 * zero are omitted. (UserIds are UUIDs and so never contain a colon.)
 */
export const pairwiseBalances = (
  expenses: readonly ExpenseRecord[],
  settlements: readonly SettlementRecord[],
  currency: CurrencyCode,
): Map<string, Money> => {
  // Canonical key `${lo}:${hi}`; a positive value means `lo` owes `hi`.
  const pairs = new Map<string, number>();

  const owe = (debtor: UserId, creditor: UserId, minor: number) => {
    if (debtor === creditor || minor === 0) return;
    const [lo, hi] = debtor < creditor ? [debtor, creditor] : [creditor, debtor];
    const signed = debtor === lo ? minor : -minor;
    pairs.set(`${lo}:${hi}`, (pairs.get(`${lo}:${hi}`) ?? 0) + signed);
  };

  for (const expense of expenses) {
    const paidBy = expense.payers;
    for (const share of expense.shares) {
      if (share.amount.minor === 0) continue;

      if (paidBy.length === 1) {
        owe(share.userId, paidBy[0]!.userId, share.amount.minor);
        continue;
      }

      const apportioned = allocateByWeight(
        share.amount,
        paidBy.map((p) => ({ userId: p.userId, weight: p.amount.minor })),
      );
      for (const part of apportioned) owe(share.userId, part.userId, part.amount.minor);
    }
  }

  for (const s of settlements) owe(s.to, s.from, s.amount.minor);

  const out = new Map<string, Money>();
  for (const [key, value] of pairs) {
    if (value === 0) continue;
    const [lo, hi] = key.split(':') as [UserId, UserId];
    const [debtor, creditor] = value > 0 ? [lo, hi] : [hi, lo];
    out.set(`${debtor}:${creditor}`, money(Math.abs(value), currency));
  }
  return out;
};
