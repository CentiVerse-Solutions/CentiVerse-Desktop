import { type Money, money } from '../money';
import type { UserId, Share } from '../types';
import { compareIds } from '../compare';

/**
 * §4.3 -- largest remainder with a deterministic tie-break.
 *
 *   1. exact rational share per participant
 *   2. floor in minor units
 *   3. remainder = total - sum(floors)
 *   4. rank by fractional part DESC, then userId ASC
 *   5. +1 minor unit to the first `remainder` participants
 *
 * The userId ASC tie-break is what makes client, server and any recompute job
 * produce byte-identical shares (invariant 4). Without it, optimistic UI and
 * server truth disagree by a paisa.
 */
const allocate = (
  total: Money,
  parts: ReadonlyArray<{ userId: UserId; weight: number }>,
  totalWeight: number,
): Share[] => {
  const { minor, currency } = total;
  const sign = minor < 0 ? -1 : 1;
  const magnitude = Math.abs(minor);

  const floors = parts.map((p) => {
    const exact = (magnitude * p.weight) / totalWeight;
    const floor = Math.floor(exact);
    return { userId: p.userId, floor, fraction: exact - floor };
  });

  const distributed = floors.reduce((acc, f) => acc + f.floor, 0);
  let remainder = magnitude - distributed;

  // Rank by fractional part DESC, then userId ASC. Both keys are needed: the
  // fraction decides who is owed the unit, the id makes ties reproducible.
  const ranked = [...floors].sort(
    (a, b) => b.fraction - a.fraction || compareIds(a.userId, b.userId),
  );

  const bonus = new Set<UserId>();
  for (const entry of ranked) {
    if (remainder <= 0) break;
    bonus.add(entry.userId);
    remainder -= 1;
  }

  // Emit in the caller's original order; only the amounts are rank-dependent.
  return floors.map((f) => ({
    userId: f.userId,
    amount: money(sign * (f.floor + (bonus.has(f.userId) ? 1 : 0)), currency),
  }));
};

/** Split a total evenly, remainder allocated per §4.3. */
export const allocateEvenly = (total: Money, participants: readonly UserId[]): Share[] =>
  allocate(
    total,
    participants.map((userId) => ({ userId, weight: 1 })),
    participants.length,
  );

/**
 * Split a total in proportion to integer weights, remainder allocated per §4.3.
 * A total weight of zero degrades to an even split rather than dividing by zero.
 */
export const allocateByWeight = (
  total: Money,
  parts: ReadonlyArray<{ userId: UserId; weight: number }>,
): Share[] => {
  const totalWeight = parts.reduce((acc, p) => acc + p.weight, 0);
  return totalWeight === 0
    ? allocateEvenly(total, parts.map((p) => p.userId))
    : allocate(total, parts, totalWeight);
};
