import type { GroupMember, GroupRole } from '@prisma/client';
import type { Db } from '../db/prisma';
import { ApiError } from '../lib/problem';

/**
 * §6.5 — "the part that gets skipped and shouldn't".
 *
 * One helper, used everywhere, applied in the **service layer** rather than in
 * route handlers. That placement is the whole point: a new route that reuses an
 * existing service cannot forget the check, because the check is not in the
 * route.
 *
 * A non-member gets **404, not 403**. 403 confirms the group exists, which is
 * an information leak — invariant 7 says a user "cannot learn that a group they
 * aren't in exists". 403 is reserved for the different question of a member
 * whose role is too low, where the resource's existence is already known.
 */

const ROLE_RANK: Record<GroupRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export interface MembershipOptions {
  minRole?: GroupRole;
}

export const assertGroupMember = async (
  db: Db,
  userId: string,
  groupId: string,
  options: MembershipOptions = {},
): Promise<GroupMember> => {
  const membership = await db.groupMember.findFirst({
    where: {
      groupId,
      userId,
      // Someone who left keeps their ledger history but loses access.
      leftAt: null,
      group: { deletedAt: null },
    },
  });

  if (membership === null) {
    // Deliberately identical whether the group does not exist, was deleted, or
    // exists and the caller is simply not in it.
    throw ApiError.notFound('no such group');
  }

  const minRole = options.minRole;
  if (minRole !== undefined && ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw ApiError.forbidden(`this action requires the ${minRole} role`);
  }

  return membership;
};

/**
 * §6.5: "Only the expense's creator or a group ADMIN may edit or delete it."
 * Called after `assertGroupMember`, so the caller is known to be a member and
 * 403 is the honest answer here.
 */
export const assertCanMutateExpense = (
  membership: GroupMember,
  expenseCreatedBy: string,
): void => {
  const isCreator = membership.userId === expenseCreatedBy;
  const isAdmin = ROLE_RANK[membership.role] >= ROLE_RANK.ADMIN;
  if (!isCreator && !isAdmin) {
    throw ApiError.forbidden('only the person who added this expense, or a group admin, may change it');
  }
};
