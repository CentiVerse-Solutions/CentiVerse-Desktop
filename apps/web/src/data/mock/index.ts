import {
  money,
  netBalances,
  pairwiseBalances,
  simplifyDebts,
  computeShares,
  unwrap,
  type CurrencyCode,
  type ExpenseRecord,
  type SettlementRecord,
} from '@centiverse/core';
import type {
  ActivityItem,
  CreateExpenseInput,
  CreateGroupInput,
  CreateSettlementInput,
  DataPort,
  Expense,
  Friend,
  Group,
  GroupBalances,
  GroupId,
  Person,
  Settlement,
  UserId,
  ViewerBalances,
} from '../port';
import { DEFAULT_CURRENCY, seedExpenses, seedFriends, seedGroups, seedSettlements, seedViewer } from './seed';

/**
 * §5.2 -- the in-memory implementation. Seeded from mockData, but every balance
 * is derived by @centiverse/core, persisted to localStorage so the demo survives
 * a refresh, with simulated latency and injectable failures so loading and error
 * states actually get exercised.
 *
 * Invariant 10: the app builds and runs against this with no backend, forever.
 */

const STORAGE_KEY = 'centiverse.mock.v1';

interface MockState {
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  nextId: number;
}

// ---------------------------------------------------------------- persistence

/** Money survives JSON as {minor,currency}; nothing else needs reviving. */
const load = (): MockState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockState) : null;
  } catch {
    return null; // private mode, cleared storage, quota -- fall back to the seed
  }
};

const save = (state: MockState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage is a convenience here, never a requirement */
  }
};

const freshState = (): MockState => {
  const expenses = seedExpenses();
  return {
    groups: seedGroups(),
    expenses,
    settlements: seedSettlements(),
    nextId: Math.max(0, ...expenses.map((e) => e.id)) + 1,
  };
};

let state: MockState = load() ?? freshState();

/** Test and dev helper: wipe persistence and start from the seed again. */
export const resetMockData = (): void => {
  state = freshState();
  save(state);
};

// -------------------------------------------------------- latency and failure

const LATENCY_MS = Number(import.meta.env['VITE_MOCK_LATENCY_MS'] ?? 120);

/** Set VITE_MOCK_FAIL_RATE=0.3 in dev to exercise error states. */
const FAIL_RATE = Number(import.meta.env['VITE_MOCK_FAIL_RATE'] ?? 0);

const settle = async <T>(value: T): Promise<T> => {
  if (LATENCY_MS > 0) await new Promise((r) => setTimeout(r, LATENCY_MS));
  if (FAIL_RATE > 0 && Math.random() < FAIL_RATE) {
    throw new Error('Simulated network failure (VITE_MOCK_FAIL_RATE)');
  }
  return value;
};

const notFound = (what: string, id: number | string): never => {
  throw new Error(`${what} ${id} not found`);
};

// -------------------------------------------------------------- derived views

const asRecords = (expenses: Expense[]): ExpenseRecord[] =>
  expenses.map((e) => ({
    id: String(e.id),
    total: e.total,
    payers: e.payers.map((p) => ({ userId: String(p.userId), amount: p.amount })),
    shares: e.shares.map((s) => ({ userId: String(s.userId), amount: s.amount })),
  }));

const asSettlementRecords = (settlements: Settlement[]): SettlementRecord[] =>
  settlements.map((s) => ({
    id: String(s.id),
    from: String(s.from),
    to: String(s.to),
    amount: s.amount,
  }));

const peopleIndex = (): Map<UserId, Person> => {
  const index = new Map<UserId, Person>();
  for (const g of state.groups) for (const m of g.members) index.set(m.id, m);
  for (const e of state.expenses) {
    index.set(e.paidBy.id, e.paidBy);
    for (const p of e.participants) index.set(p.id, p);
  }
  return index;
};

const personOf = (id: UserId): Person => peopleIndex().get(id) ?? { id, name: `User ${id}` };

// --------------------------------------------------------------------- port

export const mockPort: DataPort = {
  viewer: {
    get: () => settle(seedViewer()),
  },

  groups: {
    list: () => settle([...state.groups]),

    get: async (id) => {
      const group = state.groups.find((g) => g.id === id);
      return settle(group ?? notFound('group', id));
    },

    create: async (input: CreateGroupInput) => {
      const viewer = seedViewer();
      const members = input.members.some((m) => m.id === viewer.id)
        ? input.members
        : [viewer, ...input.members];

      const group: Group = {
        id: state.nextId++,
        name: input.name,
        currency: input.currency || DEFAULT_CURRENCY,
        createdAt: new Date().toISOString(),
        members,
        simplifyDebts: false,
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      };
      state.groups = [group, ...state.groups];
      save(state);
      return settle(group);
    },

    remove: async (id) => {
      state.groups = state.groups.filter((g) => g.id !== id);
      state.expenses = state.expenses.filter((e) => e.groupId !== id);
      save(state);
      return settle(undefined);
    },

    removeMember: async (id, userId) => {
      const group = state.groups.find((g) => g.id === id) ?? notFound('group', id);
      group.members = group.members.filter((m) => m.id !== userId);
      save(state);
      return settle(group);
    },
  },

  expenses: {
    listByGroup: (id) =>
      settle(
        state.expenses
          .filter((e) => e.groupId === id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      ),

    listRecent: (limit = 10) =>
      settle(
        [...state.expenses]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit),
      ),

    create: async (input: CreateExpenseInput) => {
      const currency = (input.currency || DEFAULT_CURRENCY) as CurrencyCode;
      const total = money(input.totalMinor, currency);
      const strategy = input.strategy ?? { kind: 'EQUAL' as const };

      // Non-negotiable 2: the port never computes a share itself.
      const coreStrategy =
        strategy.kind === 'EQUAL'
          ? { kind: 'EQUAL' as const, participants: input.participantIds.map(String) }
          : strategy.kind === 'EXACT'
            ? {
                kind: 'EXACT' as const,
                shares: strategy.shares.map((s) => ({
                  userId: String(s.userId),
                  amount: money(s.minor, currency),
                })),
              }
            : strategy.kind === 'PERCENT'
              ? {
                  kind: 'PERCENT' as const,
                  shares: strategy.shares.map((s) => ({ userId: String(s.userId), bps: s.bps })),
                }
              : {
                  kind: 'SHARES' as const,
                  shares: strategy.shares.map((s) => ({
                    userId: String(s.userId),
                    weight: s.weight,
                  })),
                };

      const result = computeShares({
        total,
        payers: [{ userId: String(input.paidByUserId), amount: total }],
        strategy: coreStrategy,
      });

      if (!result.ok) throw new Error(result.error.message);

      const expense: Expense = {
        id: state.nextId++,
        groupId: input.groupId,
        description: input.description,
        total,
        date: input.date,
        paidBy: personOf(input.paidByUserId),
        payers: [{ userId: input.paidByUserId, amount: total }],
        shares: unwrap(result).map((s) => ({ userId: Number(s.userId), amount: s.amount })),
        participants: input.participantIds.map(personOf),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };

      state.expenses = [expense, ...state.expenses];
      save(state);
      return settle(expense);
    },

    remove: async (id) => {
      state.expenses = state.expenses.filter((e) => e.id !== id);
      save(state);
      return settle(undefined);
    },
  },

  balances: {
    forGroup: async (id): Promise<GroupBalances> => {
      const group = state.groups.find((g) => g.id === id) ?? notFound('group', id);
      const currency = (group.currency || DEFAULT_CURRENCY) as CurrencyCode;

      const expenses = state.expenses.filter((e) => e.groupId === id);
      const settlements = state.settlements.filter((s) => s.groupId === id);

      const records = asRecords(expenses);
      const settlementRecords = asSettlementRecords(settlements);

      const net = netBalances(records, settlementRecords, currency);
      const edges = pairwiseBalances(records, settlementRecords, currency);

      const memberIds = new Set(group.members.map((m) => m.id));
      for (const key of net.keys()) memberIds.add(Number(key));

      return settle({
        groupId: id,
        currency,
        net: [...memberIds].map((userId) => ({
          person: personOf(userId),
          balance: net.get(String(userId)) ?? money(0, currency),
        })),
        pairwise: [...edges].map(([key, amount]) => {
          const [debtor, creditor] = key.split(':') as [string, string];
          return { from: personOf(Number(debtor)), to: personOf(Number(creditor)), amount };
        }),
        settlePlan: simplifyDebts(net, currency),
        totalSpent: money(
          expenses.reduce((a, e) => a + e.total.minor, 0),
          currency,
        ),
      });
    },

    forViewer: async (): Promise<ViewerBalances> => {
      const viewer = seedViewer();
      const currency = DEFAULT_CURRENCY;

      const net = netBalances(
        asRecords(state.expenses),
        asSettlementRecords(state.settlements),
        currency,
      );

      let owed = 0;
      let owes = 0;
      const byFriend: ViewerBalances['byFriend'] = [];

      for (const [userId, amount] of net) {
        if (Number(userId) === viewer.id) continue;
        // From the viewer's perspective: a debtor owes the pool, not the viewer
        // directly, so per-friend detail comes from the pairwise edges below.
        byFriend.push({ person: personOf(Number(userId)), balance: amount });
      }

      const edges = pairwiseBalances(
        asRecords(state.expenses),
        asSettlementRecords(state.settlements),
        currency,
      );
      for (const [key, amount] of edges) {
        const [debtor, creditor] = key.split(':') as [string, string];
        if (Number(creditor) === viewer.id) owed += amount.minor;
        if (Number(debtor) === viewer.id) owes += amount.minor;
      }

      return settle({
        currency,
        youAreOwed: money(owed, currency),
        youOwe: money(owes, currency),
        net: money(owed - owes, currency),
        byFriend,
      });
    },
  },

  settlements: {
    create: async (input: CreateSettlementInput) => {
      const currency = (input.currency || DEFAULT_CURRENCY) as CurrencyCode;
      const settlement: Settlement = {
        id: state.nextId++,
        groupId: input.groupId,
        from: input.from,
        to: input.to,
        amount: money(input.amountMinor, currency),
        settledAt: new Date().toISOString(),
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      };
      state.settlements = [settlement, ...state.settlements];
      save(state);
      return settle(settlement);
    },

    listByGroup: (id) => settle(state.settlements.filter((s) => s.groupId === id)),
  },

  friends: {
    list: async (): Promise<Friend[]> => {
      const viewer = seedViewer();
      const currency = DEFAULT_CURRENCY;
      const edges = pairwiseBalances(
        asRecords(state.expenses),
        asSettlementRecords(state.settlements),
        currency,
      );

      // A friend's balance is the viewer's net position against them, derived --
      // not mockFriends[].balance, which was a float someone typed.
      const perFriend = new Map<UserId, number>();
      for (const [key, amount] of edges) {
        const [debtor, creditor] = key.split(':').map(Number) as [number, number];
        if (creditor === viewer.id) perFriend.set(debtor, (perFriend.get(debtor) ?? 0) + amount.minor);
        if (debtor === viewer.id) perFriend.set(creditor, (perFriend.get(creditor) ?? 0) - amount.minor);
      }

      return settle(
        seedFriends().map((f) => ({
          ...f,
          balance: money(perFriend.get(f.id) ?? 0, currency),
        })),
      );
    },
  },

  activity: {
    list: (limit = 50) => {
      const fromExpenses: ActivityItem[] = state.expenses.map((e) => ({
        id: `expense-${e.id}`,
        type: 'expense',
        at: e.date,
        groupId: e.groupId,
        expense: e,
      }));
      const fromSettlements: ActivityItem[] = state.settlements.map((s) => ({
        id: `settlement-${s.id}`,
        type: 'settlement',
        at: s.settledAt,
        groupId: s.groupId,
        settlement: s,
      }));
      return settle(
        [...fromExpenses, ...fromSettlements]
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .slice(0, limit),
      );
    },
  },
};
