import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { allocateByWeight, allocateEvenly } from '../src/split/allocate';
import { money, sum } from '../src/money';

describe('allocateEvenly -- the ₹100/3 case from §4.3', () => {
  it('splits 10000 paise three ways with no paisa lost', () => {
    const shares = allocateEvenly(money(10000, 'INR'), ['a', 'b', 'c']);
    expect(shares.map((s) => s.amount.minor)).toEqual([3334, 3333, 3333]);
    expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(10000);
  });

  it('gives the extra unit by userId ASC when fractions tie (§4.3 step 4)', () => {
    // All three fractional parts are identical (1/3), so userId ASC decides.
    const shares = allocateEvenly(money(10000, 'INR'), ['charlie', 'alice', 'bob']);
    const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount.minor]));
    expect(byUser['alice']).toBe(3334);
    expect(byUser['bob']).toBe(3333);
    expect(byUser['charlie']).toBe(3333);
  });

  it('is order-independent: input order never changes anyone\'s share', () => {
    const a = allocateEvenly(money(10000, 'INR'), ['a', 'b', 'c']);
    const b = allocateEvenly(money(10000, 'INR'), ['c', 'b', 'a']);
    const norm = (xs: typeof a) =>
      [...xs].sort((x, y) => x.userId.localeCompare(y.userId)).map((s) => [s.userId, s.amount.minor]);
    expect(norm(a)).toEqual(norm(b));
  });

  it('handles one participant, and zero amounts', () => {
    expect(allocateEvenly(money(999, 'INR'), ['solo'])[0]!.amount.minor).toBe(999);
    expect(allocateEvenly(money(0, 'INR'), ['a', 'b']).map((s) => s.amount.minor)).toEqual([0, 0]);
  });

  it('handles negative totals without losing a unit (refunds)', () => {
    const shares = allocateEvenly(money(-10000, 'INR'), ['a', 'b', 'c']);
    expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(-10000);
  });
});

describe('allocateByWeight', () => {
  it('splits proportionally and absorbs the remainder', () => {
    const shares = allocateByWeight(money(10000, 'INR'), [
      { userId: 'a', weight: 1 },
      { userId: 'b', weight: 1 },
      { userId: 'c', weight: 2 },
    ]);
    const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount.minor]));
    expect(byUser['a']).toBe(2500);
    expect(byUser['b']).toBe(2500);
    expect(byUser['c']).toBe(5000);
    expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(10000);
  });

  it('gives remainder to the largest fractional part first', () => {
    // 100 paise over weights 1,1,1 -> 33.33 each, remainder 1
    const shares = allocateByWeight(money(100, 'INR'), [
      { userId: 'b', weight: 1 },
      { userId: 'a', weight: 1 },
      { userId: 'c', weight: 1 },
    ]);
    expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(100);
    const byUser = Object.fromEntries(shares.map((s) => [s.userId, s.amount.minor]));
    expect(byUser['a']).toBe(34); // tie on fraction -> lowest userId wins
  });

  it('treats total zero weight as an even split', () => {
    const shares = allocateByWeight(money(300, 'INR'), [
      { userId: 'a', weight: 0 },
      { userId: 'b', weight: 0 },
    ]);
    expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(300);
  });
});

describe('property: the allocator never loses or invents a minor unit (§4.3)', () => {
  it('sum(allocateEvenly) === total, for arbitrary totals and party sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000_000, max: 10_000_000 }),
        fc.array(fc.string({ minLength: 1, maxLength: 6 }), { minLength: 1, maxLength: 25 }),
        (total, rawIds) => {
          const ids = [...new Set(rawIds)];
          fc.pre(ids.length > 0);
          const shares = allocateEvenly(money(total, 'INR'), ids);
          expect(shares).toHaveLength(ids.length);
          expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(total);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('sum(allocateByWeight) === total, for arbitrary weights', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.array(fc.nat({ max: 1000 }), { minLength: 1, maxLength: 20 }),
        (total, weights) => {
          const parts = weights.map((weight, i) => ({ userId: `u${i}`, weight }));
          const shares = allocateByWeight(money(total, 'INR'), parts);
          expect(sum(shares.map((s) => s.amount), 'INR').minor).toBe(total);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('is deterministic: identical input gives byte-identical output (invariant 4)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 1, maxLength: 10 }),
        (total, rawIds) => {
          const ids = [...new Set(rawIds)];
          fc.pre(ids.length > 0);
          const a = allocateEvenly(money(total, 'INR'), ids);
          const b = allocateEvenly(money(total, 'INR'), ids);
          expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        },
      ),
      { numRuns: 300 },
    );
  });
});
