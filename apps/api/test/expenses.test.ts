import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { uuidv7 } from 'uuidv7';
import { ExpenseSchema, SettlementSchema } from '@centiverse/contracts';
import { authHeaders, buildTestServer, createGroup, createUser, type TestUser } from './helpers/client';

/**
 * The ledger's write path, through HTTP.
 *
 * The assertions that matter are the ones about money: shares sum to the total
 * (invariant 1), net balances sum to zero (invariant 2), and the remainder lands
 * where `@centiverse/core` says it lands rather than wherever the database
 * happened to return rows (invariant 4).
 */

let app: FastifyInstance;
let alice: TestUser;
let bob: TestUser;
let carol: TestUser;
let outsider: TestUser;
let groupId: string;

const INR = (minor: number) => ({ minor, currency: 'INR' });

const postExpense = async (
  actor: TestUser,
  body: Record<string, unknown>,
): Promise<ReturnType<FastifyInstance['inject']>> =>
  app.inject({
    method: 'POST',
    url: '/v1/expenses',
    headers: authHeaders(actor),
    payload: body,
  });

const equalExpense = (overrides: Record<string, unknown> = {}) => ({
  id: uuidv7(),
  groupId,
  description: 'Dinner',
  total: INR(10_000),
  date: new Date().toISOString(),
  payers: [{ userId: alice.id, amount: INR(10_000) }],
  splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
  ...overrides,
});

beforeAll(async () => {
  app = await buildTestServer();
  await app.ready();

  alice = await createUser(app, 'Alice');
  bob = await createUser(app, 'Bob');
  carol = await createUser(app, 'Carol');
  outsider = await createUser(app, 'Outsider');
  groupId = await createGroup(app, alice, { memberIds: [bob.id, carol.id] });
});

afterAll(async () => {
  await app.close();
});

describe('creating an expense', () => {
  it('returns the contract shape with shares summing to the total', async () => {
    const res = await postExpense(alice, equalExpense());
    expect(res.statusCode).toBe(201);

    const parsed = ExpenseSchema.safeParse(res.json());
    expect(parsed.success).toBe(true);

    const body = res.json();
    expect(body.shares.reduce((a: number, s: { amount: { minor: number } }) => a + s.amount.minor, 0)).toBe(
      10_000,
    );
    expect(body.version).toBe(1);
  });

  it('puts the odd minor unit where core puts it, not where Postgres does', async () => {
    // 10001 paise across three people: 3333 each leaves 2 over. Every fractional
    // part is identical, so the tie-break is userId ASC (invariant 4).
    const res = await postExpense(alice, {
      ...equalExpense(),
      total: INR(10_001),
      payers: [{ userId: alice.id, amount: INR(10_001) }],
      splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id, carol.id] },
    });
    expect(res.statusCode).toBe(201);

    const shares = res.json().shares as { userId: string; amount: { minor: number } }[];
    expect(shares.reduce((a, s) => a + s.amount.minor, 0)).toBe(10_001);

    const byId = [...shares].sort((a, b) => (a.userId < b.userId ? -1 : 1));
    expect(byId.map((s) => s.amount.minor)).toEqual([3_334, 3_334, 3_333]);
  });

  it('accepts a PERCENT split in basis points', async () => {
    const res = await postExpense(alice, {
      ...equalExpense(),
      total: INR(10_000),
      payers: [{ userId: alice.id, amount: INR(10_000) }],
      splitStrategy: {
        kind: 'PERCENT',
        shares: [
          { userId: alice.id, bps: 6_000 },
          { userId: bob.id, bps: 4_000 },
        ],
      },
    });
    expect(res.statusCode).toBe(201);

    const shares = res.json().shares as { userId: string; amount: { minor: number } }[];
    expect(shares.find((s) => s.userId === alice.id)?.amount.minor).toBe(6_000);
    expect(shares.find((s) => s.userId === bob.id)?.amount.minor).toBe(4_000);
  });

  it('rejects percentages that do not add up, with the domain’s own message', async () => {
    const res = await postExpense(alice, {
      ...equalExpense(),
      splitStrategy: {
        kind: 'PERCENT',
        shares: [
          { userId: alice.id, bps: 5_000 },
          { userId: bob.id, bps: 4_000 },
        ],
      },
    });
    expect(res.statusCode).toBe(422);
  });

  it('rejects payers that do not sum to the total', async () => {
    const res = await postExpense(alice, {
      ...equalExpense(),
      payers: [{ userId: alice.id, amount: INR(9_000) }],
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.stringify(res.json())).toMatch(/payers sum to 9000/);
  });

  it('rejects a currency that is not the group’s (ADR 0002)', async () => {
    const res = await postExpense(alice, {
      ...equalExpense(),
      total: { minor: 10_000, currency: 'USD' },
      payers: [{ userId: alice.id, amount: { minor: 10_000, currency: 'USD' } }],
    });
    expect(res.statusCode).toBe(422);
    expect(JSON.stringify(res.json())).toMatch(/this group is in INR/);
  });

  it('refuses to name someone who is not in the group', async () => {
    const res = await postExpense(alice, {
      ...equalExpense(),
      splitStrategy: { kind: 'EQUAL', participants: [alice.id, outsider.id] },
    });
    expect(res.statusCode).toBe(422);
    // The id is not echoed back: that would confirm the account exists.
    expect(JSON.stringify(res.json())).not.toContain(outsider.id);
  });

  it('refuses a second expense with the same client-generated id', async () => {
    const body = equalExpense();
    expect((await postExpense(alice, body)).statusCode).toBe(201);
    expect((await postExpense(alice, body)).statusCode).toBe(409);
  });

  it('is not yet available outside a group, and says so', async () => {
    const res = await postExpense(alice, { ...equalExpense(), groupId: null });
    expect(res.statusCode).toBe(422);
    expect(JSON.stringify(res.json())).toMatch(/not supported yet/);
  });
});

describe('balances derived from the ledger', () => {
  it('sums to exactly zero and matches who paid (invariant 2)', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id] });

    await postExpense(alice, {
      id: uuidv7(),
      groupId: localGroup,
      description: 'Taxi',
      total: INR(10_000),
      date: new Date().toISOString(),
      payers: [{ userId: alice.id, amount: INR(10_000) }],
      splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${localGroup}/balances`,
      headers: authHeaders(alice),
    });

    const net = res.json().net as { userId: string; amount: { minor: number } }[];
    expect(net.reduce((a, b) => a + b.amount.minor, 0)).toBe(0);
    expect(net.find((b) => b.userId === alice.id)?.amount.minor).toBe(5_000);
    expect(net.find((b) => b.userId === bob.id)?.amount.minor).toBe(-5_000);

    const pairwise = res.json().pairwise as {
      fromUserId: string;
      toUserId: string;
      amount: { minor: number };
    }[];
    expect(pairwise).toEqual([
      { fromUserId: bob.id, toUserId: alice.id, amount: { minor: 5_000, currency: 'INR' } },
    ]);
  });

  it('returns to zero once a settlement covers the debt', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id] });
    await postExpense(alice, {
      id: uuidv7(),
      groupId: localGroup,
      description: 'Lunch',
      total: INR(10_000),
      date: new Date().toISOString(),
      payers: [{ userId: alice.id, amount: INR(10_000) }],
      splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
    });

    const settled = await app.inject({
      method: 'POST',
      url: '/v1/settlements',
      headers: authHeaders(bob),
      payload: {
        id: uuidv7(),
        groupId: localGroup,
        fromUserId: bob.id,
        toUserId: alice.id,
        amount: INR(5_000),
        method: 'UPI',
        settledAt: new Date().toISOString(),
      },
    });
    expect(settled.statusCode).toBe(201);
    expect(SettlementSchema.safeParse(settled.json()).success).toBe(true);

    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${localGroup}/balances`,
      headers: authHeaders(alice),
    });
    const net = res.json().net as { amount: { minor: number } }[];
    expect(net.every((b) => b.amount.minor === 0)).toBe(true);
    expect(res.json().pairwise).toEqual([]);
  });

  it('excludes a deleted expense from the balances', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id] });
    const created = await postExpense(alice, {
      id: uuidv7(),
      groupId: localGroup,
      description: 'Cancelled',
      total: INR(10_000),
      date: new Date().toISOString(),
      payers: [{ userId: alice.id, amount: INR(10_000) }],
      splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
    });

    await app.inject({
      method: 'DELETE',
      url: `/v1/expenses/${created.json().id}`,
      headers: authHeaders(alice),
    });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${localGroup}/balances`,
      headers: authHeaders(alice),
    });
    const net = res.json().net as { amount: { minor: number } }[];
    expect(net.every((b) => b.amount.minor === 0)).toBe(true);
  });
});

describe('editing an expense (§6.3 optimistic concurrency)', () => {
  it('increments the version and keeps the prior state as a revision', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    const patched = await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
      payload: { version: 1, description: 'Dinner, actually' },
    });

    expect(patched.statusCode).toBe(200);
    expect(patched.json().version).toBe(2);
    expect(patched.json().description).toBe('Dinner, actually');

    const revisions = await app.inject({
      method: 'GET',
      url: `/v1/expenses/${id}/revisions`,
      headers: authHeaders(alice),
    });
    expect(revisions.json()).toHaveLength(1);
    expect(revisions.json()[0].version).toBe(1);
    expect(revisions.json()[0].snapshot.description).toBe('Dinner');
  });

  it('returns 409 with the current server state on a stale version', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
      payload: { version: 1, description: 'First edit wins' },
    });

    const stale = await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
      payload: { version: 1, description: 'Second edit, stale' },
    });

    expect(stale.statusCode).toBe(409);
    // The client needs the server's version to render a real conflict UI.
    expect(stale.json().current.version).toBe(2);
    expect(stale.json().current.description).toBe('First edit wins');
  });

  it('recomputes the shares when the total changes', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    const patched = await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
      payload: {
        version: 1,
        total: INR(20_000),
        payers: [{ userId: alice.id, amount: INR(20_000) }],
      },
    });

    expect(patched.statusCode).toBe(200);
    const shares = patched.json().shares as { amount: { minor: number } }[];
    expect(shares.reduce((a, s) => a + s.amount.minor, 0)).toBe(20_000);
    expect(shares.every((s) => s.amount.minor === 10_000)).toBe(true);
  });

  it('lets a group admin edit someone else’s expense, but not an ordinary member', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    // Bob is a plain MEMBER and did not create it.
    const byMember = await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(bob),
      payload: { version: 1, description: 'Bob was here' },
    });
    expect(byMember.statusCode).toBe(403);

    // Alice owns the group, so she may.
    const byOwner = await app.inject({
      method: 'PATCH',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
      payload: { version: 1, description: 'Alice was here' },
    });
    expect(byOwner.statusCode).toBe(200);
  });
});

describe('deleting an expense', () => {
  it('soft-deletes and then reads as gone', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
    });
    expect(deleted.statusCode).toBe(204);

    const after = await app.inject({
      method: 'GET',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
    });
    expect(after.statusCode).toBe(404);
  });

  it('keeps the history readable after deletion (invariant 5)', async () => {
    const created = await postExpense(alice, equalExpense());
    const id = created.json().id;

    await app.inject({
      method: 'DELETE',
      url: `/v1/expenses/${id}`,
      headers: authHeaders(alice),
    });

    const revisions = await app.inject({
      method: 'GET',
      url: `/v1/expenses/${id}/revisions`,
      headers: authHeaders(alice),
    });
    expect(revisions.statusCode).toBe(200);
    expect(revisions.json()[0].reason).toBe('deleted');
  });
});

describe('listing expenses (§6.3 cursor pagination)', () => {
  it('pages without repeating or skipping, and never uses an offset', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id] });

    const descriptions = ['one', 'two', 'three', 'four', 'five'];
    for (const [index, description] of descriptions.entries()) {
      const res = await postExpense(alice, {
        id: uuidv7(),
        groupId: localGroup,
        description,
        total: INR(1_000),
        // Distinct timestamps so the ordering is unambiguous.
        date: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        payers: [{ userId: alice.id, amount: INR(1_000) }],
        splitStrategy: { kind: 'EQUAL', participants: [alice.id, bob.id] },
      });
      expect(res.statusCode).toBe(201);
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const url: string = `/v1/groups/${localGroup}/expenses?limit=2${cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`}`;
      const res = await app.inject({ method: 'GET', url, headers: authHeaders(alice) });
      expect(res.statusCode).toBe(200);

      seen.push(...res.json().items.map((e: { description: string }) => e.description));
      cursor = res.json().nextCursor;
      pages += 1;
    } while (cursor !== null && pages < 10);

    expect(seen).toEqual(['five', 'four', 'three', 'two', 'one']);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects a malformed cursor rather than silently starting over', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${groupId}/expenses?cursor=not-a-cursor`,
      headers: authHeaders(alice),
    });
    expect(res.statusCode).toBe(422);
  });

  it('rejects an absurd page size', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${groupId}/expenses?limit=100000`,
      headers: authHeaders(alice),
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('settlements', () => {
  it('needs the payee to confirm, and only the payee', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id] });
    const created = await app.inject({
      method: 'POST',
      url: '/v1/settlements',
      headers: authHeaders(bob),
      payload: {
        id: uuidv7(),
        groupId: localGroup,
        fromUserId: bob.id,
        toUserId: alice.id,
        amount: INR(5_000),
        settledAt: new Date().toISOString(),
      },
    });
    expect(created.json().confirmedAt).toBeNull();

    const byPayer = await app.inject({
      method: 'PATCH',
      url: `/v1/settlements/${created.json().id}/confirm`,
      headers: authHeaders(bob),
    });
    expect(byPayer.statusCode).toBe(403);

    const byPayee = await app.inject({
      method: 'PATCH',
      url: `/v1/settlements/${created.json().id}/confirm`,
      headers: authHeaders(alice),
    });
    expect(byPayee.statusCode).toBe(200);
    expect(byPayee.json().confirmedAt).not.toBeNull();
  });

  it('will not record a payment between two other people', async () => {
    const localGroup = await createGroup(app, alice, { memberIds: [bob.id, carol.id] });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/settlements',
      headers: authHeaders(alice),
      payload: {
        id: uuidv7(),
        groupId: localGroup,
        fromUserId: bob.id,
        toUserId: carol.id,
        amount: INR(5_000),
        settledAt: new Date().toISOString(),
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('will not settle with someone outside the group', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/settlements',
      headers: authHeaders(alice),
      payload: {
        id: uuidv7(),
        groupId,
        fromUserId: alice.id,
        toUserId: outsider.id,
        amount: INR(5_000),
        settledAt: new Date().toISOString(),
      },
    });
    expect(res.statusCode).toBe(422);
  });
});
