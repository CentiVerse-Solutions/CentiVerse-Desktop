import type { FastifyInstance } from 'fastify';

/**
 * Unversioned and unauthenticated on purpose: this is what the platform's
 * health check hits, and it must not depend on anything that can be broken by
 * a bad deploy of the application itself.
 */
export const healthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/health', async () => ({ status: 'ok', uptime: Math.round(process.uptime()) }));
};
