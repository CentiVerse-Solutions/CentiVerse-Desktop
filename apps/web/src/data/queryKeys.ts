import type { GroupId } from './port';

/**
 * §5.3 -- one query-key factory. No ad-hoc key strings anywhere else, so an
 * invalidation can never miss a cache entry because someone typed the key
 * slightly differently.
 */
export const qk = {
  viewer: {
    self: ['viewer'] as const,
    balances: ['viewer', 'balances'] as const,
    activity: ['viewer', 'activity'] as const,
  },
  groups: {
    all: ['groups'] as const,
    detail: (id: GroupId) => ['groups', id] as const,
    expenses: (id: GroupId) => ['groups', id, 'expenses'] as const,
    balances: (id: GroupId) => ['groups', id, 'balances'] as const,
    settlements: (id: GroupId) => ['groups', id, 'settlements'] as const,
  },
  friends: {
    all: ['friends'] as const,
  },
  expenses: {
    recent: (limit: number) => ['expenses', 'recent', limit] as const,
  },
};
