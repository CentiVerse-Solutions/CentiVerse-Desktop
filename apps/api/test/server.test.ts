import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadEnv } from '../src/config/env';
import { buildServer } from '../src/server';
import { ApiError, ProblemType } from '../src/lib/problem';

const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://centiverse:centiverse@localhost:5432/centiverse_test',
  LOG_LEVEL: 'silent',
};

describe('env', () => {
  it('rejects a missing DATABASE_URL rather than booting half-configured', () => {
    expect(() => loadEnv({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL/);
  });

  it('splits CORS_ORIGINS into a list', () => {
    const env = loadEnv({ ...testEnv, CORS_ORIGINS: 'http://a.test, http://b.test' });
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('defaults the port to 3001', () => {
    expect(loadEnv(testEnv).PORT).toBe(3001);
  });
});

describe('server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer(loadEnv(testEnv));
    // Routes must be registered before the first inject(), which readies the
    // instance and closes it to new routes.
    app.get('/boom', async () => {
      throw ApiError.validation({ name: ['is required'] }, 'check the fields');
    });
    app.get('/explode', async () => {
      throw new Error('connection string postgres://user:hunter2@host/db failed');
    });
    app.get('/stale', async () => {
      throw ApiError.versionConflict({ id: 'e1', version: 7 });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers the health check', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('returns problem+json for an unknown route', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({
      type: ProblemType.NOT_FOUND,
      status: 404,
      instance: '/nope',
    });
  });

  it('returns problem+json for a thrown ApiError', async () => {
    const res = await app.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({
      type: ProblemType.VALIDATION,
      status: 422,
      detail: 'check the fields',
      errors: { name: ['is required'] },
    });
  });

  it('never leaks the message of an unexpected error', async () => {
    const res = await app.inject({ method: 'GET', url: '/explode' });
    expect(res.statusCode).toBe(500);
    expect(res.body).not.toContain('hunter2');
    expect(res.json()).toMatchObject({ type: ProblemType.INTERNAL, title: 'Internal server error' });
  });

  it('carries the current server state on a version conflict (§6.3)', async () => {
    const res = await app.inject({ method: 'GET', url: '/stale' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({
      type: ProblemType.VERSION_CONFLICT,
      current: { id: 'e1', version: 7 },
    });
  });
});
