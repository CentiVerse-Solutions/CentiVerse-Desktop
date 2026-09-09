import type { Money } from './money';

export type UserId = string;

export interface Share {
  readonly userId: UserId;
  readonly amount: Money;
}

export interface Payer {
  readonly userId: UserId;
  readonly amount: Money;
}
