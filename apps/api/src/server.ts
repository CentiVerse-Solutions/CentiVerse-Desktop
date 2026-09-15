import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { Env } from './config/env';
import { getDb } from './db/prisma';
import { installProblemHandler } from './lib/errorHandler';
import { registerAuthPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';

/**
 * `buildServer` returns a configured but unlistening instance, so tests can
 * drive it through `app.inject()` without binding a port. `src/index.ts` is the
 * only place that calls `listen`.
 */
export const buildServer = async (env: Env): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      // Never log a credential, even accidentally.
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    },
    // Trust the platform proxy so rate limiting keys on the real client IP
    // rather than on Railway's edge.
    trustProxy: env.NODE_ENV === 'production',
  });

  await app.register(helmet, {
    // The API serves JSON only; a CSP here would apply to nothing.
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    // §6.4: the web client's refresh token is an httpOnly cookie, which only
    // travels on credentialed requests.
    credentials: true,
  });

  await app.register(cookie);

  // §6.4 specifies per-route limits for login; this is the global per-IP floor
  // that sits underneath them.
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
  });

  await registerAuthPlugin(app, env);

  installProblemHandler(app);

  await app.register(healthRoutes);

  // §6.3: everything but the health check is versioned.
  const db = getDb(env.DATABASE_URL);
  await app.register(authRoutes(db, env), { prefix: '/v1' });

  return app;
};
