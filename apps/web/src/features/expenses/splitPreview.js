/**
 * Equal-split preview used by the expense form.
 *
 * NOTE: this duplicates the largest-remainder allocator in @centiverse/core
 * and therefore violates non-negotiable 2. It is lifted here VERBATIM so the
 * 7.4 extraction stays behaviour-preserving; the next commit replaces it with
 * core's allocateEvenly, which is what 7.6 means by a live preview from core.
 */
const calculateExactSplit = (amount, numParticipants) => {
    // Use exact cents calculations to avoid floating point issues
    const amountInCents = Math.round(amount * 100);
    const shareInCents = Math.floor(amountInCents / numParticipants);

    // Calculate remainder to distribute
    const remainderCents = amountInCents - (shareInCents * numParticipants);

    // Create array of shares with base amount
    const shares = Array(numParticipants).fill(shareInCents);

    // Distribute the remainder one cent at a time
    for (let i = 0; i < remainderCents; i++) {
        shares[i]++;
    }

    // Convert back to dollars
    return shares.map(cents => (cents / 100).toFixed(2));
};

export { calculateExactSplit };
