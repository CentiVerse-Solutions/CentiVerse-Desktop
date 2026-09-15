import { uuidv7 } from 'uuidv7';
import type { Prisma } from '@prisma/client';
import {
  netBalances,
  pairwiseBalances,
  simplifyDebts,
  type CurrencyCode,
  type ExpenseRecord,
  type SettlementRecord,
} from '@centiverse/core';
import type { CreateGroupInput, GroupDto, GroupMemberDto, UserDto } from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { ApiError } from '../lib/problem';
import { fromMinor } from '../db/money';
import { assertGroupMember } from './authorization';
import { toUserDto } from './auth';

/**
 * Group reads and writes. Every function here calls `assertGroupMember` before
 * touching anything group-scoped (§6.5) — including the read paths, because a
 * read is exactly how you would probe for a group's existence.
 */

type GroupRow = Prisma.GroupGetPayload<Record<string, never>>;

const toGroupDto = (group: GroupRow): GroupDto => ({
  id: group.id,
  name: group.name,
  avatarUrl: group.avatarUrl,
  bannerUrl: group.bannerUrl,
  currency: group.currency.trim() as GroupDto['currency'],
  simplifyDebts: group.simplifyDebts,
  createdBy: group.createdById,
  createdAt: group.createdAt.toISOString(),
  archivedAt: group.archivedAt?.toISOString() ?? null,
  deletedAt: group.deletedAt?.toISOString() ?? null,
});

export const listGroups = async (db: Db, userId: string): Promise<GroupDto[]> => {
  const groups = await db.group.findMany({
    where: { deletedAt: null, members: { some: { userId, leftAt: null } } },
    orderBy: { createdAt: 'desc' },
  });
  return groups.map(toGroupDto);
};

export const getGroup = async (db: Db, userId: string, groupId: string): Promise<GroupDto> => {
  await assertGroupMember(db, userId, groupId);
  const group = await db.group.findFirstOrThrow({ where: { id: groupId, deletedAt: null } });
  return toGroupDto(group);
};

export const createGroup = async (
  db: Db,
  userId: string,
  input: CreateGroupInput,
): Promise<GroupDto> => {
  // Members named on creation must be people the creator can actually see.
  // Without this, a group is a way to confirm that an arbitrary user id exists.
  const memberIds = [...new Set(input.memberIds.filter((id) => id !== userId))];
  if (memberIds.length > 0) {
    const found = await db.user.count({ where: { id: { in: memberIds }, deletedAt: null } });
    if (found !== memberIds.length) {
      throw ApiError.validation({ memberIds: ['one or more members do not exist'] });
    }
  }

  const group = await db.group.create({
    data: {
      id: input.id,
      name: input.name,
      currency: input.currency,
      simplifyDebts: input.simplifyDebts,
      createdById: userId,
      members: {
        create: [
          { userId, role: 'OWNER' },
          ...memberIds.map((id) => ({ userId: id, role: 'MEMBER' as const })),
        ],
      },
    },
  });

  return toGroupDto(group);
};

export const updateGroup = async (
  db: Db,
  userId: string,
  groupId: string,
  patch: {
    name?: string | undefined;
    currency?: string | undefined;
    simplifyDebts?: boolean | undefined;
    avatarUrl?: string | null | undefined;
  },
): Promise<GroupDto> => {
  await assertGroupMember(db, userId, groupId, { minRole: 'ADMIN' });

  // Changing the currency of a group that already has a ledger would silently
  // reinterpret every stored amount (ADR 0002: one currency per group).
  if (patch.currency !== undefined) {
    const existing = await db.expense.count({ where: { groupId, deletedAt: null } });
    if (existing > 0) {
      throw ApiError.conflict('a group with expenses cannot change currency');
    }
  }

  const data: Prisma.GroupUpdateInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.simplifyDebts !== undefined) data.simplifyDebts = patch.simplifyDebts;
  if (patch.avatarUrl !== undefined) data.avatarUrl = patch.avatarUrl;

  const group = await db.group.update({ where: { id: groupId }, data });
  return toGroupDto(group);
};

/** Soft delete: the ledger is append-mostly (invariant 5). */
export const deleteGroup = async (db: Db, userId: string, groupId: string): Promise<void> => {
  await assertGroupMember(db, userId, groupId, { minRole: 'OWNER' });
  await db.group.update({ where: { id: groupId }, data: { deletedAt: new Date() } });
};

export interface GroupMemberWithUser {
  member: GroupMemberDto;
  user: UserDto;
}

export const listMembers = async (
  db: Db,
  userId: string,
  groupId: string,
): Promise<GroupMemberWithUser[]> => {
  await assertGroupMember(db, userId, groupId);
  const members = await db.groupMember.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });

  return members.map((m) => ({
    member: {
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      leftAt: m.leftAt?.toISOString() ?? null,
    },
    user: toUserDto(m.user),
  }));
};

export interface AddMemberInput {
  /** An existing account... */
  userId?: string | undefined;
  /** ...or a placeholder created by name (§12 #9, ADR 0004). */
  displayName?: string | undefined;
}

export const addMember = async (
  db: Db,
  actorId: string,
  groupId: string,
  input: AddMemberInput,
): Promise<GroupMemberWithUser> => {
  await assertGroupMember(db, actorId, groupId, { minRole: 'ADMIN' });

  return db.$transaction(async (tx) => {
    let targetId = input.userId;

    if (targetId === undefined) {
      if (input.displayName === undefined || input.displayName.trim() === '') {
        throw ApiError.validation({
          displayName: ['give either an existing userId or a name for a placeholder member'],
        });
      }
      // A placeholder is an ordinary user row with no email and no claim.
      const placeholder = await tx.user.create({
        data: { id: uuidv7(), displayName: input.displayName.trim() },
      });
      targetId = placeholder.id;
    } else {
      const exists = await tx.user.count({ where: { id: targetId, deletedAt: null } });
      if (exists === 0) throw ApiError.validation({ userId: ['no such user'] });
    }

    const existing = await tx.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetId } },
    });

    // Re-adding someone who left restores them rather than failing on the
    // primary key, which keeps their history attached.
    const member =
      existing === null
        ? await tx.groupMember.create({ data: { groupId, userId: targetId } })
        : await tx.groupMember.update({
            where: { groupId_userId: { groupId, userId: targetId } },
            data: { leftAt: null },
          });

    const user = await tx.user.findUniqueOrThrow({ where: { id: targetId } });
    return {
      member: {
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        leftAt: member.leftAt?.toISOString() ?? null,
      },
      user: toUserDto(user),
    };
  });
};

export const removeMember = async (
  db: Db,
  actorId: string,
  groupId: string,
  targetId: string,
): Promise<void> => {
  // Leaving is always allowed; removing someone else needs ADMIN.
  await assertGroupMember(db, actorId, groupId, actorId === targetId ? {} : { minRole: 'ADMIN' });

  const target = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetId } },
  });
  if (target === null || target.leftAt !== null) {
    throw ApiError.notFound('that person is not in this group');
  }

  // Someone who is owed money, or owes it, cannot vanish from the ledger — the
  // balances would stop summing to zero (invariant 2).
  const balances = await computeNetBalances(db, groupId);
  const outstanding = balances.find((b) => b.userId === targetId && b.amount.minor !== 0);
  if (outstanding !== undefined) {
    throw ApiError.conflict('settle up before leaving: this person still has a balance');
  }

  await db.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetId } },
    data: { leftAt: new Date() },
  });
};

/**
 * The ledger, as `@centiverse/core` wants to see it. Balances are derived from
 * this on every read (invariant 4); `balance_cache` is a cache and is never the
 * source of an answer.
 */
const loadLedger = async (
  db: Db,
  groupId: string,
): Promise<{ expenses: ExpenseRecord[]; settlements: SettlementRecord[]; currency: CurrencyCode }> => {
  const group = await db.group.findFirstOrThrow({ where: { id: groupId, deletedAt: null } });
  const currency = group.currency.trim() as CurrencyCode;

  const expenseRows = await db.expense.findMany({
    where: { groupId, deletedAt: null },
    include: { payers: true, shares: true },
  });

  const settlementRows = await db.settlement.findMany({
    where: { groupId, deletedAt: null },
  });

  return {
    currency,
    expenses: expenseRows.map((e) => ({
      id: e.id,
      total: fromMinor(e.totalMinor, e.currency.trim()),
      payers: e.payers.map((p) => ({
        userId: p.userId,
        amount: fromMinor(p.amountMinor, e.currency.trim()),
      })),
      shares: e.shares.map((s) => ({
        userId: s.userId,
        amount: fromMinor(s.amountMinor, e.currency.trim()),
      })),
    })),
    settlements: settlementRows.map((s) => ({
      id: s.id,
      from: s.fromUserId,
      to: s.toUserId,
      amount: fromMinor(s.amountMinor, s.currency.trim()),
    })),
  };
};

export interface NetBalanceDto {
  userId: string;
  amount: { minor: number; currency: string };
}

export interface PairwiseBalanceDto {
  fromUserId: string;
  toUserId: string;
  amount: { minor: number; currency: string };
}

const computeNetBalances = async (db: Db, groupId: string): Promise<NetBalanceDto[]> => {
  const { expenses, settlements, currency } = await loadLedger(db, groupId);
  const net = netBalances(expenses, settlements, currency);
  return [...net].map(([userId, amount]) => ({ userId, amount }));
};

export const getBalances = async (
  db: Db,
  userId: string,
  groupId: string,
): Promise<{ net: NetBalanceDto[]; pairwise: PairwiseBalanceDto[] }> => {
  await assertGroupMember(db, userId, groupId);
  const { expenses, settlements, currency } = await loadLedger(db, groupId);

  // Every member appears, including those at zero, so the client does not have
  // to guess whether a missing member is settled up or simply absent.
  const members = await db.groupMember.findMany({ where: { groupId, leftAt: null } });
  const net = netBalances(expenses, settlements, currency);
  for (const m of members) {
    if (!net.has(m.userId)) net.set(m.userId, { minor: 0, currency });
  }

  const pairwise = pairwiseBalances(expenses, settlements, currency);

  return {
    net: [...net].map(([id, amount]) => ({ userId: id, amount })),
    pairwise: [...pairwise].map(([key, amount]) => {
      const [fromUserId, toUserId] = key.split(':') as [string, string];
      return { fromUserId, toUserId, amount };
    }),
  };
};

/**
 * §6.3's `/settle-plan`. Invariant 9: this is a display suggestion and is never
 * persisted as settlements — the endpoint is read-only for exactly that reason.
 */
export const getSettlePlan = async (
  db: Db,
  userId: string,
  groupId: string,
): Promise<PairwiseBalanceDto[]> => {
  await assertGroupMember(db, userId, groupId);
  const { expenses, settlements, currency } = await loadLedger(db, groupId);
  const net = netBalances(expenses, settlements, currency);

  return simplifyDebts(net, currency).map((t) => ({
    fromUserId: t.from,
    toUserId: t.to,
    amount: t.amount,
  }));
};
