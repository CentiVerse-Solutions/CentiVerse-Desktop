import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { simplifyDebts } from '../src/balance';
import { money } from '../src/money';
import type { UserId } from '../src/types';

const INR = 'INR' as const;
/** Collapses -0 to 0; only ever produced by this file's own arithmetic. */
const z = (n: number) => (n === 0 ? 0 : n);

const netMap = (entries: Record<string, number>) =>
  new Map(Object.entries(entries).map(([k, v]) => [k, money(v, INR)]));

/** Applying every transfer to a zero ledger must reproduce the input net map. */
const applyTransfers = (transfers: ReturnType<typeof simplifyDebts>) => {
  const result = new Map<UserId, number>();
  const bump = (id: UserId, minor: number) => result.set(id, (result.get(id) ?? 0) + minor);
  for (const t of transfers) {
    bump(t.from, t.amount.minor);
    bump(t.to, -t.amount.minor);
  }
  return result;
};

describe('simplifyDebts', () => {
  it('collapses a cycle: a owes b owes c owes a nets to nothing', () => {
    expect(simplifyDebts(netMap({ a: 0, b: 0, c: 0 }), INR)).toEqual([]);
  });

  it('produces one transfer for a simple two-party debt', () => {
    const transfers = simplifyDebts(netMap({ alice: 1000, bob: -1000 }), INR);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toMatchObject({ from: 'bob', to: 'alice' });
    expect(transfers[0]!.amount.minor).toBe(1000);
  });

  it('reduces to at most N-1 transfers', () => {
    const net = netMap({ a: 3000, b: -1000, c: -1000, d: -1000 });
    const transfers = simplifyDebts(net, INR);
    expect(transfers.length).toBeLessThanOrEqual(net.size - 1);
    expect(transfers).toHaveLength(3);
  });

  it('matches the largest debtor to the largest creditor first', () => {
    const transfers = simplifyDebts(netMap({ big: 5000, small: 1000, x: -5500, y: -500 }), INR);
    expect(transfers[0]).toMatchObject({ from: 'x', to: 'big' });
  });

  it('preserves every net position exactly (§4.5)', () => {
    const net = netMap({ a: 2500, b: -1000, c: -1500 });
    const applied = applyTransfers(simplifyDebts(net, INR));
    for (const [userId, amount] of net) {
      expect(z(applied.get(userId) ?? 0)).toBe(z(-amount.minor));
    }
  });

  it('ignores members who are already square', () => {
    const transfers = simplifyDebts(netMap({ a: 1000, b: -1000, settled: 0 }), INR);
    expect(transfers.flatMap((t) => [t.from, t.to])).not.toContain('settled');
  });

  it('is empty for an empty ledger', () => {
    expect(simplifyDebts(new Map(), INR)).toEqual([]);
  });

  it('is deterministic under tie conditions (invariant 4)', () => {
    const net = netMap({ z: -1000, a: -1000, m: 1000, b: 1000 });
    expect(JSON.stringify(simplifyDebts(net, INR))).toBe(JSON.stringify(simplifyDebts(net, INR)));
  });
});

describe('property: simplifyDebts preserves net positions (§4.5)', () => {
  it('holds for arbitrary balanced ledgers', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -1_000_000, max: 1_000_000 }), { minLength: 2, maxLength: 12 }),
        (raw) => {
          // Force the ledger to balance: invariant 2 says it always does.
          const head = raw.slice(0, -1);
          const balanced = [...head, -head.reduce((a, b) => a + b, 0)];
          const net = netMap(Object.fromEntries(balanced.map((v, i) => [`u${i}`, v])));

          const transfers = simplifyDebts(net, INR);
          const applied = applyTransfers(transfers);

          for (const [userId, amount] of net) {
            expect(z(applied.get(userId) ?? 0)).toBe(z(-amount.minor));
          }
          // and never more transfers than participants - 1
          expect(transfers.length).toBeLessThanOrEqual(Math.max(0, net.size - 1));
        },
      ),
      { numRuns: 500 },
    );
  });

  it('never emits a zero or negative transfer', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -500_000, max: 500_000 }), { minLength: 2, maxLength: 10 }),
        (raw) => {
          const head = raw.slice(0, -1);
          const balanced = [...head, -head.reduce((a, b) => a + b, 0)];
          const net = netMap(Object.fromEntries(balanced.map((v, i) => [`u${i}`, v])));
          for (const t of simplifyDebts(net, INR)) {
            expect(t.amount.minor).toBeGreaterThan(0);
            expect(t.from).not.toBe(t.to);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
