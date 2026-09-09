import { z } from 'zod';
import { CurrencyCodeSchema, IsoDateTimeSchema, UuidSchema } from './common';

/**
 * §5.4 — no user is ever named "You". The viewer's identity is a property of
 * the viewer, not of the data. `displayName(user, viewerId)` in the web app
 * renders "You" at the edge; the wire format carries real names only.
 */
export const UserSchema = z.object({
  id: UuidSchema,
  /** null for a placeholder member added by name who has not claimed an account. */
  email: z.string().email().nullable(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  defaultCurrency: CurrencyCodeSchema,
  locale: z.string().min(2).max(20),
  timezone: z.string().min(1).max(64),
  createdAt: IsoDateTimeSchema,
  /** §12 #9 — placeholder members are real users, not a separate entity. */
  claimedAt: IsoDateTimeSchema.nullable(),
});
export type UserDto = z.infer<typeof UserSchema>;

export const GroupMemberSchema = z.object({
  userId: UuidSchema,
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  joinedAt: IsoDateTimeSchema,
  leftAt: IsoDateTimeSchema.nullable(),
});
export type GroupMemberDto = z.infer<typeof GroupMemberSchema>;

export const GroupSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable(),
  bannerUrl: z.string().url().nullable(),
  /** ADR 0002: one currency per group, every expense in it uses this. */
  currency: CurrencyCodeSchema,
  /** Opt-in per group -- for some groups the pairwise detail is the point (§4.4). */
  simplifyDebts: z.boolean(),
  createdBy: UuidSchema,
  createdAt: IsoDateTimeSchema,
  archivedAt: IsoDateTimeSchema.nullable(),
  deletedAt: IsoDateTimeSchema.nullable(),
});
export type GroupDto = z.infer<typeof GroupSchema>;

export const CreateGroupInputSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  currency: CurrencyCodeSchema,
  memberIds: z.array(UuidSchema),
  simplifyDebts: z.boolean().default(false),
});
export type CreateGroupInput = z.infer<typeof CreateGroupInputSchema>;
