import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Prisma } from '@prisma/client';
import {
  LoginInputSchema,
  RefreshInputSchema,
  RegisterInputSchema,
  UpdateMeInputSchema,
  type AuthResult,
} from '@centiverse/contracts';
import type { Env } from '../config/env';
import type { Db } from '../db/prisma';
import { ApiError } from '../lib/problem';
import {
  clearRefreshCookie,
  readRefreshToken,
  requireClaims,
  setRefreshCookie,
  wantsHeaderTransport,
} from '../plugins/auth';
import {
  listSessions,
  login,
  logout,
  refresh,
  register,
  revokeSession,
  toUserDto,
  type AuthDeps,
  type IssuedTokens,
} from '../services/auth';

/** §6.3's auth surface, plus /v1/me. */
export const authRoutes = (db: Db, env: Env) =>
  async function routes(app: FastifyInstance): Promise<void> {
    const deps: AuthDeps = {
      db,
      signAccessToken: async (claims) => app.jwt.sign(claims),
    };

    const contextOf = (request: FastifyRequest) => ({
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    /**
     * One place decides how the refresh token travels back, so the cookie path
     * and the header path cannot drift apart.
     */
    const sendAuthResult = (
      request: FastifyRequest,
      reply: FastifyReply,
      result: { user: AuthResult['user']; tokens: IssuedTokens },
      status = 200,
    ): void => {
      const useHeader = wantsHeaderTransport(request);
      if (useHeader) {
        clearRefreshCookie(reply, env);
      } else {
        setRefreshCookie(reply, result.tokens.refreshToken, env);
      }

      const body: AuthResult = {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
          ...(useHeader ? { refreshToken: result.tokens.refreshToken } : {}),
        },
      };
      reply.status(status).send(body);
    };

    app.post('/auth/register', async (request, reply) => {
      const input = RegisterInputSchema.parse(request.body);
      const result = await register(deps, input, contextOf(request));
      sendAuthResult(request, reply, result, 201);
    });

    app.post(
      '/auth/login',
      {
        // §6.4: "5 login attempts / 15 min / IP+email". Keyed on both, so one
        // noisy office cannot lock out an account and one attacker cannot walk
        // the user table from a single address.
        config: {
          rateLimit: {
            max: 5,
            timeWindow: '15 minutes',
            // The default hook is `onRequest`, which runs before the body is
            // parsed -- `request.body` would be undefined and every login would
            // share one bucket keyed on the IP alone.
            hook: 'preHandler' as const,
            keyGenerator: (request: FastifyRequest) => {
              const email =
                typeof request.body === 'object' &&
                request.body !== null &&
                'email' in request.body &&
                typeof (request.body as { email?: unknown }).email === 'string'
                  ? (request.body as { email: string }).email.toLowerCase()
                  : '';
              return `login:${request.ip}:${email}`;
            },
          },
        },
      },
      async (request, reply) => {
        const input = LoginInputSchema.parse(request.body);
        const result = await login(deps, input, contextOf(request));
        sendAuthResult(request, reply, result);
      },
    );

    app.post('/auth/refresh', async (request, reply) => {
      const body = RefreshInputSchema.parse(request.body ?? {});
      const token = readRefreshToken(request, body);
      if (token === undefined) {
        throw ApiError.unauthenticated('no refresh token supplied');
      }
      const result = await refresh(deps, token, contextOf(request));
      sendAuthResult(request, reply, result);
    });

    app.post('/auth/logout', async (request, reply) => {
      const body = RefreshInputSchema.parse(request.body ?? {});
      await logout(deps, readRefreshToken(request, body));
      clearRefreshCookie(reply, env);
      reply.status(204).send();
    });

    app.get('/auth/sessions', { preHandler: app.requireAuth }, async (request) => {
      const claims = requireClaims(request);
      return listSessions(deps, claims.sub, claims.sid);
    });

    app.delete<{ Params: { id: string } }>(
      '/auth/sessions/:id',
      { preHandler: app.requireAuth },
      async (request, reply) => {
        const claims = requireClaims(request);
        await revokeSession(deps, claims.sub, request.params.id);
        reply.status(204).send();
      },
    );

    app.get('/me', { preHandler: app.requireAuth }, async (request) => {
      const claims = requireClaims(request);
      const user = await db.user.findFirst({ where: { id: claims.sub, deletedAt: null } });
      if (user === null) throw ApiError.unauthenticated('account is no longer active');
      return toUserDto(user);
    });

    app.patch('/me', { preHandler: app.requireAuth }, async (request) => {
      const claims = requireClaims(request);
      const input = UpdateMeInputSchema.parse(request.body);

      // Built key by key rather than spread: under `exactOptionalPropertyTypes`
      // an explicit `undefined` is not the same as an absent key, and Prisma
      // reads the former as "set this column to undefined".
      const data: Prisma.UserUpdateInput = {};
      if (input.displayName !== undefined) data.displayName = input.displayName;
      if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
      if (input.defaultCurrency !== undefined) data.defaultCurrency = input.defaultCurrency;
      if (input.locale !== undefined) data.locale = input.locale;
      if (input.timezone !== undefined) data.timezone = input.timezone;

      const user = await db.user.update({ where: { id: claims.sub }, data });
      return toUserDto(user);
    });
  };
