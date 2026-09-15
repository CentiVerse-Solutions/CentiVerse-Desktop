import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { uuidv7 } from 'uuidv7';
import { authHeaders, buildTestServer, createGroup, createUser, type TestUser } from './helpers/client';

/**
 * §6.5: "For every endpoint there is a test asserting a non-member receives 404.
 * This is the single highest-value test suite in the API; IDOR is the most
 * common real vulnerability in apps of this exact shape."
 *
 * The table below is the point. Adding a group-scoped route without adding a
 * row here is the mistake this file exists to catch, so the last test asserts
 * that the table covers every route the server actually has.
 */

let app: FastifyInstance;
let owner: TestUser;
let outsider: TestUser;
let member: TestUser;
let groupId: string;

interface Case {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: (id: string) => string;
  payload?: Record<string, unknown>;
}

/**
 * Two concrete call shapes rather than one with a conditionally spread
 * `payload`: under `exactOptionalPropertyTypes` the spread widens the options
 * type and stops matching `InjectOptions`.
 */
const send = (testCase: Case, url: string, headers?: Record<string, string>) => {
  const base = { method: testCase.method, url, ...(headers === undefined ? {} : { headers }) };
  return testCase.payload === undefined
    ? app.inject(base)
    : app.inject({ ...base, payload: testCase.payload });
};

/**
 * A syntactically valid id that belongs to nobody. The table is built at module
 * load, before `beforeAll` has created anyone, so it cannot reference a real
 * user — and it does not need to: `assertGroupMember` runs before the target is
 * ever looked at, which is exactly the ordering under test.
 */
const SOME_USER_ID = uuidv7();

const GROUP_SCOPED: Case[] = [
  { method: 'GET', path: (id) => `/v1/groups/${id}` },
  { method: 'PATCH', path: (id) => `/v1/groups/${id}`, payload: { name: 'Renamed by an outsider' } },
  { method: 'DELETE', path: (id) => `/v1/groups/${id}` },
  { method: 'GET', path: (id) => `/v1/groups/${id}/members` },
  { method: 'POST', path: (id) => `/v1/groups/${id}/members`, payload: { displayName: 'Intruder' } },
  { method: 'DELETE', path: (id) => `/v1/groups/${id}/members/${SOME_USER_ID}` },
  { method: 'GET', path: (id) => `/v1/groups/${id}/balances` },
  { method: 'GET', path: (id) => `/v1/groups/${id}/settle-plan` },
];

beforeAll(async () => {
  app = await buildTestServer();
  await app.ready();

  owner = await createUser(app, 'Owner');
  member = await createUser(app, 'Member');
  outsider = await createUser(app, 'Outsider');
  groupId = await createGroup(app, owner, { memberIds: [member.id] });
});

afterAll(async () => {
  await app.close();
});

describe('§6.5 — a non-member gets 404, never 403', () => {
  for (const testCase of GROUP_SCOPED) {
    it(`${testCase.method} ${testCase.path(':id')}`, async () => {
      const res = await send(testCase, testCase.path(groupId), authHeaders(outsider));

      // 403 would confirm the group exists. 404 is the only correct answer.
      expect(res.statusCode).toBe(404);
      expect(res.headers['content-type']).toContain('application/problem+json');
    });
  }

  it('answers identically for a group that does not exist at all', async () => {
    const real = await app.inject({
      method: 'GET',
      url: `/v1/groups/${groupId}`,
      headers: authHeaders(outsider),
    });
    const imaginary = await app.inject({
      method: 'GET',
      url: `/v1/groups/${uuidv7()}`,
      headers: authHeaders(outsider),
    });

    expect(real.statusCode).toBe(imaginary.statusCode);
    // Byte-identical but for the `instance` URL: any other difference is an
    // oracle for whether a group id is real.
    expect({ ...real.json(), instance: null }).toEqual({ ...imaginary.json(), instance: null });
  });

  it('keeps someone else’s group out of the list entirely', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/groups',
      headers: authHeaders(outsider),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('refuses every group-scoped route without a token', async () => {
    for (const testCase of GROUP_SCOPED) {
      const res = await send(testCase, testCase.path(groupId));
      expect(res.statusCode).toBe(401);
    }
  });

  /**
   * The guard on the guard. Every `/groups/:id...` route the server knows about
   * must appear in GROUP_SCOPED, so a new endpoint cannot quietly ship without
   * a non-member test.
   */
  it('covers every group-scoped route the server exposes', () => {
    const declared = new Set(
      GROUP_SCOPED.map((c) => {
        const path = c
          .path(':id')
          // Normalise the concrete user id back to its parameter form.
          .replace(/\/members\/[^/]+$/, '/members/:userId');
        return `${c.method} ${path}`;
      }),
    );

    // `printRoutes` returns a tree, not full paths: each line is indented four
    // characters per level and carries only its own segment. Rebuild the full
    // path by keeping a stack of segments by depth.
    const actual: string[] = [];
    const stack: string[] = [];

    for (const line of app.printRoutes({ commonPrefix: false }).split(/\r?\n/)) {
      const branch = /[├└]── /.exec(line);
      if (branch === null) continue;

      const depth = branch.index / 4;
      const rest = line.slice(branch.index + branch[0].length);
      const parsed = /^(\S+) \(([^)]+)\)\s*$/.exec(rest);
      if (parsed === null) continue;

      const [, segment, methods] = parsed;
      stack.length = depth;
      stack[depth] = segment!;

      const fullPath = stack.join('').replace(/\/$/, '');
      for (const method of methods!.split(',')) {
        actual.push(`${method.trim()} ${fullPath}`);
      }
    }

    const groupScoped = actual.filter(
      (route) => / \/v1\/groups\/:id/.test(route) && !route.startsWith('HEAD'),
    );

    expect(groupScoped.length).toBeGreaterThan(0);
    for (const route of groupScoped) {
      expect(declared, `${route} has no non-member 404 test`).toContain(route);
    }
  });
});

describe('role checks are 403, because the caller already knows the group exists', () => {
  it('lets an ordinary member read but not rename', async () => {
    const read = await app.inject({
      method: 'GET',
      url: `/v1/groups/${groupId}`,
      headers: authHeaders(member),
    });
    expect(read.statusCode).toBe(200);

    const rename = await app.inject({
      method: 'PATCH',
      url: `/v1/groups/${groupId}`,
      headers: authHeaders(member),
      payload: { name: 'Renamed by a member' },
    });
    expect(rename.statusCode).toBe(403);
  });

  it('lets an ordinary member leave, but not remove someone else', async () => {
    const other = await createUser(app, 'Other');
    const temp = await createGroup(app, owner, { memberIds: [member.id, other.id] });

    const removingSomeoneElse = await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}/members/${other.id}`,
      headers: authHeaders(member),
    });
    expect(removingSomeoneElse.statusCode).toBe(403);

    const leaving = await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}/members/${member.id}`,
      headers: authHeaders(member),
    });
    expect(leaving.statusCode).toBe(204);
  });

  it('only the owner may delete the group', async () => {
    const temp = await createGroup(app, owner, { memberIds: [member.id] });
    const byMember = await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}`,
      headers: authHeaders(member),
    });
    expect(byMember.statusCode).toBe(403);

    const byOwner = await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}`,
      headers: authHeaders(owner),
    });
    expect(byOwner.statusCode).toBe(204);
  });

  it('a member who left loses access immediately', async () => {
    const temp = await createGroup(app, owner, { memberIds: [member.id] });
    await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}/members/${member.id}`,
      headers: authHeaders(member),
    });

    const after = await app.inject({
      method: 'GET',
      url: `/v1/groups/${temp}`,
      headers: authHeaders(member),
    });
    expect(after.statusCode).toBe(404);
  });

  it('a deleted group is gone even for its owner', async () => {
    const temp = await createGroup(app, owner);
    await app.inject({
      method: 'DELETE',
      url: `/v1/groups/${temp}`,
      headers: authHeaders(owner),
    });

    const after = await app.inject({
      method: 'GET',
      url: `/v1/groups/${temp}`,
      headers: authHeaders(owner),
    });
    expect(after.statusCode).toBe(404);
  });
});
