import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Prisma } from '@prisma/client';
import type { Db } from '../db/prisma';
import { ApiError, ProblemType } from '../lib/problem';

/**
 * §6.3: "Every mutation accepts an `Idempotency-Key` header; the response is
 * cached against it for 24h. Combined with client-generated UUIDv7 ids, this
 * makes retries and offline replay safe."
 *
 * The subtlety is concurrency. Caching the response *after* the handler runs
 * does nothing for the case that actually happens — a flaky network, the client
 * retrying while the first request is still in flight — because at that moment
 * there is no cached response yet and both requests execute.
 *
 * So the key is reserved before the handler runs, as a row with status 0. A
 * second request holding the same key finds that row and is told the first is
 * still running, rather than doing the work twice.
 */

const HEADER = 'idempotency-key';
const TTL_MS = 24 * 60 * 60 * 1000;
const IN_FLIGHT = 0;

const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

declare module 'fastify' {
  interface FastifyRequest {
    /** Set when this request reserved an idempotency key it must finish. */
    idempotencyKey?: string;
  }
}

/** Ties the key to the exact request, so reusing it with a different body fails. */
const hashRequest = (request: FastifyRequest): string =>
  createHash('sha256')
    .update(request.method)
    .update('\n')
    .update(request.routeOptions.url ?? request.url)
    .update('\n')
    .update(request.body === undefined ? '' : JSON.stringify(request.body))
    .digest('base64url');

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'P2002';

export const registerIdempotency = (app: FastifyInstance, db: Db): void => {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.headers[HEADER];
    if (typeof key !== 'string' || key === '' || !MUTATIONS.has(request.method)) return;

    // Keys are scoped per user, so one caller's key cannot collide with — or
    // read — another's. `requireAuth` has already run by this point.
    const userId = request.auth?.sub;
    if (userId === undefined) return;

    const requestHash = hashRequest(request);
    const path = request.routeOptions.url ?? request.url;

    try {
      await db.idempotencyKey.create({
        data: {
          key,
          userId,
          method: request.method,
          path,
          requestHash,
          responseStatus: IN_FLIGHT,
          responseBody: {},
          expiresAt: new Date(Date.now() + TTL_MS),
        },
      });
      request.idempotencyKey = key;
      return;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }

    const existing = await db.idempotencyKey.findUnique({
      where: { userId_key: { userId, key } },
    });

    // Expired between the failed insert and this read: take it over.
    if (existing === null || existing.expiresAt <= new Date()) {
      await db.idempotencyKey.deleteMany({ where: { userId, key } });
      throw ApiError.conflict('that idempotency key just expired; retry with a new one');
    }

    if (existing.requestHash !== requestHash) {
      // The same key with a different payload is a bug in the caller. Returning
      // the first response would be silently wrong, so fail loudly.
      throw new ApiError(422, ProblemType.VALIDATION, 'Idempotency key reused', {
        detail: 'this Idempotency-Key was already used for a different request',
      });
    }

    if (existing.responseStatus === IN_FLIGHT) {
      throw ApiError.conflict('a request with this idempotency key is still in progress');
    }

    // A genuine retry of a completed request: replay the original answer.
    reply
      .status(existing.responseStatus)
      .header('idempotent-replay', 'true')
      .send(existing.responseBody);
  });

  app.addHook('onSend', async (request, reply, payload) => {
    const key = request.idempotencyKey;
    if (key === undefined) return payload;

    const userId = request.auth?.sub;
    if (userId === undefined) return payload;

    // A server error is not an answer worth replaying — drop the reservation so
    // the client's retry gets a fresh attempt rather than the same 500.
    if (reply.statusCode >= 500) {
      await db.idempotencyKey.deleteMany({ where: { userId, key } });
      return payload;
    }

    let body: Prisma.InputJsonValue = {};
    if (typeof payload === 'string' && payload !== '') {
      try {
        body = JSON.parse(payload) as Prisma.InputJsonValue;
      } catch {
        // Non-JSON responses are not replayable; keep the status, drop the body.
        body = {};
      }
    }

    await db.idempotencyKey.update({
      where: { userId_key: { userId, key } },
      data: { responseStatus: reply.statusCode, responseBody: body },
    });

    return payload;
  });
};
