import type { Expense, Friend, GroupBalances } from './port';

/**
 * TEMPORARY migration shim, Phase 3 -> Phase 4.
 *
 * The screens still render major-unit floats (`expense.amount`, `friend.balance`)
 * because they were written against the old mock shape. The port speaks Money.
 * This maps one to the other at the boundary so screens can move onto the seam
 * without also being rewritten in the same commit.
 *
 * What matters is that the VALUES are now derived by @centiverse/core rather
 * than hand-authored -- the numbers on screen are correct even while their
 * rendering still takes a float.
 *
 * DELETE THIS in Phase 4: as each component is extracted it should consume Money
 * directly and format via shared/money/format.
 */

const toMajor = (minor: number): number => minor / 100;

export interface LegacyExpense extends Omit<Expense, 'total'> {
  amount: number;
  total: Expense['total'];
}

export const toLegacyExpense = (e: Expense): LegacyExpense => ({
  ...e,
  amount: toMajor(e.total.minor),
});

export const toLegacyExpenses = (list: Expense[] = []): LegacyExpense[] =>
  list.map(toLegacyExpense);

export interface LegacyFriend extends Omit<Friend, 'balance'> {
  balance: number;
}

export const toLegacyFriend = (f: Friend): LegacyFriend => ({
  ...f,
  balance: toMajor(f.balance.minor),
});

export const toLegacyFriends = (list: Friend[] = []): LegacyFriend[] => list.map(toLegacyFriend);

/** Group balance rows in the `{ id, name, balance }` shape the tabs expect. */
export const toLegacyBalances = (b: GroupBalances | undefined) =>
  (b?.net ?? []).map((row) => ({
    id: row.person.id,
    name: row.person.name,
    avatar: row.person.avatar,
    balance: toMajor(row.balance.minor),
  }));

export { toMajor };
