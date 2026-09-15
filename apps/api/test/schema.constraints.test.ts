import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import { TEST_DATABASE_URL } from './setup/testDb';

/**
 * Proves the database enforces what §6.2 says it enforces.
 *
 * A note on the assertions: Prisma reports a unique violation by the columns
 * involved rather than by the index name, so the tests below assert that the
 * write was rejected, and the final block asserts separately that the named
 * index doing the rejecting is still there.
 *
 * Two reasons this suite exists. First, invariant 1 is meant to hold "in the
 * domain, in tests, and by a database constraint trigger" — the third of those
 * is only real if something exercises it. Second, the objects under test are
 * hand-written SQL that Prisma does not model, so a future `migrate dev` could
 * propose dropping them; if that ever happens, these tests fail loudly rather
 * than the ledger silently losing its last line of defence.
 */

const db = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

/** Minimal fixture: a user, a group, and that user as its only member. */
const seedGroup = async () => {
  const userId = uuidv7();
  const groupId = uuidv7();
  await db.user.create({
    data: { id: userId, email: `${userId}@test.local`, displayName: 'Payer' },
  });
  await db.group.create({
    data: { id: groupId, name: 'Trip', currency: 'INR', createdById: userId },
  });
  await db.groupMember.create({ data: { groupId, userId, role: 'OWNER' } });
  return { userId, groupId };
};

const expenseData = (groupId: string, userId: string, totalMinor: bigint) => ({
  id: uuidv7(),
  groupId,
  description: 'Dinner',
  currency: 'INR',
  totalMinor,
  expenseDate: new Date(),
  splitStrategy: { kind: 'EQUAL' },
  createdById: userId,
});

beforeAll(async () => {
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
});

describe('invariant 1 — the database rejects a ledger that does not balance', () => {
  it('accepts an expense whose payers and shares both sum to the total', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    await db.$transaction(async (tx) => {
      await tx.expense.create({ data: expense });
      await tx.expensePayer.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
      await tx.expenseShare.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
    });

    const stored = await db.expense.findUniqueOrThrow({ where: { id: expense.id } });
    expect(stored.totalMinor).toBe(10_000n);
  });

  it('rejects shares that do not sum to the total', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    await expect(
      db.$transaction(async (tx) => {
        await tx.expense.create({ data: expense });
        await tx.expensePayer.create({
          data: { expenseId: expense.id, userId, amountMinor: 10_000n },
        });
        // One paisa short. This is exactly what a float-based allocator produces.
        await tx.expenseShare.create({
          data: { expenseId: expense.id, userId, amountMinor: 9_999n },
        });
      }),
    ).rejects.toThrow(/sum\(shares\)/);
  });

  it('rejects payers that do not sum to the total', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    await expect(
      db.$transaction(async (tx) => {
        await tx.expense.create({ data: expense });
        await tx.expensePayer.create({
          data: { expenseId: expense.id, userId, amountMinor: 5_000n },
        });
        await tx.expenseShare.create({
          data: { expenseId: expense.id, userId, amountMinor: 10_000n },
        });
      }),
    ).rejects.toThrow(/sum\(payers\)/);
  });

  it('rejects an expense created with no shares at all', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    await expect(
      db.$transaction(async (tx) => {
        await tx.expense.create({ data: expense });
        await tx.expensePayer.create({
          data: { expenseId: expense.id, userId, amountMinor: 10_000n },
        });
      }),
    ).rejects.toThrow(/sum\(shares\)/);
  });

  it('rejects editing the total without editing the shares', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    await db.$transaction(async (tx) => {
      await tx.expense.create({ data: expense });
      await tx.expensePayer.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
      await tx.expenseShare.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
    });

    await expect(
      db.expense.update({ where: { id: expense.id }, data: { totalMinor: 12_000n } }),
    ).rejects.toThrow(/invariant 1/);
  });

  it('is deferred, so the intermediate state inside a transaction is legal', async () => {
    const { userId, groupId } = await seedGroup();
    const expense = expenseData(groupId, userId, 10_000n);

    // The expense row exists here with no shares, which would fail an immediate
    // check. The whole point of DEFERRABLE INITIALLY DEFERRED is that a correct
    // multi-statement write is not obliged to be correct at every statement.
    await db.$transaction(async (tx) => {
      await tx.expense.create({ data: expense });
      const midway = await tx.expense.findUniqueOrThrow({ where: { id: expense.id } });
      expect(midway.totalMinor).toBe(10_000n);
      await tx.expensePayer.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
      await tx.expenseShare.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
    });
  });

  it('allows a negative share, which an ADJUSTMENT split can legitimately produce', async () => {
    const { userId, groupId } = await seedGroup();
    const other = uuidv7();
    await db.user.create({ data: { id: other, email: `${other}@test.local`, displayName: 'Other' } });
    await db.groupMember.create({ data: { groupId, userId: other } });

    const expense = expenseData(groupId, userId, 10_000n);
    await db.$transaction(async (tx) => {
      await tx.expense.create({ data: expense });
      await tx.expensePayer.create({
        data: { expenseId: expense.id, userId, amountMinor: 10_000n },
      });
      await tx.expenseShare.createMany({
        data: [
          { expenseId: expense.id, userId, amountMinor: 11_000n },
          { expenseId: expense.id, userId: other, amountMinor: -1_000n },
        ],
      });
    });

    const shares = await db.expenseShare.findMany({ where: { expenseId: expense.id } });
    expect(shares.reduce((acc, s) => acc + s.amountMinor, 0n)).toBe(10_000n);
  });
});

describe('CHECK constraints (§6.2)', () => {
  it('rejects a zero or negative expense total', async () => {
    const { userId, groupId } = await seedGroup();
    await expect(
      db.expense.create({ data: expenseData(groupId, userId, 0n) }),
    ).rejects.toThrow(/expenses_total_minor_positive/);
  });

  it('rejects a settlement to oneself', async () => {
    const { userId, groupId } = await seedGroup();
    await expect(
      db.settlement.create({
        data: {
          groupId,
          fromUserId: userId,
          toUserId: userId,
          currency: 'INR',
          amountMinor: 500n,
          settledAt: new Date(),
          recordedById: userId,
        },
      }),
    ).rejects.toThrow(/settlements_distinct_parties/);
  });

  it('rejects a non-positive settlement amount', async () => {
    const { userId, groupId } = await seedGroup();
    const payee = uuidv7();
    await db.user.create({ data: { id: payee, email: `${payee}@test.local`, displayName: 'Payee' } });
    await expect(
      db.settlement.create({
        data: {
          groupId,
          fromUserId: userId,
          toUserId: payee,
          currency: 'INR',
          amountMinor: 0n,
          settledAt: new Date(),
          recordedById: userId,
        },
      }),
    ).rejects.toThrow(/settlements_amount_positive/);
  });
});

describe('placeholder members (§12 #9, ADR 0004)', () => {
  it('allows many users with no email', async () => {
    await db.user.create({ data: { id: uuidv7(), displayName: 'Placeholder A' } });
    await db.user.create({ data: { id: uuidv7(), displayName: 'Placeholder B' } });

    const unclaimed = await db.user.count({ where: { email: null, claimedAt: null } });
    expect(unclaimed).toBeGreaterThanOrEqual(2);
  });

  it('still refuses two live users sharing an email', async () => {
    const email = `${uuidv7()}@test.local`;
    await db.user.create({ data: { id: uuidv7(), email, displayName: 'First' } });
    await expect(
      db.user.create({ data: { id: uuidv7(), email, displayName: 'Second' } }),
    ).rejects.toThrow(/Unique constraint failed/);
  });

  it('frees the address again once the holder is soft-deleted', async () => {
    const email = `${uuidv7()}@test.local`;
    const first = uuidv7();
    await db.user.create({ data: { id: first, email, displayName: 'First' } });
    await db.user.update({ where: { id: first }, data: { deletedAt: new Date() } });

    const second = await db.user.create({ data: { id: uuidv7(), email, displayName: 'Second' } });
    expect(second.email).toBe(email);
  });

  it('treats email as case-insensitive (citext)', async () => {
    const local = uuidv7();
    await db.user.create({ data: { id: uuidv7(), email: `${local}@test.local`, displayName: 'Lower' } });
    await expect(
      db.user.create({ data: { id: uuidv7(), email: `${local.toUpperCase()}@TEST.LOCAL`, displayName: 'Upper' } }),
    ).rejects.toThrow(/Unique constraint failed/);
  });
});

describe('friendships are one per pair, in either direction (§6.2)', () => {
  it('rejects the mirrored request', async () => {
    const a = uuidv7();
    const b = uuidv7();
    await db.user.create({ data: { id: a, email: `${a}@test.local`, displayName: 'A' } });
    await db.user.create({ data: { id: b, email: `${b}@test.local`, displayName: 'B' } });

    await db.friendship.create({
      data: { requesterId: a, addresseeId: b, status: 'PENDING' },
    });

    await expect(
      db.friendship.create({ data: { requesterId: b, addresseeId: a, status: 'PENDING' } }),
    ).rejects.toThrow(/Unique constraint failed/);
  });
});

describe('the hand-written objects still exist', () => {
  it('has all three constraint triggers', async () => {
    const rows = await db.$queryRawUnsafe<{ tgname: string }[]>(
      `SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE '%sum_check' ORDER BY tgname`,
    );
    expect(rows.map((r) => r.tgname)).toEqual([
      'expense_payers_sum_check',
      'expense_shares_sum_check',
      'expenses_sum_check',
    ]);
  });

  it('has the partial and functional indexes', async () => {
    const rows = await db.$queryRawUnsafe<{ indexname: string }[]>(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname IN
         ('users_email_live_key','friendships_pair_key','expenses_group_date_live_idx','settlements_group_settled_live_idx')
       ORDER BY indexname`,
    );
    expect(rows.map((r) => r.indexname)).toEqual([
      'expenses_group_date_live_idx',
      'friendships_pair_key',
      'settlements_group_settled_live_idx',
      'users_email_live_key',
    ]);
  });
});
