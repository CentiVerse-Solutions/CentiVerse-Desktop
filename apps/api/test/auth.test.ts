import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import { AuthResultSchema, SessionSchema } from '@centiverse/contracts';
import { loadEnv } from '../src/config/env';
import { buildServer } from '../src/server';
import { REFRESH_COOKIE } from '../src/plugins/auth';
import { TEST_DATABASE_URL } from './setup/testDb';

/**
 * §6.4 end to end, through the HTTP surface rather than against the service, so
 * the cookie path and the header path are both exercised as a client sees them.
 */

const env = loadEnv({
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_SECRET: 'test-secret-that-is-comfortably-long-enough',
  LOG_LEVEL: 'silent',
});

let app: FastifyInstance;
const db = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

const freshEmail = () => `${uuidv7()}@test.local`;
const PASSWORD = 'a sufficiently long password';

const registerUser = async (email = freshEmail()) => {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/register',
    payload: { email, password: PASSWORD, displayName: 'Test Person' },
  });
  return { res, email };
};

/** The desktop path: refresh token in the body, no cookie (§6.4). */
const registerViaHeader = async (email = freshEmail()) => {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/register',
    headers: { 'x-refresh-transport': 'header' },
    payload: { email, password: PASSWORD, displayName: 'Desktop Person' },
  });
  return { res, email };
};

const cookieFrom = (res: { cookies: { name: string; value: string }[] }): string => {
  const cookie = res.cookies.find((c) => c.name === REFRESH_COOKIE);
  if (cookie === undefined) throw new Error('no refresh cookie was set');
  return cookie.value;
};

beforeAll(async () => {
  app = await buildServer(env);
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await db.$disconnect();
});

describe('registration', () => {
  it('creates an account and returns the contract shape', async () => {
    const { res, email } = await registerUser();
    expect(res.statusCode).toBe(201);

    const parsed = AuthResultSchema.safeParse(res.json());
    expect(parsed.success).toBe(true);
    expect(res.json().user.email).toBe(email);
    expect(res.json().tokens.expiresIn).toBe(900);
  });

  it('puts the refresh token in an httpOnly cookie, never in the body', async () => {
    const { res } = await registerUser();
    expect(res.json().tokens.refreshToken).toBeUndefined();

    const cookie = res.cookies.find((c) => c.name === REFRESH_COOKIE);
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite?.toLowerCase()).toBe('lax');
    expect(cookie?.path).toBe('/v1/auth');
  });

  it('returns the refresh token in the body for a client that cannot use cookies', async () => {
    const { res } = await registerViaHeader();
    expect(res.statusCode).toBe(201);
    expect(typeof res.json().tokens.refreshToken).toBe('string');
  });

  it('never stores the password or its plaintext anywhere', async () => {
    const { res } = await registerUser();
    const userId = res.json().user.id;

    const credentials = await db.authCredential.findUniqueOrThrow({ where: { userId } });
    expect(credentials.passwordHash).not.toContain(PASSWORD);
    expect(credentials.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('stores only a hash of the refresh token', async () => {
    const { res } = await registerViaHeader();
    const token = res.json().tokens.refreshToken as string;

    const stored = await db.session.findFirst({ where: { userId: res.json().user.id } });
    expect(stored?.refreshTokenHash).not.toBe(token);
  });

  it('rejects a duplicate email with 409', async () => {
    const email = freshEmail();
    await registerUser(email);
    const second = await registerUser(email);
    expect(second.res.statusCode).toBe(409);
    expect(second.res.json().title).toBe('Conflict');
  });

  it('rejects a short password with a field-level 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: freshEmail(), password: 'short', displayName: 'X' },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors.password).toBeDefined();
  });
});

describe('login', () => {
  it('accepts the right password', async () => {
    const { email } = await registerUser();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    expect(AuthResultSchema.safeParse(res.json()).success).toBe(true);
  });

  it('is case-insensitive about the email', async () => {
    const email = freshEmail();
    await registerUser(email);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: email.toUpperCase(), password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
  });

  it('gives the same answer for a wrong password and an unknown account', async () => {
    const { email } = await registerUser();

    const wrongPassword = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: 'the wrong password entirely' },
    });
    const unknownAccount = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: freshEmail(), password: 'the wrong password entirely' },
    });

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownAccount.statusCode).toBe(401);
    // Identical body: anything that differs is an account-enumeration oracle.
    expect(wrongPassword.json().detail).toBe(unknownAccount.json().detail);
  });

  it('will not log in as a placeholder member, who has no credentials', async () => {
    const email = freshEmail();
    await db.user.create({ data: { id: uuidv7(), email, displayName: 'Placeholder' } });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: PASSWORD },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('refresh rotation and reuse detection (§6.4)', () => {
  it('rotates the token on every use', async () => {
    const { res } = await registerViaHeader();
    const first = res.json().tokens.refreshToken as string;

    const refreshed = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: first },
    });

    expect(refreshed.statusCode).toBe(200);
    const second = refreshed.json().tokens.refreshToken as string;
    expect(second).not.toBe(first);
  });

  it('revokes the whole family when a rotated token is presented again', async () => {
    const { res } = await registerViaHeader();
    const userId = res.json().user.id as string;
    const stolen = res.json().tokens.refreshToken as string;

    // The legitimate client rotates.
    const rotated = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: stolen },
    });
    const live = rotated.json().tokens.refreshToken as string;

    // The thief presents the copy they took before the rotation.
    const reuse = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: stolen },
    });
    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().detail).toMatch(/reuse detected/);

    // ...and the legitimate client's live token is dead too. That is the point:
    // once a family is known to be compromised, everyone re-authenticates.
    const afterBreach = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: live },
    });
    expect(afterBreach.statusCode).toBe(401);

    const active = await db.session.count({ where: { userId, revokedAt: null } });
    expect(active).toBe(0);
  });

  it('works through the cookie for a web client', async () => {
    const { res } = await registerUser();
    const cookie = cookieFrom(res);

    const refreshed = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      cookies: { [REFRESH_COOKIE]: cookie },
      payload: {},
    });

    expect(refreshed.statusCode).toBe(200);
    expect(cookieFrom(refreshed)).not.toBe(cookie);
  });

  it('rejects a token that was never issued', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: 'not-a-real-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a request with no refresh token at all', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/auth/refresh', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('rejects an expired refresh token', async () => {
    const { res } = await registerViaHeader();
    const token = res.json().tokens.refreshToken as string;

    await db.session.updateMany({
      where: { userId: res.json().user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const refreshed = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: token },
    });
    expect(refreshed.statusCode).toBe(401);
    expect(refreshed.json().detail).toMatch(/expired/);
  });
});

describe('login rate limiting (§6.4)', () => {
  const attemptLogin = (email: string) =>
    app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: 'deliberately wrong' },
    });

  it('locks out after five attempts and does not take the rest of the IP with it', async () => {
    const target = freshEmail();
    await registerUser(target);

    for (let i = 0; i < 5; i += 1) {
      expect((await attemptLogin(target)).statusCode).toBe(401);
    }
    expect((await attemptLogin(target)).statusCode).toBe(429);

    // Keyed on IP *and* email: a different account from the same address is
    // unaffected. If the limiter ever reverts to running before the body is
    // parsed, every login shares one bucket and this line fails.
    const bystander = freshEmail();
    await registerUser(bystander);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: bystander, password: PASSWORD },
    });
    expect(res.statusCode).toBe(200);
  });

  it('answers a rate-limited request in problem+json like everything else', async () => {
    const target = freshEmail();
    await registerUser(target);
    for (let i = 0; i < 5; i += 1) await attemptLogin(target);

    const limited = await attemptLogin(target);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers['content-type']).toContain('application/problem+json');
    expect(limited.json().title).toBe('Too many requests');
  });
});

describe('sessions (§6.4 — what the Security screen renders)', () => {
  it('lists one row per active login and marks the current one', async () => {
    const { res, email } = await registerUser();
    const accessToken = res.json().tokens.accessToken as string;

    // A second login from a different device.
    await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'user-agent': 'CentiVerse Desktop' },
      payload: { email, password: PASSWORD },
    });

    const list = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(list.statusCode).toBe(200);
    const sessions = list.json();
    expect(sessions).toHaveLength(2);
    expect(sessions.every((s: unknown) => SessionSchema.safeParse(s).success)).toBe(true);
    expect(sessions.filter((s: { current: boolean }) => s.current)).toHaveLength(1);
    // A session row must never carry a token.
    expect(JSON.stringify(sessions)).not.toContain('refreshToken');
  });

  it('does not count rotations as extra sessions', async () => {
    const { res } = await registerViaHeader();
    const accessToken = res.json().tokens.accessToken as string;
    const token = res.json().tokens.refreshToken as string;

    await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      headers: { 'x-refresh-transport': 'header' },
      payload: { refreshToken: token },
    });

    const list = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(list.json()).toHaveLength(1);
  });

  it('revokes a session by id', async () => {
    const { res, email } = await registerUser();
    const accessToken = res.json().tokens.accessToken as string;
    await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: PASSWORD },
    });

    const before = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const other = before.json().find((s: { current: boolean }) => !s.current);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/v1/auth/sessions/${other.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deleted.statusCode).toBe(204);

    const after = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(after.json()).toHaveLength(1);
  });

  it('cannot revoke a session belonging to someone else', async () => {
    const mine = await registerUser();
    const theirs = await registerUser();

    const theirSessions = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${theirs.res.json().tokens.accessToken}` },
    });
    const victimSessionId = theirSessions.json()[0].id;

    const attempt = await app.inject({
      method: 'DELETE',
      url: `/v1/auth/sessions/${victimSessionId}`,
      headers: { authorization: `Bearer ${mine.res.json().tokens.accessToken}` },
    });

    // 404, not 403 — the same reasoning as §6.5.
    expect(attempt.statusCode).toBe(404);
  });
});

describe('logout', () => {
  it('kills the session family and clears the cookie', async () => {
    const { res } = await registerUser();
    const cookie = cookieFrom(res);

    const out = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      cookies: { [REFRESH_COOKIE]: cookie },
      payload: {},
    });
    expect(out.statusCode).toBe(204);

    const reuse = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      cookies: { [REFRESH_COOKIE]: cookie },
      payload: {},
    });
    expect(reuse.statusCode).toBe(401);
  });

  it('is idempotent for a token that means nothing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      payload: { refreshToken: 'nonsense' },
    });
    expect(res.statusCode).toBe(204);
  });
});

describe('/v1/me', () => {
  it('needs an access token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/me' });
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const other = await buildServer(
      loadEnv({
        NODE_ENV: 'test',
        DATABASE_URL: TEST_DATABASE_URL,
        JWT_SECRET: 'a completely different secret, also long enough',
        LOG_LEVEL: 'silent',
      }),
    );
    const forged = other.jwt.sign({ sub: uuidv7(), sid: uuidv7() });
    await other.close();

    const res = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${forged}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns the caller', async () => {
    const { res, email } = await registerUser();
    const me = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${res.json().tokens.accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().email).toBe(email);
  });

  it('updates only the fields that were sent', async () => {
    const { res } = await registerUser();
    const accessToken = res.json().tokens.accessToken as string;

    const patched = await app.inject({
      method: 'PATCH',
      url: '/v1/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: 'Renamed' },
    });

    expect(patched.statusCode).toBe(200);
    expect(patched.json().displayName).toBe('Renamed');
    expect(patched.json().timezone).toBe('Asia/Kolkata');
  });
});
