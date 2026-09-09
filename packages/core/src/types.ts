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

export interface ExpenseRecord {
  readonly id: string;
  readonly total: Money;
  readonly payers: readonly Payer[];
  readonly shares: readonly Share[];
}

export interface SettlementRecord {
  readonly id: string;
  readonly from: UserId;
  readonly to: UserId;
  readonly amount: Money;
}
