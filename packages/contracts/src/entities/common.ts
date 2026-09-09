import { z } from 'zod';
import { CURRENCY_EXPONENTS } from '@centiverse/core';

/**
 * §5.1 — zod schemas are the single source of truth for every entity. Types are
 * inferred from them, never hand-written in parallel.
 *
 * The same schema validates the API request body server-side, validates the API
 * response client-side (catching contract drift immediately, in dev), and drives
 * react-hook-form resolvers in the UI. One definition, three jobs.
 */

const currencyCodes = Object.keys(CURRENCY_EXPONENTS) as [string, ...string[]];

export const CurrencyCodeSchema = z.enum(currencyCodes);

/**
 * Money crosses the wire as `{ minor, currency }` — never a decimal string,
 * never a float (invariant 3). `minor` must be a safe integer.
 */
export const MoneySchema = z.object({
  minor: z.number().int().safe(),
  currency: CurrencyCodeSchema,
});
export type MoneyDto = z.infer<typeof MoneySchema>;

/** A positive amount: expense totals and settlement amounts are never <= 0. */
export const PositiveMoneySchema = MoneySchema.refine((m) => m.minor > 0, {
  message: 'amount must be greater than zero',
});

export const UuidSchema = z.string().uuid();
export const IsoDateTimeSchema = z.string().datetime();

/** Cursor pagination (§6.3): opaque, never an offset. */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

/** RFC 9457 problem+json — one error shape, always (§6.3). */
export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.record(z.array(z.string())).optional(),
});
export type Problem = z.infer<typeof ProblemSchema>;
