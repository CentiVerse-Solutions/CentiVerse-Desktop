import { type Money, add, money, sub, sum } from '../money';
import type { Payer, Share, UserId } from '../types';

/**
 * §4.2. Percentages are integer basis points, never floats: 33.33% is 3333 bps.
 * Multi-payer exists from day one even though the v1 UI offers a single payer --
 * retrofitting it later is a migration across every derived table.
 */
export type SplitStrategy =
  | { kind: 'EQUAL'; participants: readonly UserId[] }
  | { kind: 'EXACT'; shares: ReadonlyArray<{ userId: UserId; amount: Money }> }
  | { kind: 'PERCENT'; shares: ReadonlyArray<{ userId: UserId; bps: number }> }
  | { kind: 'SHARES'; shares: ReadonlyArray<{ userId: UserId; weight: number }> }
  | {
      kind: 'ADJUSTMENT';
      participants: readonly UserId[];
      adjustments: ReadonlyArray<{ userId: UserId; delta: Money }>;
    }
  | {
      kind: 'ITEMIZED';
      items: ReadonlyArray<{ amount: Money; participants: readonly UserId[] }>;
      tax?: Money;
      tip?: Money;
    };

export interface SplitInput {
  readonly total: Money;
  readonly payers: readonly Payer[];
  readonly strategy: SplitStrategy;
}

export type { Share, Payer, UserId };
export { add, money, sub, sum };
