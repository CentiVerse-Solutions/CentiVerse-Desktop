import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { apportionAncillary } from '../src/split/itemize';
import type { Itemization } from '../src/split/itemize';
import { money } from '../src/money';
import { isErr, unwrap } from '../src/result';

const INR = 'INR' as const;
const m = (minor: number) => money(minor, INR);

const item = (id: string, amount: number, claimedBy: string[]) => ({
  id,
  label: id,
  amount: m(amount),
  claimedBy,
});

const base = (over: Partial<Itemization> = {}): Itemization => ({
  items: [item('biryani', 30000, ['alice']), item('naan', 10000, ['bob'])],
  printedTotal: m(40000),
  unclaimedPolicy: 'BLOCK',
  ...over,
});

const sharesOf = (it: Itemization) => {
  const r = apportionAncillary(it);
  return Object.fromEntries(unwrap(r).map((s) => [s.userId, s.amount.minor]));
};

describe('apportionAncillary -- items', () => {
  it('assigns each item to whoever claimed it', () => {
    expect(sharesOf(base())).toEqual({ alice: 30000, bob: 10000 });
  });

  it('splits a shared item evenly, using the largest-remainder allocator', () => {
    const it = base({
      items: [item('platter', 10000, ['alice', 'bob', 'carol'])],
      printedTotal: m(10000),
    });
    const shares = sharesOf(it);
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(10000);
    expect(Object.values(shares).sort()).toEqual([3333, 3333, 3334]);
  });
});

describe('apportionAncillary -- tax, service, tip, discount', () => {
  it('apportions tax pro-rata by claimed subtotal', () => {
    const it = base({ tax: m(4000), printedTotal: m(44000) });
    // alice claimed 75% of the food, so she carries 75% of the tax.
    expect(sharesOf(it)).toEqual({ alice: 33000, bob: 11000 });
  });

  it('apportions service charge and tip too', () => {
    const it = base({
      tax: m(2000),
      serviceCharge: m(1000),
      tip: m(1000),
      printedTotal: m(44000),
    });
    const shares = sharesOf(it);
    expect(shares['alice']! + shares['bob']!).toBe(44000);
  });

  it('applies a negative discount and still reconciles', () => {
    const it = base({ discount: m(-4000), printedTotal: m(36000) });
    expect(sharesOf(it)).toEqual({ alice: 27000, bob: 9000 });
  });
});

describe('apportionAncillary -- reconciliation is mandatory (§4.2.1)', () => {
  it('rejects an itemization that does not match the printed total', () => {
    const r = apportionAncillary(base({ printedTotal: m(41000) }));
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('RECONCILIATION_FAILED');
  });

  it('tolerates a one-minor-unit rounding difference', () => {
    const r = apportionAncillary(base({ printedTotal: m(40001) }));
    expect(r.ok).toBe(true);
  });

  it('rejects a two-minor-unit difference', () => {
    expect(isErr(apportionAncillary(base({ printedTotal: m(40002) })))).toBe(true);
  });

  it('rejects a mixed-currency itemization', () => {
    const r = apportionAncillary(
      base({ items: [{ id: 'x', label: 'x', amount: money(100, 'USD'), claimedBy: ['a'] }] }),
    );
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });

  it('rejects an empty itemization', () => {
    expect(isErr(apportionAncillary(base({ items: [], printedTotal: m(0) })))).toBe(true);
  });
});

describe('apportionAncillary -- unclaimed items', () => {
  const withUnclaimed = (policy: Itemization['unclaimedPolicy']) =>
    base({
      items: [item('biryani', 30000, ['alice']), item('mystery', 10000, [])],
      unclaimedPolicy: policy,
      payerId: 'bob',
    });

  it('BLOCK refuses to compute while anything is unclaimed', () => {
    const r = apportionAncillary(withUnclaimed('BLOCK'));
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('UNCLAIMED_ITEMS');
  });

  it('SPLIT_EQUALLY shares the unclaimed item across everyone who claimed anything', () => {
    const it = withUnclaimed('SPLIT_EQUALLY');
    const shares = sharesOf({ ...it, items: [...it.items, item('chai', 2000, ['bob'])], printedTotal: m(42000) });
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(42000);
    // the 10000 unclaimed splits evenly between alice and bob
    expect(shares['alice']).toBe(35000);
    expect(shares['bob']).toBe(7000);
  });

  it('ASSIGN_TO_PAYER puts the unclaimed items on the payer', () => {
    const shares = sharesOf(withUnclaimed('ASSIGN_TO_PAYER'));
    expect(shares['alice']).toBe(30000);
    expect(shares['bob']).toBe(10000);
  });

  it('ASSIGN_TO_PAYER needs a payer to assign to', () => {
    const it = withUnclaimed('ASSIGN_TO_PAYER');
    const r = apportionAncillary({ ...it, payerId: undefined });
    expect(isErr(r)).toBe(true);
  });
});

describe('property: itemized shares always sum to the printed total', () => {
  it('holds across arbitrary item sets and ancillary amounts', () => {
    const claimantArb = fc.subarray(['a', 'b', 'c', 'd'], { minLength: 1 });

    fc.assert(
      fc.property(
        fc.array(
          fc.record({ amount: fc.integer({ min: 1, max: 500_000 }), claimedBy: claimantArb }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 50_000 }),
        (rawItems, tax, tip) => {
          const items = rawItems.map((r, i) => item(`i${i}`, r.amount, r.claimedBy));
          const subtotal = rawItems.reduce((a, r) => a + r.amount, 0);
          const it: Itemization = {
            items,
            tax: m(tax),
            tip: m(tip),
            printedTotal: m(subtotal + tax + tip),
            unclaimedPolicy: 'BLOCK',
          };
          const shares = unwrap(apportionAncillary(it));
          const total = shares.reduce((a, s) => a + s.amount.minor, 0);
          expect(total).toBe(subtotal + tax + tip);
        },
      ),
      { numRuns: 400 },
    );
  });
});
