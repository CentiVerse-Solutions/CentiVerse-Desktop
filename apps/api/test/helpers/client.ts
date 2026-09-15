import type { FastifyInstance } from 'fastify';
import { uuidv7 } from 'uuidv7';
import { loadEnv } from '../../src/config/env';
import { buildServer } from '../../src/server';
import { TEST_DATABASE_URL } from '../setup/testDb';

/** A registered account plus the token needed to act as it. */
export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export const TEST_PASSWORD = 'a sufficiently long password';

export const buildTestServer = (): Promise<FastifyInstance> =>
  buildServer(
    loadEnv({
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'test-secret-that-is-comfortably-long-enough',
      LOG_LEVEL: 'silent',
    }),
  );

export const createUser = async (app: FastifyInstance, name = 'Test Person'): Promise<TestUser> => {
  const email = `${uuidv7()}@test.local`;
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/register',
    headers: { 'x-refresh-transport': 'header' },
    payload: { email, password: TEST_PASSWORD, displayName: name },
  });
  if (res.statusCode !== 201) throw new Error(`register failed: ${res.statusCode} ${res.body}`);

  const body = res.json();
  return {
    id: body.user.id,
    email,
    accessToken: body.tokens.accessToken,
    refreshToken: body.tokens.refreshToken,
  };
};

export const authHeaders = (user: TestUser): Record<string, string> => ({
  authorization: `Bearer ${user.accessToken}`,
});

export const createGroup = async (
  app: FastifyInstance,
  owner: TestUser,
  options: { name?: string; currency?: string; memberIds?: string[] } = {},
): Promise<string> => {
  const id = uuidv7();
  const res = await app.inject({
    method: 'POST',
    url: '/v1/groups',
    headers: authHeaders(owner),
    payload: {
      id,
      name: options.name ?? 'Test Group',
      currency: options.currency ?? 'INR',
      memberIds: options.memberIds ?? [],
    },
  });
  if (res.statusCode !== 201) throw new Error(`create group failed: ${res.statusCode} ${res.body}`);
  return id;
};
