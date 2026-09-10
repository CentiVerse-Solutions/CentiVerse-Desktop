import { allocateEvenly, money } from '@centiverse/core';

/**
 * Equal-split preview for the expense form.
 *
 * This previously reimplemented largest-remainder allocation inside
 * GroupDetails, which breaks non-negotiable 2 ("splits are computed only by
 * @centiverse/core"). It now delegates to core's allocator, so the preview the
 * user sees while typing is produced by the same code that computes the shares
 * actually stored — §7.6's "live preview from core".
 *
 * Behavioural note: the multiset of amounts is unchanged, but the odd minor unit
 * now goes to the lowest userId rather than to whoever happened to be first in
 * the array. That is invariant 4's deterministic tie-break, and it is what makes
 * the preview agree with the server byte for byte.
 *
 * @param amountMajor   amount in major units, as typed by the user
 * @param participantIds ids in display order
 * @returns             major-unit strings aligned to `participantIds`
 */
export const calculateExactSplit = (amountMajor, participantIds, currency = 'INR') => {
    const ids = (participantIds ?? []).map(String);
    if (ids.length === 0) return [];

    const minor = Math.round((Number(amountMajor) || 0) * 100);
    const shares = allocateEvenly(money(minor, currency), ids);
    const byId = new Map(shares.map((s) => [s.userId, s.amount.minor]));

    return ids.map((id) => ((byId.get(id) ?? 0) / 100).toFixed(2));
};
