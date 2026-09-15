import { z } from 'zod';
import { CurrencyCodeSchema, IsoDateTimeSchema, MoneySchema, UuidSchema } from './common';

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

export const UpdateGroupInputSchema = z
  .object({
    name: z.string().min(1).max(100),
    /** Only accepted while the group has no expenses (ADR 0002). */
    currency: CurrencyCodeSchema,
    simplifyDebts: z.boolean(),
    avatarUrl: z.string().url().nullable(),
  })
  .partial();
export type UpdateGroupInput = z.infer<typeof UpdateGroupInputSchema>;

/**
 * Either an existing account or a name to create a placeholder for (§12 #9).
 * Exactly one, so "add Priya" and "add user 0193..." cannot be confused.
 */
export const AddMemberInputSchema = z
  .object({
    userId: UuidSchema.optional(),
    displayName: z.string().min(1).max(100).optional(),
  })
  .refine((v) => (v.userId === undefined) !== (v.displayName === undefined), {
    message: 'give exactly one of userId or displayName',
  });
export type AddMemberInput = z.infer<typeof AddMemberInputSchema>;

export const GroupMemberWithUserSchema = z.object({
  member: GroupMemberSchema,
  user: UserSchema,
});
export type GroupMemberWithUserDto = z.infer<typeof GroupMemberWithUserSchema>;

/** A member's single net position. Positive means they are owed (§4.4). */
export const NetBalanceSchema = z.object({
  userId: UuidSchema,
  amount: MoneySchema,
});
export type NetBalanceDto = z.infer<typeof NetBalanceSchema>;

/** One directed edge: `fromUserId` owes `toUserId`. Always positive. */
export const PairwiseBalanceSchema = z.object({
  fromUserId: UuidSchema,
  toUserId: UuidSchema,
  amount: MoneySchema,
});
export type PairwiseBalanceDto = z.infer<typeof PairwiseBalanceSchema>;

export const GroupBalancesSchema = z.object({
  net: z.array(NetBalanceSchema),
  pairwise: z.array(PairwiseBalanceSchema),
});
export type GroupBalancesDto = z.infer<typeof GroupBalancesSchema>;
