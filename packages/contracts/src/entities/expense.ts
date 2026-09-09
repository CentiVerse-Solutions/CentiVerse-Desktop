import { z } from 'zod';
import {
  CurrencyCodeSchema,
  IsoDateTimeSchema,
  MoneySchema,
  PositiveMoneySchema,
  UuidSchema,
} from './common';

export const PayerSchema = z.object({
  userId: UuidSchema,
  amount: PositiveMoneySchema,
});

export const ShareSchema = z.object({
  userId: UuidSchema,
  /** Not PositiveMoney: an ADJUSTMENT split may legitimately go negative. */
  amount: MoneySchema,
});

export const SplitStrategySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('EQUAL'),
    participants: z.array(UuidSchema).min(1),
  }),
  z.object({
    kind: z.literal('EXACT'),
    shares: z.array(z.object({ userId: UuidSchema, amount: MoneySchema })).min(1),
  }),
  z.object({
    kind: z.literal('PERCENT'),
    // Integer basis points, summing to 10000. Never floats (§4.2).
    shares: z
      .array(z.object({ userId: UuidSchema, bps: z.number().int().nonnegative() }))
      .min(1)
      .refine((s) => s.reduce((a, x) => a + x.bps, 0) === 10_000, {
        message: 'basis points must sum to exactly 10000',
      }),
  }),
  z.object({
    kind: z.literal('SHARES'),
    shares: z
      .array(z.object({ userId: UuidSchema, weight: z.number().int().nonnegative() }))
      .min(1)
      .refine((s) => s.reduce((a, x) => a + x.weight, 0) > 0, {
        message: 'at least one weight must be greater than zero',
      }),
  }),
  z.object({
    kind: z.literal('ADJUSTMENT'),
    participants: z.array(UuidSchema).min(1),
    adjustments: z.array(z.object({ userId: UuidSchema, delta: MoneySchema })),
  }),
  z.object({
    kind: z.literal('ITEMIZED'),
    items: z
      .array(z.object({ amount: PositiveMoneySchema, participants: z.array(UuidSchema).min(1) }))
      .min(1),
    tax: MoneySchema.optional(),
    tip: MoneySchema.optional(),
  }),
]);
export type SplitStrategyDto = z.infer<typeof SplitStrategySchema>;

export const ExpenseSchema = z
  .object({
    id: UuidSchema,
    /** null = a 1:1 expense outside any group. */
    groupId: UuidSchema.nullable(),
    description: z.string().min(1).max(200),
    total: PositiveMoneySchema,
    date: IsoDateTimeSchema,
    categoryId: UuidSchema.nullable(),
    notes: z.string().max(2000).nullable(),
    payers: z.array(PayerSchema).min(1),
    shares: z.array(ShareSchema).min(1),
    splitStrategy: SplitStrategySchema,
    createdBy: UuidSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    /** Optimistic concurrency: a mismatch returns 409 with server state (§6.3). */
    version: z.number().int().nonnegative(),
    deletedAt: IsoDateTimeSchema.nullable(),
  })
  // Invariant 1, enforced at the contract boundary as well as in the domain
  // and (from Phase 5) by a database constraint trigger.
  .refine((e) => e.payers.every((p) => p.amount.currency === e.total.currency), {
    message: 'every payer must be in the expense currency',
    path: ['payers'],
  })
  .refine((e) => e.shares.every((s) => s.amount.currency === e.total.currency), {
    message: 'every share must be in the expense currency',
    path: ['shares'],
  })
  .refine((e) => e.payers.reduce((a, p) => a + p.amount.minor, 0) === e.total.minor, {
    message: 'payers must sum to the expense total',
    path: ['payers'],
  })
  .refine((e) => e.shares.reduce((a, s) => a + s.amount.minor, 0) === e.total.minor, {
    message: 'shares must sum to the expense total',
    path: ['shares'],
  });
export type ExpenseDto = z.infer<typeof ExpenseSchema>;

export const CreateExpenseInputSchema = z.object({
  /** Client-generated UUIDv7, which is what makes retries idempotent (§6.3). */
  id: UuidSchema,
  groupId: UuidSchema.nullable(),
  description: z.string().min(1).max(200),
  total: PositiveMoneySchema,
  date: IsoDateTimeSchema,
  categoryId: UuidSchema.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  payers: z.array(PayerSchema).min(1),
  splitStrategy: SplitStrategySchema,
});
export type CreateExpenseInput = z.infer<typeof CreateExpenseInputSchema>;

export const SettlementSchema = z
  .object({
    id: UuidSchema,
    groupId: UuidSchema.nullable(),
    fromUserId: UuidSchema,
    toUserId: UuidSchema,
    amount: PositiveMoneySchema,
    method: z.enum(['UPI', 'CASH', 'BANK', 'OTHER']),
    externalRef: z.string().max(200).nullable(),
    note: z.string().max(500).nullable(),
    settledAt: IsoDateTimeSchema,
    recordedBy: UuidSchema,
    /** Two-sided confirmation: null until the payee agrees it happened. */
    confirmedAt: IsoDateTimeSchema.nullable(),
    deletedAt: IsoDateTimeSchema.nullable(),
  })
  .refine((s) => s.fromUserId !== s.toUserId, {
    message: 'a settlement needs two different people',
    path: ['toUserId'],
  });
export type SettlementDto = z.infer<typeof SettlementSchema>;

export const CurrencySchema = CurrencyCodeSchema;
