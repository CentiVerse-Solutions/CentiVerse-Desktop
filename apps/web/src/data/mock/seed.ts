import { computeShares, money, unwrap, type CurrencyCode } from '@centiverse/core';
import { mockGroups, mockExpenses, mockFriends } from '../../utils/mockData';
import type { Expense, Group, Person, Settlement, UserId } from '../port';

/**
 * The ONLY module allowed to import utils/mockData (CLAUDE.md). Everything above
 * this line sees domain records: integer Money and shares computed by
 * @centiverse/core.
 *
 * §5.2 is explicit that mockPort must derive balances rather than return
 * mockSettlementSummary -- the moment they are derived, the app's numbers start
 * being correct, and every derived-value bug surfaces now instead of after the
 * backend lands.
 */

const DEFAULT_CURRENCY: CurrencyCode = 'INR';

/** Mock amounts are major-unit floats; the ledger is integer minor units. */
const toMinor = (majorUnits: number): number => Math.round((majorUnits ?? 0) * 100);

const asPerson = (raw: { id: number; name: string; email?: string; avatar?: string }): Person => ({
  id: raw.id,
  name: raw.name,
  ...(raw.email !== undefined ? { email: raw.email } : {}),
  ...(raw.avatar !== undefined ? { avatar: raw.avatar } : {}),
});

export const seedGroups = (): Group[] =>
  mockGroups.map((g) => ({
    id: g.id,
    name: g.name,
    avatar: g.avatar,
    banner: g.banner,
    currency: g.currency ?? DEFAULT_CURRENCY,
    createdAt: g.createdAt,
    members: g.members.map(asPerson),
    simplifyDebts: false,
  }));

/**
 * Turns a mock expense into a real ledger entry: a single payer for the whole
 * total, and shares produced by computeShares with an EQUAL strategy. The mock
 * data has no split information at all -- equal-split was only ever implied by
 * the UI at render time.
 */
export const seedExpenses = (): Expense[] => {
  const out: Expense[] = [];

  for (const e of mockExpenses) {
    const currency = DEFAULT_CURRENCY;
    const total = money(toMinor(e.amount), currency);
    const participants = (e.participants ?? []).map(asPerson);

    // Degenerate rows would make the whole seed throw; skip them loudly instead.
    if (total.minor <= 0 || participants.length === 0 || !e.paidBy) continue;

    const result = computeShares({
      total,
      payers: [{ userId: String(e.paidBy.id), amount: total }],
      strategy: { kind: 'EQUAL', participants: participants.map((p) => String(p.id)) },
    });

    if (!result.ok) {
      // A seed row that cannot be split is a data bug, not a user error.
      // eslint-disable-next-line no-console
      console.warn(`[mock seed] skipping expense ${e.id}: ${result.error.code}`);
      continue;
    }

    out.push({
      id: e.id,
      groupId: e.groupId ?? null,
      description: e.description,
      total,
      date: e.date,
      paidBy: asPerson(e.paidBy),
      payers: [{ userId: e.paidBy.id, amount: total }],
      shares: unwrap(result).map((s) => ({ userId: Number(s.userId), amount: s.amount })),
      participants,
      ...(e.category !== undefined ? { category: e.category } : {}),
      ...(e.notes !== undefined ? { notes: e.notes } : {}),
      ...(e.receipt !== undefined ? { receipt: e.receipt } : {}),
    });
  }

  return out;
};

/**
 * Friends keep their identity from the mock data, but NOT their balance --
 * `mockFriends[].balance` is a hand-authored float that never reconciled with
 * mockExpenses. Balances are derived from the ledger by the port.
 */
export const seedFriends = (): Array<Omit<import('../port').Friend, 'balance'>> =>
  mockFriends.map((f) => ({
    id: f.id,
    name: f.name,
    ...(f.email !== undefined ? { email: f.email } : {}),
    ...(f.avatar !== undefined ? { avatar: f.avatar } : {}),
    lastActivity: f.lastActivity ?? null,
    groups: f.groups ?? [],
    ...(f.phone !== undefined ? { phone: f.phone } : {}),
    totalTransactions: f.totalTransactions ?? 0,
  }));

/** No settlements in the seed: the mock data never had any. */
export const seedSettlements = (): Settlement[] => [];

export const seedViewer = (): Person => {
  const all = mockGroups.flatMap((g) => g.members);
  const found = all.find((m) => m.id === 1);
  return found
    ? asPerson(found)
    : { id: 1 as UserId, name: 'Karthik', email: 'karthik@example.com' };
};

export { DEFAULT_CURRENCY, toMinor };
