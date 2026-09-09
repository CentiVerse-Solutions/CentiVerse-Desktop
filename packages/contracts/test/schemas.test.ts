import { describe, it, expect } from 'vitest';
import {
  ExpenseSchema,
  MoneySchema,
  SettlementSchema,
  SplitStrategySchema,
  GroupSchema,
  UserSchema,
  ProblemSchema,
} from '../src';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const NOW = '2026-01-15T10:00:00.000Z';
const inr = (minor: number) => ({ minor, currency: 'INR' });

const validExpense = {
  id: uuid(1),
  groupId: uuid(2),
  description: 'Dinner',
  total: inr(10000),
  date: NOW,
  categoryId: null,
  notes: null,
  payers: [{ userId: uuid(3), amount: inr(10000) }],
  shares: [
    { userId: uuid(3), amount: inr(3334) },
    { userId: uuid(4), amount: inr(3333) },
    { userId: uuid(5), amount: inr(3333) },
  ],
  splitStrategy: { kind: 'EQUAL', participants: [uuid(3), uuid(4), uuid(5)] },
  createdBy: uuid(3),
  createdAt: NOW,
  updatedAt: NOW,
  version: 1,
  deletedAt: null,
};

describe('MoneySchema', () => {
  it('accepts integer minor units with a known currency', () => {
    expect(MoneySchema.safeParse(inr(250000)).success).toBe(true);
  });

  it('rejects floats -- money never touches a float (invariant 3)', () => {
    expect(MoneySchema.safeParse({ minor: 12.5, currency: 'INR' }).success).toBe(false);
  });

  it('rejects a decimal string on the wire', () => {
    expect(MoneySchema.safeParse({ minor: '125.00', currency: 'INR' }).success).toBe(false);
  });

  it('rejects an unknown currency', () => {
    expect(MoneySchema.safeParse({ minor: 100, currency: 'XXX' }).success).toBe(false);
  });
});

describe('ExpenseSchema enforces invariant 1 at the boundary', () => {
  it('accepts a well-formed expense', () => {
    expect(ExpenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('rejects shares that do not sum to the total', () => {
    const bad = { ...validExpense, shares: [{ userId: uuid(3), amount: inr(9999) }] };
    const r = ExpenseSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toMatch(/shares must sum/);
  });

  it('rejects payers that do not sum to the total', () => {
    const bad = { ...validExpense, payers: [{ userId: uuid(3), amount: inr(5000) }] };
    const r = ExpenseSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toMatch(/payers must sum/);
  });

  it('rejects a share in a different currency from the expense', () => {
    const bad = {
      ...validExpense,
      shares: [
        { userId: uuid(3), amount: { minor: 3334, currency: 'USD' } },
        { userId: uuid(4), amount: inr(3333) },
        { userId: uuid(5), amount: inr(3333) },
      ],
    };
    expect(ExpenseSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-positive total', () => {
    expect(ExpenseSchema.safeParse({ ...validExpense, total: inr(0) }).success).toBe(false);
  });

  it('rejects an empty description', () => {
    expect(ExpenseSchema.safeParse({ ...validExpense, description: '' }).success).toBe(false);
  });
});

describe('SplitStrategySchema', () => {
  it('requires percentages to sum to exactly 10000 bps', () => {
    const ok = SplitStrategySchema.safeParse({
      kind: 'PERCENT',
      shares: [
        { userId: uuid(1), bps: 3333 },
        { userId: uuid(2), bps: 3333 },
        { userId: uuid(3), bps: 3334 },
      ],
    });
    expect(ok.success).toBe(true);

    const bad = SplitStrategySchema.safeParse({
      kind: 'PERCENT',
      shares: [
        { userId: uuid(1), bps: 5000 },
        { userId: uuid(2), bps: 4000 },
      ],
    });
    expect(bad.success).toBe(false);
  });

  it('rejects fractional basis points', () => {
    const r = SplitStrategySchema.safeParse({
      kind: 'PERCENT',
      shares: [
        { userId: uuid(1), bps: 3333.5 },
        { userId: uuid(2), bps: 6666.5 },
      ],
    });
    expect(r.success).toBe(false);
  });

  it('requires at least one non-zero weight for SHARES', () => {
    const r = SplitStrategySchema.safeParse({
      kind: 'SHARES',
      shares: [{ userId: uuid(1), weight: 0 }],
    });
    expect(r.success).toBe(false);
  });

  it('accepts every strategy kind', () => {
    const kinds = ['EQUAL', 'EXACT', 'PERCENT', 'SHARES', 'ADJUSTMENT', 'ITEMIZED'];
    const samples: Record<string, unknown> = {
      EQUAL: { kind: 'EQUAL', participants: [uuid(1)] },
      EXACT: { kind: 'EXACT', shares: [{ userId: uuid(1), amount: inr(100) }] },
      PERCENT: { kind: 'PERCENT', shares: [{ userId: uuid(1), bps: 10000 }] },
      SHARES: { kind: 'SHARES', shares: [{ userId: uuid(1), weight: 1 }] },
      ADJUSTMENT: { kind: 'ADJUSTMENT', participants: [uuid(1)], adjustments: [] },
      ITEMIZED: {
        kind: 'ITEMIZED',
        items: [{ amount: inr(100), participants: [uuid(1)] }],
      },
    };
    for (const k of kinds) {
      expect(SplitStrategySchema.safeParse(samples[k]).success).toBe(true);
    }
  });
});

describe('SettlementSchema', () => {
  const valid = {
    id: uuid(1),
    groupId: uuid(2),
    fromUserId: uuid(3),
    toUserId: uuid(4),
    amount: inr(5000),
    method: 'UPI',
    externalRef: null,
    note: null,
    settledAt: NOW,
    recordedBy: uuid(3),
    confirmedAt: null,
    deletedAt: null,
  };

  it('accepts a well-formed settlement', () => {
    expect(SettlementSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects paying yourself', () => {
    expect(SettlementSchema.safeParse({ ...valid, toUserId: valid.fromUserId }).success).toBe(false);
  });

  it('rejects a zero amount', () => {
    expect(SettlementSchema.safeParse({ ...valid, amount: inr(0) }).success).toBe(false);
  });
});

describe('User and Group', () => {
  it('allows a placeholder member with no email (§12 #9)', () => {
    const r = UserSchema.safeParse({
      id: uuid(1),
      email: null,
      displayName: 'Rahul',
      avatarUrl: null,
      defaultCurrency: 'INR',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      createdAt: NOW,
      claimedAt: null,
    });
    expect(r.success).toBe(true);
  });

  it('carries per-group simplifyDebts as opt-in', () => {
    const r = GroupSchema.safeParse({
      id: uuid(1),
      name: 'Thailand Trip',
      avatarUrl: null,
      bannerUrl: null,
      currency: 'INR',
      simplifyDebts: false,
      createdBy: uuid(2),
      createdAt: NOW,
      archivedAt: null,
      deletedAt: null,
    });
    expect(r.success).toBe(true);
  });
});

describe('Problem (RFC 9457)', () => {
  it('parses the one error shape used everywhere', () => {
    expect(
      ProblemSchema.safeParse({
        type: 'https://centiverse.app/errors/validation',
        title: 'Validation failed',
        status: 422,
        errors: { 'shares': ['shares must sum to the expense total'] },
      }).success,
    ).toBe(true);
  });
});
