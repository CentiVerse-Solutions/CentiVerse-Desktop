import { describe, it, expect, beforeEach } from 'vitest';
import { mockPort, resetMockData } from '../mock';

/**
 * §5.2: "mockPort must compute balances with @centiverse/core, not return
 * mockSettlementSummary. The moment mock balances are derived, the app's numbers
 * start being correct, and every derived-value bug surfaces now."
 *
 * These tests prove the numbers reconcile — which the old hand-authored
 * mockSettlementSummary never did.
 */

beforeEach(() => {
  localStorage.clear();
  resetMockData();
});

describe('mockPort seeding', () => {
  it('seeds groups and expenses from the mock data', async () => {
    const groups = await mockPort.groups.list();
    expect(groups.length).toBeGreaterThan(0);

    const expenses = await mockPort.expenses.listByGroup(groups[0].id);
    expect(expenses.length).toBeGreaterThan(0);
  });

  it('carries Money, never a float', async () => {
    const [expense] = await mockPort.expenses.listRecent(1);
    expect(Number.isInteger(expense.total.minor)).toBe(true);
    expect(expense.total.currency).toBe('INR');
  });

  it('derives shares for every expense -- the mock data had none', async () => {
    const expenses = await mockPort.expenses.listRecent(50);
    for (const e of expenses) {
      expect(e.shares.length).toBeGreaterThan(0);
      const sum = e.shares.reduce((a, s) => a + s.amount.minor, 0);
      // invariant 1
      expect(sum).toBe(e.total.minor);
    }
  });

  it('has payers summing to the total for every expense (invariant 1)', async () => {
    const expenses = await mockPort.expenses.listRecent(50);
    for (const e of expenses) {
      expect(e.payers.reduce((a, p) => a + p.amount.minor, 0)).toBe(e.total.minor);
    }
  });
});

describe('derived balances reconcile', () => {
  it('net balances sum to exactly zero for every group (invariant 2)', async () => {
    const groups = await mockPort.groups.list();
    for (const g of groups) {
      const balances = await mockPort.balances.forGroup(g.id);
      const total = balances.net.reduce((a, b) => a + b.balance.minor, 0);
      expect(total).toBe(0);
    }
  });

  it('the settle plan preserves every net position', async () => {
    const groups = await mockPort.groups.list();
    const g = groups[0];
    const balances = await mockPort.balances.forGroup(g.id);

    const applied = new Map();
    for (const t of balances.settlePlan) {
      applied.set(t.from, (applied.get(t.from) ?? 0) + t.amount.minor);
      applied.set(t.to, (applied.get(t.to) ?? 0) - t.amount.minor);
    }
    for (const { person, balance } of balances.net) {
      const settled = (applied.get(String(person.id)) ?? 0) + balance.minor;
      expect(settled).toBe(0);
    }
  });

  it('viewer balances net out to owed minus owes', async () => {
    const v = await mockPort.balances.forViewer();
    expect(v.net.minor).toBe(v.youAreOwed.minor - v.youOwe.minor);
  });

  it('friend balances are derived, not the hand-typed mock floats', async () => {
    const friends = await mockPort.friends.list();
    expect(friends.length).toBeGreaterThan(0);
    for (const f of friends) {
      expect(Number.isInteger(f.balance.minor)).toBe(true);
    }
    // The old mockFriends[0].balance was -2150.75, which never reconciled with
    // mockExpenses. Whatever the derived value is, it is not that float.
    expect(friends[0].balance.minor).not.toBe(-215075);
  });
});

describe('mutations keep the ledger consistent', () => {
  it('adding an expense keeps net balances at zero', async () => {
    const groups = await mockPort.groups.list();
    const g = groups[0];

    await mockPort.expenses.create({
      groupId: g.id,
      description: 'Test dinner',
      totalMinor: 10000,
      currency: 'INR',
      date: new Date().toISOString(),
      paidByUserId: g.members[0].id,
      participantIds: g.members.slice(0, 3).map((m) => m.id),
    });

    const balances = await mockPort.balances.forGroup(g.id);
    expect(balances.net.reduce((a, b) => a + b.balance.minor, 0)).toBe(0);
  });

  it('splits a new expense through core, so shares sum to the total', async () => {
    const groups = await mockPort.groups.list();
    const g = groups[0];
    const expense = await mockPort.expenses.create({
      groupId: g.id,
      description: 'Three-way split',
      totalMinor: 10000, // the ₹100/3 case
      currency: 'INR',
      date: new Date().toISOString(),
      paidByUserId: g.members[0].id,
      participantIds: g.members.slice(0, 3).map((m) => m.id),
    });
    expect(expense.shares.reduce((a, s) => a + s.amount.minor, 0)).toBe(10000);
    expect(expense.shares.map((s) => s.amount.minor).sort()).toEqual([3333, 3333, 3334]);
  });

  it('rejects an invalid expense rather than storing a bad row', async () => {
    const groups = await mockPort.groups.list();
    await expect(
      mockPort.expenses.create({
        groupId: groups[0].id,
        description: 'Zero',
        totalMinor: 0,
        currency: 'INR',
        date: new Date().toISOString(),
        paidByUserId: groups[0].members[0].id,
        participantIds: [groups[0].members[0].id],
      }),
    ).rejects.toThrow();
  });

  it('recording a settlement moves both positions and keeps the sum zero', async () => {
    const groups = await mockPort.groups.list();
    const g = groups[0];
    const before = await mockPort.balances.forGroup(g.id);
    const debtor = before.net.find((b) => b.balance.minor < 0);

    await mockPort.settlements.create({
      groupId: g.id,
      from: debtor.person.id,
      to: before.net.find((b) => b.balance.minor > 0).person.id,
      amountMinor: 1000,
      currency: 'INR',
    });

    const after = await mockPort.balances.forGroup(g.id);
    expect(after.net.reduce((a, b) => a + b.balance.minor, 0)).toBe(0);
    const debtorAfter = after.net.find((b) => b.person.id === debtor.person.id);
    expect(debtorAfter.balance.minor).toBe(debtor.balance.minor + 1000);
  });
});

describe('persistence', () => {
  it('survives a reload by round-tripping through localStorage', async () => {
    const groups = await mockPort.groups.list();
    await mockPort.expenses.create({
      groupId: groups[0].id,
      description: 'Persisted',
      totalMinor: 5000,
      currency: 'INR',
      date: new Date().toISOString(),
      paidByUserId: groups[0].members[0].id,
      participantIds: [groups[0].members[0].id, groups[0].members[1].id],
    });

    const raw = localStorage.getItem('centiverse.mock.v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    const found = parsed.expenses.find((e) => e.description === 'Persisted');
    expect(found.total.minor).toBe(5000);
    expect(found.total.currency).toBe('INR');
  });
});
