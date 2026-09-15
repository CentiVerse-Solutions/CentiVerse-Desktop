import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import { money } from '@centiverse/core';
import { MoneySchema } from '@centiverse/contracts';
import { fromMinor, toMinorBigInt } from '../src/db/money';
import { TEST_DATABASE_URL } from './setup/testDb';

/**
 * ADR 0004 accepted one known cost of choosing Prisma: Postgres `bigint` maps to
 * JavaScript `BigInt`, which does not JSON-serialise and does not satisfy
 * `MoneySchema`. The mitigation was "a single conversion boundary plus a test
 * that a money value survives a round trip through the database unchanged".
 * This is that test.
 */

const db = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

describe('the BigInt boundary', () => {
  it('converts a stored bigint into a Money that satisfies the wire contract', () => {
    const value = fromMinor(123_456n, 'INR');
    expect(value).toEqual({ minor: 123_456, currency: 'INR' });
    expect(MoneySchema.safeParse(value).success).toBe(true);
  });

  it('refuses to silently round a value past MAX_SAFE_INTEGER', () => {
    const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    expect(() => fromMinor(tooBig, 'INR')).toThrow(/safe integer range/);
  });

  it('refuses a currency code the domain does not know', () => {
    expect(() => fromMinor(100n, 'XYZ')).toThrow(/unknown currency code/);
  });

  it('round-trips through Postgres unchanged', async () => {
    const userId = uuidv7();
    const groupId = uuidv7();
    await db.user.create({ data: { id: userId, email: `${userId}@test.local`, displayName: 'RT' } });
    await db.group.create({ data: { id: groupId, name: 'RT', currency: 'INR', createdById: userId } });
    await db.groupMember.create({ data: { groupId, userId } });

    // An amount with a non-zero remainder under a three-way split, so a float
    // path would visibly disagree.
    const original = money(100_001, 'INR');
    const expenseId = uuidv7();

    await db.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          id: expenseId,
          groupId,
          description: 'Round trip',
          currency: original.currency,
          totalMinor: toMinorBigInt(original),
          expenseDate: new Date(),
          splitStrategy: { kind: 'EQUAL' },
          createdById: userId,
        },
      });
      await tx.expensePayer.create({
        data: { expenseId, userId, amountMinor: toMinorBigInt(original) },
      });
      await tx.expenseShare.create({
        data: { expenseId, userId, amountMinor: toMinorBigInt(original) },
      });
    });

    const row = await db.expense.findUniqueOrThrow({ where: { id: expenseId } });
    const readBack = fromMinor(row.totalMinor, row.currency.trim());

    expect(readBack).toEqual(original);
    expect(JSON.parse(JSON.stringify(readBack))).toEqual({ minor: 100_001, currency: 'INR' });

    await db.$disconnect();
  });
});
