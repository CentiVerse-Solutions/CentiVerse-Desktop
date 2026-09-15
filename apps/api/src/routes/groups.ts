import type { FastifyInstance } from 'fastify';
import {
  AddMemberInputSchema,
  CreateGroupInputSchema,
  UpdateGroupInputSchema,
} from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { requireClaims } from '../plugins/auth';
import { registerIdempotency } from '../plugins/idempotency';
import {
  addMember,
  createGroup,
  deleteGroup,
  getBalances,
  getGroup,
  getSettlePlan,
  listGroups,
  listMembers,
  removeMember,
  updateGroup,
} from '../services/groups';

/**
 * §6.3's group surface. Every handler is a thin shell: it authenticates, parses
 * with the shared contract, and hands off. The membership check lives in the
 * service (§6.5), so nothing here can forget it.
 */
export const groupRoutes = (db: Db) =>
  async function routes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', app.requireAuth);
    // Registered after requireAuth so the key can be scoped to the caller.
    registerIdempotency(app, db);

    app.get('/groups', async (request) => listGroups(db, requireClaims(request).sub));

    app.post('/groups', async (request, reply) => {
      const input = CreateGroupInputSchema.parse(request.body);
      const group = await createGroup(db, requireClaims(request).sub, input);
      return reply.status(201).send(group);
    });

    app.get<{ Params: { id: string } }>('/groups/:id', async (request) =>
      getGroup(db, requireClaims(request).sub, request.params.id),
    );

    app.patch<{ Params: { id: string } }>('/groups/:id', async (request) => {
      const patch = UpdateGroupInputSchema.parse(request.body);
      return updateGroup(db, requireClaims(request).sub, request.params.id, patch);
    });

    app.delete<{ Params: { id: string } }>('/groups/:id', async (request, reply) => {
      await deleteGroup(db, requireClaims(request).sub, request.params.id);
      return reply.status(204).send();
    });

    app.get<{ Params: { id: string } }>('/groups/:id/members', async (request) =>
      listMembers(db, requireClaims(request).sub, request.params.id),
    );

    app.post<{ Params: { id: string } }>('/groups/:id/members', async (request, reply) => {
      const input = AddMemberInputSchema.parse(request.body);
      const added = await addMember(db, requireClaims(request).sub, request.params.id, input);
      return reply.status(201).send(added);
    });

    app.delete<{ Params: { id: string; userId: string } }>(
      '/groups/:id/members/:userId',
      async (request, reply) => {
        await removeMember(
          db,
          requireClaims(request).sub,
          request.params.id,
          request.params.userId,
        );
        return reply.status(204).send();
      },
    );

    app.get<{ Params: { id: string } }>('/groups/:id/balances', async (request) =>
      getBalances(db, requireClaims(request).sub, request.params.id),
    );

    /** Invariant 9: a suggestion. Read-only, and never written back. */
    app.get<{ Params: { id: string } }>('/groups/:id/settle-plan', async (request) =>
      getSettlePlan(db, requireClaims(request).sub, request.params.id),
    );
  };
