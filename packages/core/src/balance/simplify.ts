import type { CurrencyCode } from '../currency';
import { type Money, money } from '../money';
import type { UserId } from '../types';
import { compareIds } from '../compare';

export interface Transfer {
  readonly from: UserId;
  readonly to: UserId;
  readonly amount: Money;
}

/**
 * §4.4 -- greedy min-cash-flow: repeatedly match the largest creditor with the
 * largest debtor. Reduces N^2 edges to at most N-1 transfers.
 *
 * DISPLAY ONLY (invariant 9). Recording one of these as a settlement destroys
 * the audit trail -- "why do I owe Vikram? I never ate with Vikram" is the
 * support ticket. When a user acts on a suggestion, record a real settlement
 * between the two actual parties instead.
 *
 * Ties are broken by userId ASC so the suggestion is stable across client,
 * server and recompute (invariant 4).
 */
export const simplifyDebts = (
  net: ReadonlyMap<UserId, Money>,
  currency: CurrencyCode,
): Transfer[] => {
  const debtors: Array<{ userId: UserId; minor: number }> = [];
  const creditors: Array<{ userId: UserId; minor: number }> = [];

  for (const [userId, amount] of net) {
    if (amount.minor < 0) debtors.push({ userId, minor: -amount.minor });
    else if (amount.minor > 0) creditors.push({ userId, minor: amount.minor });
  }

  const byAmountThenId = (
    a: { userId: UserId; minor: number },
    b: { userId: UserId; minor: number },
  ) => b.minor - a.minor || compareIds(a.userId, b.userId);

  debtors.sort(byAmountThenId);
  creditors.sort(byAmountThenId);

  const transfers: Transfer[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]!;
    const creditor = creditors[c]!;
    const amount = Math.min(debtor.minor, creditor.minor);

    if (amount > 0) {
      transfers.push({ from: debtor.userId, to: creditor.userId, amount: money(amount, currency) });
    }

    debtor.minor -= amount;
    creditor.minor -= amount;
    if (debtor.minor === 0) d += 1;
    if (creditor.minor === 0) c += 1;
  }

  return transfers;
};
