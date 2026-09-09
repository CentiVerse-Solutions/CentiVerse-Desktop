import type { UserId } from './types';

/**
 * Ascending userId comparison, the deterministic tie-break behind §4.3.
 * Extracted so both the allocator and simplifyDebts share exactly one
 * definition -- if these ever diverged, client and server would disagree.
 */
export const compareIds = (a: UserId, b: UserId): number => (a < b ? -1 : a > b ? 1 : 0);
