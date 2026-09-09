import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from './index';
import { qk } from './queryKeys';
import type { CreateExpenseInput, CreateGroupInput, CreateSettlementInput, GroupId } from './port';

/**
 * §5.3 -- TanStack Query owns all server state. React Context was the wrong tool
 * for it: it re-renders the world and gives no caching, deduping, retry or
 * invalidation. Context survives only for auth session, theme and toasts.
 */

export const useViewerQuery = () =>
  useQuery({ queryKey: qk.viewer.self, queryFn: () => data.viewer.get() });

export const useGroups = () =>
  useQuery({ queryKey: qk.groups.all, queryFn: () => data.groups.list() });

export const useGroup = (id: GroupId | undefined) =>
  useQuery({
    queryKey: qk.groups.detail(id as GroupId),
    queryFn: () => data.groups.get(id as GroupId),
    enabled: id !== undefined && !Number.isNaN(id),
  });

export const useGroupExpenses = (id: GroupId | undefined) =>
  useQuery({
    queryKey: qk.groups.expenses(id as GroupId),
    queryFn: () => data.expenses.listByGroup(id as GroupId),
    enabled: id !== undefined && !Number.isNaN(id),
  });

export const useGroupBalances = (id: GroupId | undefined) =>
  useQuery({
    queryKey: qk.groups.balances(id as GroupId),
    queryFn: () => data.balances.forGroup(id as GroupId),
    enabled: id !== undefined && !Number.isNaN(id),
  });

export const useViewerBalances = () =>
  useQuery({ queryKey: qk.viewer.balances, queryFn: () => data.balances.forViewer() });

export const useFriends = () =>
  useQuery({ queryKey: qk.friends.all, queryFn: () => data.friends.list() });

export const useActivity = (limit = 50) =>
  useQuery({ queryKey: qk.viewer.activity, queryFn: () => data.activity.list(limit) });

export const useRecentExpenses = (limit = 5) =>
  useQuery({ queryKey: qk.expenses.recent(limit), queryFn: () => data.expenses.listRecent(limit) });

/** Anything that changes the ledger invalidates every derived view. */
const useLedgerInvalidation = () => {
  const qc = useQueryClient();
  return (groupId?: GroupId | null) => {
    void qc.invalidateQueries({ queryKey: qk.viewer.balances });
    void qc.invalidateQueries({ queryKey: qk.viewer.activity });
    void qc.invalidateQueries({ queryKey: qk.friends.all });
    void qc.invalidateQueries({ queryKey: ['expenses'] });
    if (groupId !== undefined && groupId !== null) {
      void qc.invalidateQueries({ queryKey: qk.groups.expenses(groupId) });
      void qc.invalidateQueries({ queryKey: qk.groups.balances(groupId) });
      void qc.invalidateQueries({ queryKey: qk.groups.settlements(groupId) });
    }
  };
};

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => data.groups.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups.all }),
  });
};

export const useCreateExpense = () => {
  const invalidate = useLedgerInvalidation();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => data.expenses.create(input),
    onSuccess: (expense) => invalidate(expense.groupId),
  });
};

export const useDeleteExpense = (groupId?: GroupId | null) => {
  const invalidate = useLedgerInvalidation();
  return useMutation({
    mutationFn: (id: number) => data.expenses.remove(id),
    onSuccess: () => invalidate(groupId),
  });
};

export const useCreateSettlement = () => {
  const invalidate = useLedgerInvalidation();
  return useMutation({
    mutationFn: (input: CreateSettlementInput) => data.settlements.create(input),
    onSuccess: (settlement) => invalidate(settlement.groupId),
  });
};
