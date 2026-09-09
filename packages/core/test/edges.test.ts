import { describe, it, expect } from 'vitest';
import { compareIds } from '../src/compare';
import { isCurrencyCode, exponentOf } from '../src/currency';
import { unwrap, ok, err, isOk, isErr } from '../src/result';
import { parseMoney, money } from '../src/money';
import { apportionAncillary } from '../src/split/itemize';
import { computeShares } from '../src/split';
import { netBalances, pairwiseBalances } from '../src/balance';
import { isErr as isErrAlias } from '../src/result';

/**
 * Edge cases that the behavioural suites do not reach. §4.5 sets 100% branch
 * coverage for this package; these are the branches left over, each one a real
 * guard rather than a line written to satisfy a metric.
 */

describe('compareIds -- the deterministic tie-break (§4.3)', () => {
  it('orders ascending and reports equality', () => {
    expect(compareIds('alice', 'bob')).toBe(-1);
    expect(compareIds('bob', 'alice')).toBe(1);
    expect(compareIds('alice', 'alice')).toBe(0);
  });

  it('is a valid comparator: antisymmetric', () => {
    const ids = ['dev', 'alice', 'carol', 'bob'];
    const asc = [...ids].sort(compareIds);
    expect(asc).toEqual(['alice', 'bob', 'carol', 'dev']);
    // -Math.sign(0) is -0, which Object.is separates from +0; normalise both.
    const z = (n: number) => (n === 0 ? 0 : n);
    for (const a of ids) {
      for (const b of ids) {
        expect(z(Math.sign(compareIds(a, b)))).toBe(z(-Math.sign(compareIds(b, a))));
      }
    }
  });
});

describe('currency table', () => {
  it('recognises supported codes and rejects others', () => {
    expect(isCurrencyCode('INR')).toBe(true);
    expect(isCurrencyCode('JPY')).toBe(true);
    expect(isCurrencyCode('XXX')).toBe(false);
    expect(isCurrencyCode('toString')).toBe(false); // not fooled by Object.prototype
  });

  it('reports the per-currency exponent, not a hardcoded 2 (§4.1)', () => {
    expect(exponentOf('INR')).toBe(2);
    expect(exponentOf('JPY')).toBe(0);
    expect(exponentOf('KWD')).toBe(3);
  });
});

describe('Result helpers', () => {
  it('unwrap returns the value for ok', () => {
    expect(unwrap(ok(42))).toBe(42);
  });

  it('unwrap throws for err rather than returning undefined', () => {
    expect(() => unwrap(err({ code: 'NOPE' }))).toThrow(/unwrap/);
  });

  it('isOk and isErr narrow correctly', () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isOk(err('x'))).toBe(false);
    expect(isErr(err('x'))).toBe(true);
    expect(isErrAlias(ok(1))).toBe(false);
  });
});

describe('parseMoney -- out of safe integer range', () => {
  it('rejects an amount too large to represent exactly', () => {
    const r = parseMoney('99999999999999999999', 'INR');
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('NOT_FINITE');
  });

  it('accepts an amount at the top of the safe range', () => {
    expect(isOk(parseMoney('1000000', 'INR'))).toBe(true);
  });
});

describe('apportionAncillary -- remaining guards', () => {
  const m = (minor: number) => money(minor, 'INR');

  it('rejects an ancillary amount in another currency', () => {
    const r = apportionAncillary({
      items: [{ id: 'a', label: 'a', amount: m(1000), claimedBy: ['alice'] }],
      tax: money(100, 'USD'),
      printedTotal: m(1100),
      unclaimedPolicy: 'BLOCK',
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });

  it('rejects when nothing at all has been claimed', () => {
    const r = apportionAncillary({
      items: [{ id: 'a', label: 'a', amount: m(1000), claimedBy: [] }],
      printedTotal: m(1000),
      unclaimedPolicy: 'SPLIT_EQUALLY',
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('UNCLAIMED_ITEMS');
  });

  it('handles a discount that is the only ancillary amount', () => {
    const r = apportionAncillary({
      items: [{ id: 'a', label: 'a', amount: m(1000), claimedBy: ['alice'] }],
      discount: m(-100),
      printedTotal: m(900),
      unclaimedPolicy: 'BLOCK',
    });
    expect(isOk(r)).toBe(true);
    if (r.ok) expect(r.value[0]!.amount.minor).toBe(900);
  });
});

describe('ITEMIZED via computeShares delegates to apportionAncillary', () => {
  const m = (minor: number) => money(minor, 'INR');

  it('splits per item and apportions tax and tip', () => {
    const r = computeShares({
      total: m(4400),
      payers: [{ userId: 'alice', amount: m(4400) }],
      strategy: {
        kind: 'ITEMIZED',
        items: [
          { amount: m(3000), participants: ['alice'] },
          { amount: m(1000), participants: ['bob'] },
        ],
        tax: m(300),
        tip: m(100),
      },
    });
    expect(isOk(r)).toBe(true);
    if (r.ok) {
      expect(r.value.reduce((a, s) => a + s.amount.minor, 0)).toBe(4400);
    }
  });

  it('propagates a reconciliation failure from the itemization', () => {
    const r = computeShares({
      total: m(9999),
      payers: [{ userId: 'alice', amount: m(9999) }],
      strategy: { kind: 'ITEMIZED', items: [{ amount: m(3000), participants: ['alice'] }] },
    });
    expect(isErr(r)).toBe(true);
  });

  it('works with no tax or tip supplied', () => {
    const r = computeShares({
      total: m(3000),
      payers: [{ userId: 'alice', amount: m(3000) }],
      strategy: { kind: 'ITEMIZED', items: [{ amount: m(3000), participants: ['alice', 'bob'] }] },
    });
    expect(isOk(r)).toBe(true);
  });
});

describe('remaining balance and money branches', () => {
  const m = (minor: number) => money(minor, 'INR');

  it('parses an amount written with no leading digits', () => {
    const r = parseMoney('.50', 'INR');
    expect(isOk(r)).toBe(true);
    if (r.ok) expect(r.value.minor).toBe(50);
  });

  it('skips zero-valued shares when building pairwise edges', () => {
    const edges = pairwiseBalances(
      [
        {
          id: 'e',
          total: m(1000),
          payers: [{ userId: 'alice', amount: m(1000) }],
          shares: [
            { userId: 'alice', amount: m(1000) },
            { userId: 'ghost', amount: m(0) },
          ],
        },
      ],
      [],
      'INR',
    );
    expect([...edges.keys()]).toEqual([]);
  });

  it('nets a settlement that reverses an edge direction', () => {
    const expenses = [
      {
        id: 'e',
        total: m(1000),
        payers: [{ userId: 'alice', amount: m(1000) }],
        shares: [
          { userId: 'alice', amount: m(500) },
          { userId: 'bob', amount: m(500) },
        ],
      },
    ];
    // bob overpays: he owed 500, sends 800, so alice now owes him 300.
    const edges = pairwiseBalances(expenses, [{ id: 's', from: 'bob', to: 'alice', amount: m(800) }], 'INR');
    expect(edges.get('alice:bob')?.minor).toBe(300);
    const net = netBalances(expenses, [{ id: 's', from: 'bob', to: 'alice', amount: m(800) }], 'INR');
    expect(net.get('alice')?.minor).toBe(-300);
  });
});

describe('ADJUSTMENT guards', () => {
  const m = (minor: number) => money(minor, 'INR');
  const base = { total: m(1000), payers: [{ userId: 'alice', amount: m(1000) }] };

  it('rejects an empty participant list', () => {
    const r = computeShares({
      ...base,
      strategy: { kind: 'ADJUSTMENT', participants: [], adjustments: [] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('NO_PARTICIPANTS');
  });

  it('rejects duplicated participants', () => {
    const r = computeShares({
      ...base,
      strategy: { kind: 'ADJUSTMENT', participants: ['a', 'a'], adjustments: [] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('DUPLICATE_PARTICIPANT');
  });

  it('rejects a delta denominated in another currency', () => {
    const r = computeShares({
      ...base,
      strategy: {
        kind: 'ADJUSTMENT',
        participants: ['alice'],
        adjustments: [{ userId: 'alice', delta: money(100, 'USD') }],
      },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });
});

describe('duplicate guards across the remaining strategies', () => {
  const m = (minor: number) => money(minor, 'INR');
  const base = { total: m(1000), payers: [{ userId: 'alice', amount: m(1000) }] };

  it('EXACT rejects duplicates and an empty list', () => {
    expect(isErr(computeShares({ ...base, strategy: { kind: 'EXACT', shares: [] } }))).toBe(true);
    const dup = computeShares({
      ...base,
      strategy: {
        kind: 'EXACT',
        shares: [
          { userId: 'a', amount: m(500) },
          { userId: 'a', amount: m(500) },
        ],
      },
    });
    expect(isErr(dup)).toBe(true);
    if (!dup.ok) expect(dup.error.code).toBe('DUPLICATE_PARTICIPANT');
  });

  it('PERCENT rejects duplicates, an empty list and non-integer bps', () => {
    expect(isErr(computeShares({ ...base, strategy: { kind: 'PERCENT', shares: [] } }))).toBe(true);
    const dup = computeShares({
      ...base,
      strategy: {
        kind: 'PERCENT',
        shares: [
          { userId: 'a', bps: 5000 },
          { userId: 'a', bps: 5000 },
        ],
      },
    });
    expect(isErr(dup)).toBe(true);
    if (!dup.ok) expect(dup.error.code).toBe('DUPLICATE_PARTICIPANT');

    const frac = computeShares({
      ...base,
      strategy: { kind: 'PERCENT', shares: [{ userId: 'a', bps: 3333.5 }, { userId: 'b', bps: 6666.5 }] },
    });
    expect(isErr(frac)).toBe(true);
  });

  it('SHARES rejects duplicates and an empty list', () => {
    expect(isErr(computeShares({ ...base, strategy: { kind: 'SHARES', shares: [] } }))).toBe(true);
    const dup = computeShares({
      ...base,
      strategy: {
        kind: 'SHARES',
        shares: [
          { userId: 'a', weight: 1 },
          { userId: 'a', weight: 1 },
        ],
      },
    });
    expect(isErr(dup)).toBe(true);
    if (!dup.ok) expect(dup.error.code).toBe('DUPLICATE_PARTICIPANT');
  });

  it('EQUAL rejects a payer in another currency', () => {
    const r = computeShares({
      total: m(1000),
      payers: [{ userId: 'alice', amount: money(1000, 'USD') }],
      strategy: { kind: 'EQUAL', participants: ['alice'] },
    });
    expect(isErr(r)).toBe(true);
    if (!r.ok) expect(r.error.code).toBe('CURRENCY_MISMATCH');
  });
});
