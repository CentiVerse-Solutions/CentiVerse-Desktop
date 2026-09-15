import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AccessTokenClaimsSchema, type AccessTokenClaims } from '@centiverse/contracts';
import type { Env } from '../config/env';
import { ApiError } from '../lib/problem';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../lib/tokens';

/**
 * §6.4's transport rules, in one place.
 *
 * The access token always arrives as `Authorization: Bearer`. The refresh token
 * has two paths on purpose: an httpOnly cookie for the web, and the request body
 * for Tauri, which cannot rely on cookies across its custom protocol. Both are
 * supported from day one because bolting the second one on later means
 * re-testing every auth route.
 */

export const REFRESH_COOKIE = 'cv_refresh';

/**
 * Scoped to the auth routes: the cookie is useless anywhere else, and a cookie
 * that is not sent is a cookie that cannot be stolen by a confused-deputy
 * request to some unrelated endpoint.
 */
export const REFRESH_COOKIE_PATH = '/v1/auth';

/**
 * Clients that cannot use cookies send this header, and get the refresh token
 * in the response body instead.
 */
export const TRANSPORT_HEADER = 'x-refresh-transport';

export const wantsHeaderTransport = (request: FastifyRequest): boolean =>
  request.headers[TRANSPORT_HEADER] === 'header';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireAuth`. Absent on unauthenticated routes. */
    auth?: AccessTokenClaims;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const registerAuthPlugin = async (app: FastifyInstance, env: Env): Promise<void> => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  });

  /**
   * A preHandler rather than a global hook: routes opt in, so adding an
   * endpoint cannot accidentally make it public — it simply will not compile
   * against the service layer, which needs a user id.
   */
  app.decorate('requireAuth', async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const raw = await request.jwtVerify();
      request.auth = AccessTokenClaimsSchema.parse(raw);
    } catch {
      // Expired, malformed, wrong signature, missing — all the same to the
      // caller. Distinguishing them tells an attacker which part to fix.
      throw ApiError.unauthenticated('a valid access token is required');
    }
  });
};

/** The claims of the current request, or a 401. Never returns undefined. */
export const requireClaims = (request: FastifyRequest): AccessTokenClaims => {
  if (request.auth === undefined) {
    throw ApiError.unauthenticated('a valid access token is required');
  }
  return request.auth;
};

export const setRefreshCookie = (reply: FastifyReply, token: string, env: Env): void => {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
    ...(env.COOKIE_DOMAIN === undefined ? {} : { domain: env.COOKIE_DOMAIN }),
  });
};

export const clearRefreshCookie = (reply: FastifyReply, env: Env): void => {
  reply.clearCookie(REFRESH_COOKIE, {
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN === undefined ? {} : { domain: env.COOKIE_DOMAIN }),
  });
};

/** Body first, then cookie — the desktop path is explicit when it is used. */
export const readRefreshToken = (
  request: FastifyRequest,
  body: { refreshToken?: string | undefined } | undefined,
): string | undefined => body?.refreshToken ?? request.cookies[REFRESH_COOKIE];
