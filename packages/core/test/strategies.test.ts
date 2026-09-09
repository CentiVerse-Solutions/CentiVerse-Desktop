import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeShares } from '../src/split';
import type { SplitInput } from '../src/split/strategies';
import { money } from '../src/money';
import { isOk, isErr, unwrap } from '../src/result';

const INR = 'INR' as const;
const payer = (userId: string, minor: number) => ({ userId, amount: money(minor, INR) });
const sharesOf = (input: SplitInput) => unwrap(computeShares(input));
const shareSum = (shares: ReadonlyArray<{ amount: { minor: number } }>) =>
  shares.reduce((a, s) => a + s.amount.minor, 0);

describe('EQUAL', () => {
  it('splits evenly and conserves the total', () => {
    const shares = sharesOf({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: { kind: 'EQUAL', participants: ['a', 'b', 'c'] },
    });
    expect(shareSum(shares)).toBe(10000);
    expect(shares.map((s) => s.amount.minor).sort()).toEqual([3333, 3333, 3334]);
  });

  it('handles a single participant', () => {
    const shares = sharesOf({
      total: money(555, INR),
      payers: [payer('a', 555)],
      strategy: { kind: 'EQUAL', participants: ['a'] },
    });
    expect(shares).toHaveLength(1);
    expect(shares[0]!.amount.minor).toBe(555);
  });

  it('rejects an empty participant list', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [payer('a', 100)],
      strategy: { kind: 'EQUAL', participants: [] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('NO_PARTICIPANTS');
  });

  it('rejects a duplicated participant', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [payer('a', 100)],
      strategy: { kind: 'EQUAL', participants: ['a', 'a'] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('DUPLICATE_PARTICIPANT');
  });
});

describe('EXACT', () => {
  it('uses the given amounts verbatim', () => {
    const shares = sharesOf({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: {
        kind: 'EXACT',
        shares: [
          { userId: 'a', amount: money(6000, INR) },
          { userId: 'b', amount: money(4000, INR) },
        ],
      },
    });
    expect(shareSum(shares)).toBe(10000);
  });

  it('rejects shares that do not sum to the total', () => {
    const r = computeShares({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: {
        kind: 'EXACT',
        shares: [
          { userId: 'a', amount: money(6000, INR) },
          { userId: 'b', amount: money(3999, INR) },
        ],
      },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('SHARES_DO_NOT_SUM');
  });

  it('rejects a share denominated in another currency', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [payer('a', 100)],
      strategy: { kind: 'EXACT', shares: [{ userId: 'a', amount: money(100, 'USD') }] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });
});

describe('PERCENT (integer basis points)', () => {
  it('handles the three-way 33.33% case without losing a paisa', () => {
    const shares = sharesOf({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: {
        kind: 'PERCENT',
        shares: [
          { userId: 'a', bps: 3333 },
          { userId: 'b', bps: 3333 },
          { userId: 'c', bps: 3334 },
        ],
      },
    });
    expect(shareSum(shares)).toBe(10000);
  });

  it('rejects bps not summing to 10000', () => {
    const r = computeShares({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: {
        kind: 'PERCENT',
        shares: [
          { userId: 'a', bps: 5000 },
          { userId: 'b', bps: 4000 },
        ],
      },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('BPS_DO_NOT_SUM');
  });
});

describe('SHARES (integer weights)', () => {
  it('splits in proportion to weights', () => {
    const shares = sharesOf({
      total: money(12000, INR),
      payers: [payer('a', 12000)],
      strategy: {
        kind: 'SHARES',
        shares: [
          { userId: 'a', weight: 1 },
          { userId: 'b', weight: 2 },
          { userId: 'c', weight: 3 },
        ],
      },
    });
    expect(shareSum(shares)).toBe(12000);
    const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount.minor]));
    expect(byUser['a']).toBe(2000);
    expect(byUser['b']).toBe(4000);
    expect(byUser['c']).toBe(6000);
  });

  it('rejects negative weights', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [payer('a', 100)],
      strategy: {
        kind: 'SHARES',
        shares: [
          { userId: 'a', weight: -1 },
          { userId: 'b', weight: 2 },
        ],
      },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('WEIGHTS_NOT_POSITIVE');
  });

  it('rejects an all-zero weight set', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [payer('a', 100)],
      strategy: { kind: 'SHARES', shares: [{ userId: 'a', weight: 0 }] },
    });
    expect(isErr(r)).toBe(true);
  });
});

describe('ADJUSTMENT', () => {
  it('applies deltas then splits the remainder evenly', () => {
    // b had a 20-rupee dessert nobody else shared:
    // 2000 comes off the top to b, the remaining 8000 splits two ways.
    const shares = sharesOf({
      total: money(10000, INR),
      payers: [payer('a', 10000)],
      strategy: {
        kind: 'ADJUSTMENT',
        participants: ['a', 'b'],
        adjustments: [{ userId: 'b', delta: money(2000, INR) }],
      },
    });
    const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount.minor]));
    expect(byUser['a']).toBe(4000);
    expect(byUser['b']).toBe(6000);
    expect(shareSum(shares)).toBe(10000);
  });

  it('is the only strategy permitted to yield a negative share', () => {
    const shares = sharesOf({
      total: money(1000, INR),
      payers: [payer('a', 1000)],
      strategy: {
        kind: 'ADJUSTMENT',
        participants: ['a', 'b'],
        adjustments: [{ userId: 'b', delta: money(-3000, INR) }],
      },
    });
    expect(shareSum(shares)).toBe(1000);
    expect(shares.some((s) => s.amount.minor < 0)).toBe(true);
  });

  it('rejects an adjustment for a non-participant', () => {
    const r = computeShares({
      total: money(1000, INR),
      payers: [payer('a', 1000)],
      strategy: {
        kind: 'ADJUSTMENT',
        participants: ['a'],
        adjustments: [{ userId: 'ghost', delta: money(100, INR) }],
      },
    });
    expect(isErr(r)).toBe(true);
  });
});

describe('payer validation', () => {
  it('rejects payers that do not sum to the total', () => {
    const r = computeShares({
      total: money(10000, INR),
      payers: [payer('a', 6000), payer('b', 3000)],
      strategy: { kind: 'EQUAL', participants: ['a', 'b'] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('PAYERS_DO_NOT_SUM');
  });

  it('accepts multi-payer when the amounts do sum', () => {
    const r = computeShares({
      total: money(10000, INR),
      payers: [payer('a', 6000), payer('b', 4000)],
      strategy: { kind: 'EQUAL', participants: ['a', 'b'] },
    });
    expect(isOk(r)).toBe(true);
  });

  it('rejects an empty payer list', () => {
    const r = computeShares({
      total: money(10000, INR),
      payers: [],
      strategy: { kind: 'EQUAL', participants: ['a'] },
    });
    expect(isErr(r)).toBe(true);
  });

  it('rejects a non-positive total', () => {
    const r = computeShares({
      total: money(0, INR),
      payers: [payer('a', 0)],
      strategy: { kind: 'EQUAL', participants: ['a'] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('TOTAL_NOT_POSITIVE');
  });

  it('rejects a payer denominated in another currency', () => {
    const r = computeShares({
      total: money(100, INR),
      payers: [{ userId: 'a', amount: money(100, 'USD') }],
      strategy: { kind: 'EQUAL', participants: ['a'] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });
});

describe('property: sum(shares) === total, for every strategy', () => {
  it('holds for EQUAL across arbitrary totals and party sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.integer({ min: 1, max: 30 }),
        (total, n) => {
          const participants = Array.from({ length: n }, (_, i) => `u${i}`);
          const shares = sharesOf({
            total: money(total, INR),
            payers: [payer('u0', total)],
            strategy: { kind: 'EQUAL', participants },
          });
          expect(shareSum(shares)).toBe(total);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('holds for SHARES across arbitrary positive weights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.array(fc.integer({ min: 1, max: 500 }), { minLength: 1, maxLength: 15 }),
        (total, weights) => {
          const shares = sharesOf({
            total: money(total, INR),
            payers: [payer('u0', total)],
            strategy: {
              kind: 'SHARES',
              shares: weights.map((weight, i) => ({ userId: `u${i}`, weight })),
            },
          });
          expect(shareSum(shares)).toBe(total);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('yields no negative share for EQUAL', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.integer({ min: 1, max: 20 }),
        (total, n) => {
          const participants = Array.from({ length: n }, (_, i) => `u${i}`);
          const shares = sharesOf({
            total: money(total, INR),
            payers: [payer('u0', total)],
            strategy: { kind: 'EQUAL', participants },
          });
          expect(shares.every((s) => s.amount.minor >= 0)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('is deterministic: same input, byte-identical output (invariant 4)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.integer({ min: 1, max: 15 }),
        (total, n) => {
          const participants = Array.from({ length: n }, (_, i) => `u${i}`);
          const input: SplitInput = {
            total: money(total, INR),
            payers: [payer('u0', total)],
            strategy: { kind: 'EQUAL', participants },
          };
          expect(JSON.stringify(computeShares(input))).toBe(JSON.stringify(computeShares(input)));
        },
      ),
      { numRuns: 300 },
    );
  });
});
