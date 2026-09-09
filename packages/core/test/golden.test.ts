import { describe, it, expect } from 'vitest';
import { netBalances, pairwiseBalances, simplifyDebts } from '../src/balance';
import { money } from '../src/money';
import type { CurrencyCode } from '../src/currency';
import type { ExpenseRecord, SettlementRecord } from '../src/types';
import thailand from './fixtures/thailand-trip.json';
import roommates from './fixtures/roommates.json';

/**
 * §4.5 golden-file tests: realistic group histories with hand-verified expected
 * balances, committed as JSON. These catch regressions that property tests do
 * not -- a property test proves the total is conserved, a golden file proves the
 * numbers are the *right* ones.
 */

interface Fixture {
  name: string;
  currency: string;
  expenses: Array<{
    id: string;
    total: number;
    payers: Array<{ userId: string; amount: number }>;
    shares: Array<{ userId: string; amount: number }>;
  }>;
  settlements: Array<{ id: string; from: string; to: string; amount: number }>;
  expectedNet: Record<string, number>;
  expectedPairwise: Record<string, number>;
  expectedTransferCount: number;
}

const load = (f: Fixture) => {
  const currency = f.currency as CurrencyCode;
  const m = (minor: number) => money(minor, currency);

  const expenses: ExpenseRecord[] = f.expenses.map((e) => ({
    id: e.id,
    total: m(e.total),
    payers: e.payers.map((p) => ({ userId: p.userId, amount: m(p.amount) })),
    shares: e.shares.map((s) => ({ userId: s.userId, amount: m(s.amount) })),
  }));

  const settlements: SettlementRecord[] = f.settlements.map((s) => ({
    id: s.id,
    from: s.from,
    to: s.to,
    amount: m(s.amount),
  }));

  return { currency, expenses, settlements };
};

describe.each([thailand as Fixture, roommates as Fixture])('golden: $name', (fixture) => {
  const { currency, expenses, settlements } = load(fixture);

  it('every expense has payers and shares summing to its total (invariant 1)', () => {
    for (const e of fixture.expenses) {
      expect(e.payers.reduce((a, p) => a + p.amount, 0)).toBe(e.total);
      expect(e.shares.reduce((a, s) => a + s.amount, 0)).toBe(e.total);
    }
  });

  it('net balances match the hand-verified expectation', () => {
    const actual = Object.fromEntries(
      [...netBalances(expenses, settlements, currency)].map(([k, v]) => [k, v.minor]),
    );
    expect(actual).toEqual(fixture.expectedNet);
  });

  it('net balances sum to exactly zero (invariant 2)', () => {
    const total = Object.values(fixture.expectedNet).reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it('pairwise edges match the hand-verified expectation', () => {
    const actual = Object.fromEntries(
      [...pairwiseBalances(expenses, settlements, currency)].map(([k, v]) => [k, v.minor]),
    );
    expect(actual).toEqual(fixture.expectedPairwise);
  });

  it('simplifyDebts preserves every net position and stays under N-1', () => {
    const net = netBalances(expenses, settlements, currency);
    const transfers = simplifyDebts(net, currency);

    expect(transfers).toHaveLength(fixture.expectedTransferCount);
    expect(transfers.length).toBeLessThanOrEqual(Math.max(0, net.size - 1));

    const applied = new Map<string, number>();
    for (const t of transfers) {
      applied.set(t.from, (applied.get(t.from) ?? 0) + t.amount.minor);
      applied.set(t.to, (applied.get(t.to) ?? 0) - t.amount.minor);
    }
    for (const [userId, amount] of net) {
      const settled = (applied.get(userId) ?? 0) + amount.minor;
      expect(settled).toBe(0);
    }
  });
});
