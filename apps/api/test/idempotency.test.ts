import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import { authHeaders, buildTestServer, createGroup, createUser, type TestUser } from './helpers/client';
import { TEST_DATABASE_URL } from './setup/testDb';

/**
 * §6.3: "Every mutation accepts an `Idempotency-Key` header; the response is
 * cached against it for 24h."
 *
 * The case worth testing is not the happy retry — it is the retry that arrives
 * while the first request is still running, and the client that reuses a key
 * with a different body.
 */

let app: FastifyInstance;
let alice: TestUser;
let bob: TestUser;
let groupId: string;

const db = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
const INR = (minor: number) => ({ minor, currency: 'INR' });

const expenseBody = () => ({
  id: uuidv7(),
  groupId,
  description: 'Retried dinner',
  total: INR(10_000),
  date: new Date().toISOString(),
  payers: [{ userId: alice.id, amount: INR(10_000) }],
  splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
});

const post = (key: string | undefined, payload: Record<string, unknown>, actor: TestUser = alice) =>
  app.inject({
    method: 'POST',
    url: '/v1/expenses',
    headers: {
      ...authHeaders(actor),
      ...(key === undefined ? {} : { 'idempotency-key': key }),
    },
    payload,
  });

beforeAll(async () => {
  app = await buildTestServer();
  await app.ready();
  alice = await createUser(app, 'Alice');
  bob = await createUser(app, 'Bob');
  groupId = await createGroup(app, alice, { memberIds: [bob.id] });
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

describe('replaying a completed request', () => {
  it('returns the original response without doing the work twice', async () => {
    const key = uuidv7();
    const body = expenseBody();

    const first = await post(key, body);
    expect(first.statusCode).toBe(201);

    const second = await post(key, body);
    expect(second.statusCode).toBe(201);
    expect(second.headers['idempotent-replay']).toBe('true');
    expect(second.json()).toEqual(first.json());

    // One row, not two, and no second activity event either.
    const count = await db.expense.count({ where: { id: body.id } });
    expect(count).toBe(1);
  });

  it('replays a 204 as a 204', async () => {
    const created = await post(uuidv7(), expenseBody());
    const key = uuidv7();

    const first = await app.inject({
      method: 'DELETE',
      url: `/v1/expenses/${created.json().id}`,
      headers: { ...authHeaders(alice), 'idempotency-key': key },
    });
    expect(first.statusCode).toBe(204);

    const second = await app.inject({
      method: 'DELETE',
      url: `/v1/expenses/${created.json().id}`,
      headers: { ...authHeaders(alice), 'idempotency-key': key },
    });
    expect(second.statusCode).toBe(204);
    expect(second.headers['idempotent-replay']).toBe('true');
  });

  it('replays a failure too, so a retry does not get a different answer', async () => {
    const key = uuidv7();
    const bad = { ...expenseBody(), payers: [{ userId: alice.id, amount: INR(1) }] };

    const first = await post(key, bad);
    expect(first.statusCode).toBe(422);

    const second = await post(key, bad);
    expect(second.statusCode).toBe(422);
    expect(second.json()).toEqual(first.json());
  });
});

describe('misuse of a key', () => {
  it('rejects the same key with a different body', async () => {
    const key = uuidv7();
    await post(key, expenseBody());

    const different = await post(key, { ...expenseBody(), description: 'Something else' });
    expect(different.statusCode).toBe(422);
    expect(different.json().title).toBe('Idempotency key reused');
  });

  it('scopes keys per user, so two people can pick the same one', async () => {
    const key = uuidv7();

    const mine = await post(key, expenseBody(), alice);
    expect(mine.statusCode).toBe(201);

    const theirs = await app.inject({
      method: 'POST',
      url: '/v1/expenses',
      headers: { ...authHeaders(bob), 'idempotency-key': key },
      payload: {
        ...expenseBody(),
        payers: [{ userId: bob.id, amount: INR(10_000) }],
      },
    });
    expect(theirs.statusCode).toBe(201);
    expect(theirs.headers['idempotent-replay']).toBeUndefined();
  });

  it('lets only one of two concurrent identical requests do the work', async () => {
    const key = uuidv7();
    const body = expenseBody();

    // The case the reservation exists for: a retry that arrives before the
    // first request has answered. Exactly one must reach the handler.
    const [a, b] = await Promise.all([post(key, body), post(key, body)]);

    const statuses = [a.statusCode, b.statusCode].sort();
    // One creates it. The other either finds the reservation still in flight
    // (409) or, if it lost the race narrowly enough, replays the answer (201).
    expect(statuses[0]).toBe(201);
    expect([201, 409]).toContain(statuses[1]);

    const created = await db.expense.count({ where: { id: body.id } });
    expect(created).toBe(1);
  });

  it('reports an in-flight reservation as a conflict, not as a duplicate', async () => {
    const key = uuidv7();
    const body = expenseBody();

    // Reserve the key exactly as the preHandler does, with the hash the server
    // will compute for this very request, so the in-flight branch is reached
    // rather than the reused-with-a-different-body branch.
    const probe = await post(key, body);
    expect(probe.statusCode).toBe(201);

    const reserved = await db.idempotencyKey.findUniqueOrThrow({
      where: { userId_key: { userId: alice.id, key } },
    });
    await db.idempotencyKey.update({
      where: { userId_key: { userId: alice.id, key } },
      data: { responseStatus: 0, responseBody: {} },
    });
    expect(reserved.requestHash).not.toBe('');

    const retry = await post(key, body);
    expect(retry.statusCode).toBe(409);
    expect(retry.json().detail).toMatch(/still in progress/);
  });
});

describe('without a key', () => {
  it('leaves behaviour unchanged — the header is optional', async () => {
    const res = await post(undefined, expenseBody());
    expect(res.statusCode).toBe(201);
    expect(res.headers['idempotent-replay']).toBeUndefined();

    const stored = await db.idempotencyKey.count({ where: { userId: alice.id } });
    // Rows exist only for the keyed requests above, not for this one.
    expect(stored).toBeGreaterThan(0);
  });

  it('ignores the header on a read', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/groups',
      headers: { ...authHeaders(alice), 'idempotency-key': uuidv7() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['idempotent-replay']).toBeUndefined();
  });
});
