import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { uuidv7 } from 'uuidv7';
import { GroupBalancesSchema, GroupSchema } from '@centiverse/contracts';
import { authHeaders, buildTestServer, createGroup, createUser, type TestUser } from './helpers/client';

let app: FastifyInstance;
let owner: TestUser;
let friend: TestUser;

beforeAll(async () => {
  app = await buildTestServer();
  await app.ready();
  owner = await createUser(app, 'Owner');
  friend = await createUser(app, 'Friend');
});

afterAll(async () => {
  await app.close();
});

describe('creating and reading groups', () => {
  it('returns the contract shape and puts the creator in as OWNER', async () => {
    const id = await createGroup(app, owner, { name: 'Goa', memberIds: [friend.id] });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${id}`,
      headers: authHeaders(owner),
    });
    expect(res.statusCode).toBe(200);
    expect(GroupSchema.safeParse(res.json()).success).toBe(true);
    expect(res.json().name).toBe('Goa');

    const members = await app.inject({
      method: 'GET',
      url: `/v1/groups/${id}/members`,
      headers: authHeaders(owner),
    });
    const roles = Object.fromEntries(
      members.json().map((m: { user: { id: string }; member: { role: string } }) => [
        m.user.id,
        m.member.role,
      ]),
    );
    expect(roles[owner.id]).toBe('OWNER');
    expect(roles[friend.id]).toBe('MEMBER');
  });

  it('refuses to create a group naming a user who does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/groups',
      headers: authHeaders(owner),
      payload: { id: uuidv7(), name: 'Ghosts', currency: 'INR', memberIds: [uuidv7()] },
    });
    expect(res.statusCode).toBe(422);
  });

  it('lists only the caller’s own groups', async () => {
    const mine = await createGroup(app, owner, { name: 'Mine' });
    await createGroup(app, friend, { name: 'Theirs' });

    const res = await app.inject({
      method: 'GET',
      url: '/v1/groups',
      headers: authHeaders(owner),
    });
    const names = res.json().map((g: { name: string }) => g.name);
    expect(names).toContain('Mine');
    expect(names).not.toContain('Theirs');
    expect(res.json().some((g: { id: string }) => g.id === mine)).toBe(true);
  });
});

describe('members', () => {
  it('adds a placeholder member by name, with no email and no claim (§12 #9)', async () => {
    const id = await createGroup(app, owner);

    const res = await app.inject({
      method: 'POST',
      url: `/v1/groups/${id}/members`,
      headers: authHeaders(owner),
      payload: { displayName: 'Priya' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().user.displayName).toBe('Priya');
    expect(res.json().user.email).toBeNull();
    expect(res.json().user.claimedAt).toBeNull();
  });

  it('insists on exactly one of userId or displayName', async () => {
    const id = await createGroup(app, owner);
    const both = await app.inject({
      method: 'POST',
      url: `/v1/groups/${id}/members`,
      headers: authHeaders(owner),
      payload: { userId: friend.id, displayName: 'Priya' },
    });
    expect(both.statusCode).toBe(422);

    const neither = await app.inject({
      method: 'POST',
      url: `/v1/groups/${id}/members`,
      headers: authHeaders(owner),
      payload: {},
    });
    expect(neither.statusCode).toBe(422);
  });

  it('restores a member who left rather than failing on the primary key', async () => {
    const id = await createGroup(app, owner, { memberIds: [friend.id] });

    await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${id}/members/${friend.id}`,
      headers: authHeaders(friend),
    });

    const readded = await app.inject({
      method: 'POST',
      url: `/v1/groups/${id}/members`,
      headers: authHeaders(owner),
      payload: { userId: friend.id },
    });
    expect(readded.statusCode).toBe(201);
    expect(readded.json().member.leftAt).toBeNull();
  });
});

describe('group settings', () => {
  it('renames a group', async () => {
    const id = await createGroup(app, owner, { name: 'Before' });
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/groups/${id}`,
      headers: authHeaders(owner),
      payload: { name: 'After' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('After');
  });

  it('allows a currency change while the group is still empty', async () => {
    const id = await createGroup(app, owner, { currency: 'INR' });
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/groups/${id}`,
      headers: authHeaders(owner),
      payload: { currency: 'USD' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().currency).toBe('USD');
  });

  it('rejects an unknown currency code', async () => {
    const id = await createGroup(app, owner);
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/groups/${id}`,
      headers: authHeaders(owner),
      payload: { currency: 'XYZ' },
    });
    expect(res.statusCode).toBe(422);
  });
});

describe('balances on an empty group', () => {
  it('lists every member at zero rather than omitting them', async () => {
    const id = await createGroup(app, owner, { memberIds: [friend.id] });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${id}/balances`,
      headers: authHeaders(owner),
    });

    expect(res.statusCode).toBe(200);
    expect(GroupBalancesSchema.safeParse(res.json()).success).toBe(true);

    const net = res.json().net as { userId: string; amount: { minor: number } }[];
    expect(net).toHaveLength(2);
    expect(net.every((b) => b.amount.minor === 0)).toBe(true);
    // Invariant 2: net balances sum to exactly zero, trivially here.
    expect(net.reduce((a, b) => a + b.amount.minor, 0)).toBe(0);
    expect(res.json().pairwise).toEqual([]);
  });

  it('suggests no transfers when nobody owes anything', async () => {
    const id = await createGroup(app, owner, { memberIds: [friend.id] });
    const res = await app.inject({
      method: 'GET',
      url: `/v1/groups/${id}/settle-plan`,
      headers: authHeaders(owner),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});
