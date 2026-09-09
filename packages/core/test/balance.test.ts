import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { netBalances, pairwiseBalances } from '../src/balance';
import type { ExpenseRecord, SettlementRecord } from '../src/types';
import { money } from '../src/money';

const INR = 'INR' as const;
const m = (minor: number) => money(minor, INR);

/** A three-way dinner: alice pays 3000, split evenly between all three. */
const dinner: ExpenseRecord = {
  id: 'e1',
  total: m(3000),
  payers: [{ userId: 'alice', amount: m(3000) }],
  shares: [
    { userId: 'alice', amount: m(1000) },
    { userId: 'bob', amount: m(1000) },
    { userId: 'carol', amount: m(1000) },
  ],
};

const netOf = (
  expenses: readonly ExpenseRecord[],
  settlements: readonly SettlementRecord[] = [],
) => Object.fromEntries([...netBalances(expenses, settlements, INR)].map(([k, v]) => [k, v.minor]));

const edgesOf = (
  expenses: readonly ExpenseRecord[],
  settlements: readonly SettlementRecord[] = [],
) =>
  Object.fromEntries([...pairwiseBalances(expenses, settlements, INR)].map(([k, v]) => [k, v.minor]));

describe('netBalances', () => {
  it('credits the payer and debits each participant', () => {
    expect(netOf([dinner])).toEqual({ alice: 2000, bob: -1000, carol: -1000 });
  });

  it('always sums to exactly zero (invariant 2)', () => {
    const total = Object.values(netOf([dinner])).reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });

  it('applies settlements: paying down a debt moves both positions', () => {
    const settle: SettlementRecord = { id: 's1', from: 'bob', to: 'alice', amount: m(1000) };
    expect(netOf([dinner], [settle])).toEqual({ alice: 1000, bob: 0, carol: -1000 });
  });

  it('handles multi-payer expenses', () => {
    const shared: ExpenseRecord = {
      id: 'e2',
      total: m(4000),
      payers: [
        { userId: 'alice', amount: m(2500) },
        { userId: 'bob', amount: m(1500) },
      ],
      shares: [
        { userId: 'alice', amount: m(2000) },
        { userId: 'bob', amount: m(2000) },
      ],
    };
    expect(netOf([shared])).toEqual({ alice: 500, bob: -500 });
  });

  it('is empty for no activity', () => {
    expect(netOf([])).toEqual({});
  });
});

describe('pairwiseBalances', () => {
  it('records who owes whom, not just net position', () => {
    expect(edgesOf([dinner])).toEqual({ 'bob:alice': 1000, 'carol:alice': 1000 });
  });

  it('never creates a self-edge for a payer who also participated', () => {
    const edges = edgesOf([dinner]);
    expect(Object.keys(edges).some((k) => k.split(':')[0] === k.split(':')[1])).toBe(false);
  });

  it('nets opposing debts between the same pair into one edge', () => {
    const back: ExpenseRecord = {
      id: 'e3',
      total: m(600),
      payers: [{ userId: 'bob', amount: m(600) }],
      shares: [
        { userId: 'alice', amount: m(300) },
        { userId: 'bob', amount: m(300) },
      ],
    };
    // bob owes alice 1000 from dinner, alice owes bob 300 here -> one 700 edge.
    expect(edgesOf([dinner, back])['bob:alice']).toBe(700);
    expect(edgesOf([dinner, back])['alice:bob']).toBeUndefined();
  });

  it('apportions a share across multiple payers pro-rata', () => {
    const shared: ExpenseRecord = {
      id: 'e4',
      total: m(1000),
      payers: [
        { userId: 'alice', amount: m(750) },
        { userId: 'bob', amount: m(250) },
      ],
      shares: [
        { userId: 'carol', amount: m(1000) },
      ],
    };
    // carol owes 1000, apportioned 75/25 across the two payers.
    expect(edgesOf([shared])).toEqual({ 'carol:alice': 750, 'carol:bob': 250 });
  });

  it('drops edges that settle to zero', () => {
    const settle: SettlementRecord = { id: 's2', from: 'bob', to: 'alice', amount: m(1000) };
    expect(edgesOf([dinner], [settle])['bob:alice']).toBeUndefined();
  });

  it('agrees with netBalances on every participant', () => {
    const edges = edgesOf([dinner]);
    const derived: Record<string, number> = {};
    for (const [key, amount] of Object.entries(edges)) {
      const [debtor, creditor] = key.split(':') as [string, string];
      derived[debtor] = (derived[debtor] ?? 0) - amount;
      derived[creditor] = (derived[creditor] ?? 0) + amount;
    }
    expect(derived).toEqual(netOf([dinner]));
  });
});

describe('property: balance conservation (§4.5)', () => {
  it('sum(netBalances) === 0 for any set of expenses and settlements', () => {
    const userIds = ['a', 'b', 'c', 'd', 'e'];

    const expenseArb = fc
      .record({
        payerIdx: fc.integer({ min: 0, max: 4 }),
        total: fc.integer({ min: 1, max: 1_000_000 }),
        participantCount: fc.integer({ min: 1, max: 5 }),
      })
      .map(({ payerIdx, total, participantCount }, ): ExpenseRecord => {
        const participants = userIds.slice(0, participantCount);
        const base = Math.floor(total / participants.length);
        const shares = participants.map((userId, i) => ({
          userId,
          amount: m(i === 0 ? total - base * (participants.length - 1) : base),
        }));
        return {
          id: `e${payerIdx}${total}`,
          total: m(total),
          payers: [{ userId: userIds[payerIdx]!, amount: m(total) }],
          shares,
        };
      });

    const settlementArb = fc
      .record({
        fromIdx: fc.integer({ min: 0, max: 4 }),
        toIdx: fc.integer({ min: 0, max: 4 }),
        amount: fc.integer({ min: 1, max: 500_000 }),
      })
      .map(({ fromIdx, toIdx, amount }): SettlementRecord => ({
        id: `s${fromIdx}${toIdx}${amount}`,
        from: userIds[fromIdx]!,
        to: userIds[(toIdx + (toIdx === fromIdx ? 1 : 0)) % 5]!,
        amount: m(amount),
      }));

    fc.assert(
      fc.property(
        fc.array(expenseArb, { maxLength: 12 }),
        fc.array(settlementArb, { maxLength: 8 }),
        (expenses, settlements) => {
          const net = netBalances(expenses, settlements, INR);
          const total = [...net.values()].reduce((a, v) => a + v.minor, 0);
          expect(total).toBe(0);
        },
      ),
      { numRuns: 400 },
    );
  });

  it('pairwise edges reconstruct net positions exactly', () => {
    const userIds = ['a', 'b', 'c', 'd'];
    const expenseArb = fc
      .record({
        payerIdx: fc.integer({ min: 0, max: 3 }),
        total: fc.integer({ min: 4, max: 500_000 }),
      })
      .map(({ payerIdx, total }): ExpenseRecord => {
        const base = Math.floor(total / 4);
        return {
          id: `e${payerIdx}${total}`,
          total: m(total),
          payers: [{ userId: userIds[payerIdx]!, amount: m(total) }],
          shares: userIds.map((userId, i) => ({
            userId,
            amount: m(i === 0 ? total - base * 3 : base),
          })),
        };
      });

    fc.assert(
      fc.property(fc.array(expenseArb, { minLength: 1, maxLength: 10 }), (expenses) => {
        const edges = pairwiseBalances(expenses, [], INR);
        const derived = new Map<string, number>();
        for (const [key, amount] of edges) {
          const [debtor, creditor] = key.split(':') as [string, string];
          derived.set(debtor, (derived.get(debtor) ?? 0) - amount.minor);
          derived.set(creditor, (derived.get(creditor) ?? 0) + amount.minor);
        }
        for (const [userId, value] of netBalances(expenses, [], INR)) {
          expect(derived.get(userId) ?? 0).toBe(value.minor);
        }
      }),
      { numRuns: 300 },
    );
  });
});
