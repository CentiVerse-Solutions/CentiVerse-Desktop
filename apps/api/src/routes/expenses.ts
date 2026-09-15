import type { FastifyInstance } from 'fastify';
import {
  CreateExpenseInputSchema,
  CreateSettlementInputSchema,
  UpdateExpenseInputSchema,
} from '@centiverse/contracts';
import type { Db } from '../db/prisma';
import { parseLimit } from '../lib/cursor';
import { requireClaims } from '../plugins/auth';
import { registerIdempotency } from '../plugins/idempotency';
import {
  createExpense,
  deleteExpense,
  getExpense,
  listGroupExpenses,
  listRevisions,
  updateExpense,
} from '../services/expenses';
import {
  confirmSettlement,
  createSettlement,
  deleteSettlement,
  listGroupSettlements,
} from '../services/settlements';

/** §6.3's ledger surface. Authorization lives in the services (§6.5). */
export const expenseRoutes = (db: Db) =>
  async function routes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', app.requireAuth);
    // Registered after requireAuth so the key can be scoped to the caller.
    registerIdempotency(app, db);

    app.get<{ Params: { id: string }; Querystring: { cursor?: string; limit?: string } }>(
      '/groups/:id/expenses',
      async (request) =>
        listGroupExpenses(db, requireClaims(request).sub, request.params.id, {
          cursor: request.query.cursor,
          limit: parseLimit(request.query.limit),
        }),
    );

    app.get<{ Params: { id: string } }>('/groups/:id/settlements', async (request) =>
      listGroupSettlements(db, requireClaims(request).sub, request.params.id),
    );

    app.post('/expenses', async (request, reply) => {
      const input = CreateExpenseInputSchema.parse(request.body);
      const expense = await createExpense(db, requireClaims(request).sub, input);
      return reply.status(201).send(expense);
    });

    app.get<{ Params: { id: string } }>('/expenses/:id', async (request) =>
      getExpense(db, requireClaims(request).sub, request.params.id),
    );

    app.patch<{ Params: { id: string } }>('/expenses/:id', async (request) => {
      const input = UpdateExpenseInputSchema.parse(request.body);
      return updateExpense(db, requireClaims(request).sub, request.params.id, input);
    });

    app.delete<{ Params: { id: string } }>('/expenses/:id', async (request, reply) => {
      await deleteExpense(db, requireClaims(request).sub, request.params.id);
      return reply.status(204).send();
    });

    app.get<{ Params: { id: string } }>('/expenses/:id/revisions', async (request) =>
      listRevisions(db, requireClaims(request).sub, request.params.id),
    );

    app.post('/settlements', async (request, reply) => {
      const input = CreateSettlementInputSchema.parse(request.body);
      const settlement = await createSettlement(db, requireClaims(request).sub, input);
      return reply.status(201).send(settlement);
    });

    app.patch<{ Params: { id: string } }>('/settlements/:id/confirm', async (request) =>
      confirmSettlement(db, requireClaims(request).sub, request.params.id),
    );

    app.delete<{ Params: { id: string } }>('/settlements/:id', async (request, reply) => {
      await deleteSettlement(db, requireClaims(request).sub, request.params.id);
      return reply.status(204).send();
    });
  };
