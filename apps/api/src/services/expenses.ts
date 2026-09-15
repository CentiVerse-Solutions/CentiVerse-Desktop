import type { Prisma } from '@prisma/client';
import { computeShares, isErr, type Money, type SplitStrategy } from '@centiverse/core';
import type {
  CreateExpenseInput,
  ExpenseDto,
  SplitStrategyDto,
  UpdateExpenseInput,
} from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { fromMinor, toMinorBigInt } from '../db/money';
import { asCurrencyCode, toDomainMoney, toMoneyDto } from '../lib/money';
import { ApiError } from '../lib/problem';
import { decodeCursor, encodeCursor, takePage } from '../lib/cursor';
import { assertCanMutateExpense, assertGroupMember } from './authorization';

/**
 * The ledger's write path.
 *
 * Non-negotiable 2: shares are computed by `@centiverse/core` and nowhere else.
 * This module never divides an amount — it builds a `SplitInput`, calls
 * `computeShares`, and writes whatever comes back. That is also what makes
 * invariant 4 true: the client ran the identical function to draw its preview.
 */

type ExpenseWithParts = Prisma.ExpenseGetPayload<{ include: { payers: true; shares: true } }>;

/**
 * The DTO and the domain strategy are structurally identical except that the
 * contract's currency is a plain `string`. Rebuilding it element by element is
 * what narrows those to `CurrencyCode` and rejects an unknown one at the edge.
 */
const toDomainStrategy = (dto: SplitStrategyDto): SplitStrategy => {
  switch (dto.kind) {
    case 'EQUAL':
      return { kind: 'EQUAL', participants: dto.participants };
    case 'EXACT':
      return {
        kind: 'EXACT',
        shares: dto.shares.map((s) => ({
          userId: s.userId,
          amount: toDomainMoney(s.amount, 'splitStrategy.shares'),
        })),
      };
    case 'PERCENT':
      return { kind: 'PERCENT', shares: dto.shares };
    case 'SHARES':
      return { kind: 'SHARES', shares: dto.shares };
    case 'ADJUSTMENT':
      return {
        kind: 'ADJUSTMENT',
        participants: dto.participants,
        adjustments: dto.adjustments.map((a) => ({
          userId: a.userId,
          delta: toDomainMoney(a.delta, 'splitStrategy.adjustments'),
        })),
      };
    case 'ITEMIZED':
      return {
        kind: 'ITEMIZED',
        items: dto.items.map((i) => ({
          amount: toDomainMoney(i.amount, 'splitStrategy.items'),
          participants: i.participants,
        })),
        ...(dto.tax === undefined ? {} : { tax: toDomainMoney(dto.tax, 'splitStrategy.tax') }),
        ...(dto.tip === undefined ? {} : { tip: toDomainMoney(dto.tip, 'splitStrategy.tip') }),
      };
  }
};

/** Everyone the strategy names, for the membership check below. */
const participantsOf = (dto: SplitStrategyDto): string[] => {
  switch (dto.kind) {
    case 'EQUAL':
      return [...dto.participants];
    case 'EXACT':
    case 'PERCENT':
    case 'SHARES':
      return dto.shares.map((s) => s.userId);
    case 'ADJUSTMENT':
      return [...dto.participants];
    case 'ITEMIZED':
      return [...new Set(dto.items.flatMap((i) => i.participants))];
  }
};

const toExpenseDto = (row: ExpenseWithParts): ExpenseDto => {
  const currency = row.currency.trim();
  return {
    id: row.id,
    groupId: row.groupId,
    description: row.description,
    total: toMoneyDto(fromMinor(row.totalMinor, currency)),
    date: row.expenseDate.toISOString(),
    categoryId: row.categoryId,
    notes: row.notes,
    payers: row.payers.map((p) => ({
      userId: p.userId,
      amount: toMoneyDto(fromMinor(p.amountMinor, currency)),
    })),
    shares: row.shares.map((s) => ({
      userId: s.userId,
      amount: toMoneyDto(fromMinor(s.amountMinor, currency)),
    })),
    splitStrategy: row.splitStrategy as SplitStrategyDto,
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
};

/**
 * Runs the split and checks everything that must be true before a row is
 * written. Shared by create and update so an edit cannot be validated more
 * loosely than a creation.
 */
const resolveShares = (
  total: Money,
  payers: ReadonlyArray<{ userId: string; amount: Money }>,
  strategy: SplitStrategyDto,
): Array<{ userId: string; amount: Money }> => {
  const result = computeShares({ total, payers, strategy: toDomainStrategy(strategy) });

  if (isErr(result)) {
    // A split that does not balance is the caller's error, not a server fault:
    // surface the domain's own message rather than a generic 500.
    throw ApiError.validation({ splitStrategy: [result.error.message] });
  }
  return [...result.value];
};

const assertEveryoneIsAMember = async (
  db: Db,
  groupId: string,
  userIds: readonly string[],
): Promise<void> => {
  const unique = [...new Set(userIds)];
  const members = await db.groupMember.findMany({
    where: { groupId, userId: { in: unique }, leftAt: null },
    select: { userId: true },
  });

  const present = new Set(members.map((m) => m.userId));
  const missing = unique.filter((id) => !present.has(id));
  if (missing.length > 0) {
    // Names the count, not the ids: echoing an id back would confirm whether an
    // arbitrary user exists (invariant 7's reasoning applied to people).
    throw ApiError.validation({
      splitStrategy: [`${missing.length} of the people named are not members of this group`],
    });
  }
};

/** §6.2: activity rows are written in the same transaction as the mutation. */
const recordActivity = async (
  tx: Prisma.TransactionClient,
  actorId: string,
  groupId: string | null,
  verb: string,
  subjectId: string,
  payload: Prisma.InputJsonValue,
): Promise<void> => {
  await tx.activityEvent.create({
    data: { actorId, groupId, subjectType: 'EXPENSE', subjectId, verb, payload },
  });
};

export const createExpense = async (
  db: Db,
  userId: string,
  input: CreateExpenseInput,
): Promise<ExpenseDto> => {
  if (input.groupId === null) {
    // A 1:1 expense has no group to authorize against; it needs the friendship
    // graph, which arrives with the /v1/friends endpoints. Refusing explicitly
    // beats shipping a write path with no authorization on it.
    throw ApiError.validation({
      groupId: ['expenses outside a group are not supported yet'],
    });
  }

  await assertGroupMember(db, userId, input.groupId);

  const group = await db.group.findFirstOrThrow({
    where: { id: input.groupId, deletedAt: null },
  });
  const groupCurrency = asCurrencyCode(group.currency);

  // ADR 0002: one currency per group. An expense in another currency would make
  // every balance in the group meaningless.
  if (input.total.currency !== groupCurrency) {
    throw ApiError.validation({
      total: [`this group is in ${groupCurrency}, not ${input.total.currency}`],
    });
  }

  const total = toDomainMoney(input.total, 'total');
  const payers = input.payers.map((p) => ({
    userId: p.userId,
    amount: toDomainMoney(p.amount, 'payers'),
  }));

  await assertEveryoneIsAMember(db, input.groupId, [
    ...payers.map((p) => p.userId),
    ...participantsOf(input.splitStrategy),
  ]);

  const shares = resolveShares(total, payers, input.splitStrategy);

  try {
    const created = await db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          id: input.id,
          groupId: input.groupId,
          description: input.description,
          notes: input.notes ?? null,
          currency: total.currency,
          totalMinor: toMinorBigInt(total),
          expenseDate: new Date(input.date),
          categoryId: input.categoryId ?? null,
          splitStrategy: input.splitStrategy as unknown as Prisma.InputJsonValue,
          createdById: userId,
        },
      });

      await tx.expensePayer.createMany({
        data: payers.map((p) => ({
          expenseId: expense.id,
          userId: p.userId,
          amountMinor: toMinorBigInt(p.amount),
        })),
      });

      await tx.expenseShare.createMany({
        data: shares.map((s) => ({
          expenseId: expense.id,
          userId: s.userId,
          amountMinor: toMinorBigInt(s.amount),
        })),
      });

      await recordActivity(tx, userId, input.groupId, 'EXPENSE_CREATED', expense.id, {
        description: input.description,
        total: toMoneyDto(total),
      });

      return tx.expense.findUniqueOrThrow({
        where: { id: expense.id },
        include: { payers: true, shares: true },
      });
    });

    return toExpenseDto(created);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw ApiError.conflict('an expense with that id already exists');
    }
    throw error;
  }
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'P2002';

/**
 * Loads an expense and proves the caller may see it. Returns the membership too,
 * because the mutation paths need it for the creator-or-admin rule (§6.5).
 */
const loadForCaller = async (db: Db, userId: string, expenseId: string) => {
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    include: { payers: true, shares: true },
  });

  // An expense the caller cannot see and an expense that does not exist must be
  // indistinguishable, so both fall through to the same 404 below.
  if (expense === null || expense.groupId === null) {
    throw ApiError.notFound('no such expense');
  }

  const membership = await assertGroupMember(db, userId, expense.groupId).catch(() => {
    throw ApiError.notFound('no such expense');
  });

  return { expense, membership };
};

export const getExpense = async (
  db: Db,
  userId: string,
  expenseId: string,
): Promise<ExpenseDto> => {
  const { expense } = await loadForCaller(db, userId, expenseId);
  if (expense.deletedAt !== null) throw ApiError.notFound('no such expense');
  return toExpenseDto(expense);
};

export const listGroupExpenses = async (
  db: Db,
  userId: string,
  groupId: string,
  options: { cursor?: string | undefined; limit: number },
): Promise<{ items: ExpenseDto[]; nextCursor: string | null }> => {
  await assertGroupMember(db, userId, groupId);

  const cursor = options.cursor === undefined ? undefined : decodeCursor(options.cursor);

  const rows = await db.expense.findMany({
    where: {
      groupId,
      deletedAt: null,
      // Keyset: strictly older than the cursor, with the id breaking ties so a
      // page boundary inside one timestamp cannot repeat or skip a row.
      ...(cursor === undefined
        ? {}
        : {
            OR: [
              { expenseDate: { lt: cursor.timestamp } },
              { expenseDate: cursor.timestamp, id: { lt: cursor.id } },
            ],
          }),
    },
    include: { payers: true, shares: true },
    orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
    take: options.limit + 1,
  });

  const page = takePage(rows, options.limit, (row) => encodeCursor(row.expenseDate, row.id));
  return { items: page.items.map(toExpenseDto), nextCursor: page.nextCursor };
};

export const updateExpense = async (
  db: Db,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<ExpenseDto> => {
  const { expense, membership } = await loadForCaller(db, userId, expenseId);
  if (expense.deletedAt !== null) throw ApiError.notFound('no such expense');

  assertCanMutateExpense(membership, expense.createdById);

  // §6.3: "Every update sends the entity's version; a mismatch returns 409 with
  // the current server state so the client can present a real conflict UI."
  if (input.version !== expense.version) {
    throw ApiError.versionConflict(
      toExpenseDto(expense),
      `this expense has changed since you loaded it (you sent version ${input.version}, current is ${expense.version})`,
    );
  }

  const groupId = expense.groupId!;
  const currency = asCurrencyCode(expense.currency);

  const total =
    input.total === undefined ? fromMinor(expense.totalMinor, currency) : toDomainMoney(input.total, 'total');

  if (total.currency !== currency) {
    throw ApiError.validation({ total: [`this expense is in ${currency}, not ${total.currency}`] });
  }

  const payers =
    input.payers === undefined
      ? expense.payers.map((p) => ({ userId: p.userId, amount: fromMinor(p.amountMinor, currency) }))
      : input.payers.map((p) => ({ userId: p.userId, amount: toDomainMoney(p.amount, 'payers') }));

  const strategy = input.splitStrategy ?? (expense.splitStrategy as SplitStrategyDto);

  await assertEveryoneIsAMember(db, groupId, [
    ...payers.map((p) => p.userId),
    ...participantsOf(strategy),
  ]);

  // Recomputed even when only the description changed: one code path means an
  // edit can never leave shares that disagree with the strategy beside them.
  const shares = resolveShares(total, payers, strategy);

  const updated = await db.$transaction(async (tx) => {
    // Invariant 5: the prior state is kept, not overwritten.
    await tx.expenseRevision.create({
      data: {
        expenseId: expense.id,
        version: expense.version,
        snapshot: toExpenseDto(expense) as unknown as Prisma.InputJsonValue,
        changedById: userId,
      },
    });

    // Children are replaced wholesale. The constraint trigger is DEFERRED, so
    // the moment between the delete and the insert is legal (§6.2).
    await tx.expensePayer.deleteMany({ where: { expenseId: expense.id } });
    await tx.expenseShare.deleteMany({ where: { expenseId: expense.id } });

    await tx.expensePayer.createMany({
      data: payers.map((p) => ({
        expenseId: expense.id,
        userId: p.userId,
        amountMinor: toMinorBigInt(p.amount),
      })),
    });
    await tx.expenseShare.createMany({
      data: shares.map((s) => ({
        expenseId: expense.id,
        userId: s.userId,
        amountMinor: toMinorBigInt(s.amount),
      })),
    });

    const data: Prisma.ExpenseUpdateInput = {
      version: { increment: 1 },
      totalMinor: toMinorBigInt(total),
      splitStrategy: strategy as unknown as Prisma.InputJsonValue,
    };
    if (input.description !== undefined) data.description = input.description;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.date !== undefined) data.expenseDate = new Date(input.date);
    if (input.categoryId !== undefined) {
      data.category = input.categoryId === null ? { disconnect: true } : { connect: { id: input.categoryId } };
    }

    await tx.expense.update({ where: { id: expense.id }, data });

    await recordActivity(tx, userId, groupId, 'EXPENSE_UPDATED', expense.id, {
      fromVersion: expense.version,
    });

    return tx.expense.findUniqueOrThrow({
      where: { id: expense.id },
      include: { payers: true, shares: true },
    });
  });

  return toExpenseDto(updated);
};

/** Soft delete, with a revision, because history is never silently rewritten. */
export const deleteExpense = async (
  db: Db,
  userId: string,
  expenseId: string,
): Promise<void> => {
  const { expense, membership } = await loadForCaller(db, userId, expenseId);
  if (expense.deletedAt !== null) return; // already gone; deleting twice is not an error

  assertCanMutateExpense(membership, expense.createdById);

  await db.$transaction(async (tx) => {
    await tx.expenseRevision.create({
      data: {
        expenseId: expense.id,
        version: expense.version,
        snapshot: toExpenseDto(expense) as unknown as Prisma.InputJsonValue,
        changedById: userId,
        reason: 'deleted',
      },
    });

    await tx.expense.update({
      where: { id: expense.id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });

    await recordActivity(tx, userId, expense.groupId, 'EXPENSE_DELETED', expense.id, {
      description: expense.description,
    });
  });
};

export interface RevisionDto {
  id: string;
  version: number;
  changedBy: string;
  changedAt: string;
  reason: string | null;
  snapshot: unknown;
}

export const listRevisions = async (
  db: Db,
  userId: string,
  expenseId: string,
): Promise<RevisionDto[]> => {
  await loadForCaller(db, userId, expenseId);

  const revisions = await db.expenseRevision.findMany({
    where: { expenseId },
    orderBy: { version: 'desc' },
  });

  return revisions.map((r) => ({
    id: r.id,
    version: r.version,
    changedBy: r.changedById,
    changedAt: r.changedAt.toISOString(),
    reason: r.reason,
    snapshot: r.snapshot,
  }));
};
