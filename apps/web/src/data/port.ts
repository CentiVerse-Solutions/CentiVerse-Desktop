import type { Money, Transfer } from '@centiverse/core';

/**
 * §5.2 -- THE SEAM. The interface the whole UI codes against.
 *
 * Two implementations with identical signatures: `mockPort` (in-memory, seeded
 * from mockData, balances derived by @centiverse/core) and, from Phase 5,
 * `httpPort` (fetch + zod against apps/api). Cutover is one env var, not a
 * rewrite -- and mock mode survives permanently as the demo and E2E harness
 * (invariant 10).
 */

export type UserId = number;
export type GroupId = number;
export type ExpenseId = number;

export interface Person {
  id: UserId;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Group {
  id: GroupId;
  name: string;
  avatar?: string;
  banner?: string;
  currency: string;
  createdAt: string;
  members: Person[];
  simplifyDebts: boolean;
}

export interface Expense {
  id: ExpenseId;
  groupId: GroupId | null;
  description: string;
  /** Authoritative amount. Major-unit floats do not appear below this line. */
  total: Money;
  date: string;
  paidBy: Person;
  payers: Array<{ userId: UserId; amount: Money }>;
  /** Derived by @centiverse/core, never hand-authored. */
  shares: Array<{ userId: UserId; amount: Money }>;
  participants: Person[];
  category?: { id: number; name: string; icon: string };
  notes?: string;
  receipt?: string;
  isSettlement?: boolean;
}

export interface Settlement {
  id: number;
  groupId: GroupId | null;
  from: UserId;
  to: UserId;
  amount: Money;
  settledAt: string;
  method?: string;
  note?: string;
}

/** One member's position in a group. Positive means they are owed money. */
export interface MemberBalance {
  person: Person;
  balance: Money;
}

export interface GroupBalances {
  groupId: GroupId;
  currency: string;
  net: MemberBalance[];
  /** `debtor:creditor` edges -- the detail users actually argue about. */
  pairwise: Array<{ from: Person; to: Person; amount: Money }>;
  /** Display-only suggestion (invariant 9). Never written back as a settlement. */
  settlePlan: Transfer[];
  totalSpent: Money;
}

export interface ViewerBalances {
  currency: string;
  youAreOwed: Money;
  youOwe: Money;
  net: Money;
  /** Per-friend net position, derived -- not the old hand-typed float. */
  byFriend: MemberBalance[];
}

export interface Friend extends Person {
  balance: Money;
  lastActivity: string | null;
  groups: GroupId[];
  phone?: string;
  totalTransactions: number;
}

export interface ActivityItem {
  id: string;
  type: 'expense' | 'settlement';
  at: string;
  groupId: GroupId | null;
  expense?: Expense;
  settlement?: Settlement;
}

export interface CreateGroupInput {
  name: string;
  currency: string;
  members: Person[];
  avatar?: string;
}

export interface CreateExpenseInput {
  groupId: GroupId | null;
  description: string;
  /** Minor units. The UI parses user text with parseMoney before calling. */
  totalMinor: number;
  currency: string;
  date: string;
  paidByUserId: UserId;
  participantIds: UserId[];
  /** Defaults to EQUAL. Exact/percent/shares arrive with the Phase 4 split editor. */
  strategy?:
    | { kind: 'EQUAL' }
    | { kind: 'EXACT'; shares: Array<{ userId: UserId; minor: number }> }
    | { kind: 'PERCENT'; shares: Array<{ userId: UserId; bps: number }> }
    | { kind: 'SHARES'; shares: Array<{ userId: UserId; weight: number }> };
  categoryId?: number;
  notes?: string;
}

export interface CreateSettlementInput {
  groupId: GroupId | null;
  from: UserId;
  to: UserId;
  amountMinor: number;
  currency: string;
  method?: string;
  note?: string;
}

export interface DataPort {
  viewer: {
    /** Who is looking. §5.4 -- never baked into the data. */
    get(): Promise<Person>;
  };
  groups: {
    list(): Promise<Group[]>;
    get(id: GroupId): Promise<Group>;
    create(input: CreateGroupInput): Promise<Group>;
    remove(id: GroupId): Promise<void>;
    removeMember(id: GroupId, userId: UserId): Promise<Group>;
  };
  expenses: {
    listByGroup(id: GroupId): Promise<Expense[]>;
    listRecent(limit?: number): Promise<Expense[]>;
    create(input: CreateExpenseInput): Promise<Expense>;
    remove(id: ExpenseId): Promise<void>;
  };
  balances: {
    forGroup(id: GroupId): Promise<GroupBalances>;
    forViewer(): Promise<ViewerBalances>;
  };
  settlements: {
    create(input: CreateSettlementInput): Promise<Settlement>;
    listByGroup(id: GroupId): Promise<Settlement[]>;
  };
  friends: {
    list(): Promise<Friend[]>;
  };
  activity: {
    list(limit?: number): Promise<ActivityItem[]>;
  };
}
