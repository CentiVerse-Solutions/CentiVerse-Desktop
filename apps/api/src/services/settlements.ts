import type { Prisma, Settlement } from '@prisma/client';
import type { CreateSettlementInput, SettlementDto } from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { fromMinor, toMinorBigInt } from '../db/money';
import { asCurrencyCode, toDomainMoney, toMoneyDto } from '../lib/money';
import { ApiError } from '../lib/problem';
import { assertGroupMember } from './authorization';

/**
 * Settlements: real payments between two people, recorded in the ledger.
 *
 * Invariant 9 is the thing to keep in mind here. `/settle-plan` suggests
 * transfers, but a suggestion is between whoever the greedy algorithm paired up,
 * which may be two people who never shared an expense. When a user acts on one,
 * the client records a settlement between the two *actual* parties — so this
 * service takes `fromUserId`/`toUserId` from the request and never from a plan.
 */

const toSettlementDto = (row: Settlement): SettlementDto => ({
  id: row.id,
  groupId: row.groupId,
  fromUserId: row.fromUserId,
  toUserId: row.toUserId,
  amount: toMoneyDto(fromMinor(row.amountMinor, row.currency.trim())),
  method: row.method,
  externalRef: row.externalRef,
  note: row.note,
  settledAt: row.settledAt.toISOString(),
  recordedBy: row.recordedById,
  confirmedAt: row.confirmedAt?.toISOString() ?? null,
  deletedAt: row.deletedAt?.toISOString() ?? null,
});

export const createSettlement = async (
  db: Db,
  userId: string,
  input: CreateSettlementInput,
): Promise<SettlementDto> => {
  await assertGroupMember(db, userId, input.groupId);

  // Recording a payment between two other people is not something a member
  // should be able to do silently; it moves money in the ledger on their behalf.
  if (userId !== input.fromUserId && userId !== input.toUserId) {
    throw ApiError.forbidden('you can only record a settlement you are part of');
  }

  const group = await db.group.findFirstOrThrow({
    where: { id: input.groupId, deletedAt: null },
  });
  const groupCurrency = asCurrencyCode(group.currency);

  if (input.amount.currency !== groupCurrency) {
    throw ApiError.validation({
      amount: [`this group is in ${groupCurrency}, not ${input.amount.currency}`],
    });
  }

  const members = await db.groupMember.findMany({
    where: { groupId: input.groupId, userId: { in: [input.fromUserId, input.toUserId] }, leftAt: null },
    select: { userId: true },
  });
  if (members.length !== 2) {
    throw ApiError.validation({ toUserId: ['both people must be members of this group'] });
  }

  const amount = toDomainMoney(input.amount, 'amount');

  try {
    return await db.$transaction(async (tx) => {
      const created = await tx.settlement.create({
        data: {
          id: input.id,
          groupId: input.groupId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          currency: amount.currency,
          amountMinor: toMinorBigInt(amount),
          method: input.method,
          externalRef: input.externalRef ?? null,
          note: input.note ?? null,
          settledAt: new Date(input.settledAt),
          recordedById: userId,
          // Recording your own payment does not confirm it; the payee does that.
          confirmedAt: userId === input.toUserId ? new Date() : null,
          confirmedById: userId === input.toUserId ? userId : null,
        },
      });

      await tx.activityEvent.create({
        data: {
          actorId: userId,
          groupId: input.groupId,
          subjectType: 'SETTLEMENT',
          subjectId: created.id,
          verb: 'SETTLEMENT_RECORDED',
          payload: { amount: toMoneyDto(amount) } as Prisma.InputJsonValue,
        },
      });

      return toSettlementDto(created);
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    ) {
      throw ApiError.conflict('a settlement with that id already exists');
    }
    throw error;
  }
};

const loadForCaller = async (db: Db, userId: string, settlementId: string) => {
  const settlement = await db.settlement.findUnique({ where: { id: settlementId } });
  if (settlement === null || settlement.groupId === null) {
    throw ApiError.notFound('no such settlement');
  }

  await assertGroupMember(db, userId, settlement.groupId).catch(() => {
    throw ApiError.notFound('no such settlement');
  });

  return settlement;
};

export const listGroupSettlements = async (
  db: Db,
  userId: string,
  groupId: string,
): Promise<SettlementDto[]> => {
  await assertGroupMember(db, userId, groupId);
  const rows = await db.settlement.findMany({
    where: { groupId, deletedAt: null },
    orderBy: [{ settledAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map(toSettlementDto);
};

/** Two-sided confirmation (§6.2): only the payee can say the money arrived. */
export const confirmSettlement = async (
  db: Db,
  userId: string,
  settlementId: string,
): Promise<SettlementDto> => {
  const settlement = await loadForCaller(db, userId, settlementId);
  if (settlement.deletedAt !== null) throw ApiError.notFound('no such settlement');

  if (settlement.toUserId !== userId) {
    throw ApiError.forbidden('only the person who received the money can confirm it');
  }
  if (settlement.confirmedAt !== null) {
    return toSettlementDto(settlement);
  }

  const updated = await db.settlement.update({
    where: { id: settlementId },
    data: { confirmedAt: new Date(), confirmedById: userId },
  });
  return toSettlementDto(updated);
};

export const deleteSettlement = async (
  db: Db,
  userId: string,
  settlementId: string,
): Promise<void> => {
  const settlement = await loadForCaller(db, userId, settlementId);
  if (settlement.deletedAt !== null) return;

  // Whoever recorded it can undo it. The payee cannot delete a payment they
  // have already confirmed receiving — that would rewrite an agreed fact.
  if (settlement.recordedById !== userId) {
    throw ApiError.forbidden('only the person who recorded this settlement can remove it');
  }
  if (settlement.confirmedAt !== null && settlement.confirmedById !== userId) {
    throw ApiError.conflict('this settlement has been confirmed by the other party');
  }

  await db.settlement.update({
    where: { id: settlementId },
    data: { deletedAt: new Date() },
  });
};
