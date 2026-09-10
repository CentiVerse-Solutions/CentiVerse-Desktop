import { describe, it, expect } from 'vitest';
import { calculateExactSplit } from './splitPreview';

/**
 * The form preview must agree with what the port will actually store, since both
 * now go through @centiverse/core. These pin the properties that matter.
 */
describe('calculateExactSplit', () => {
    const sum = (parts) => parts.reduce((a, p) => a + Math.round(parseFloat(p) * 100), 0);

    it('conserves the total -- the ₹100/3 case', () => {
        const parts = calculateExactSplit(100, [1, 2, 3]);
        expect(sum(parts)).toBe(10000);
        expect([...parts].sort()).toEqual(['33.33', '33.33', '33.34']);
    });

    it('conserves the total for awkward amounts and party sizes', () => {
        for (const amount of [0.01, 1, 9.99, 100, 1234.56, 7777.77]) {
            for (const n of [1, 2, 3, 4, 5, 7, 11]) {
                const ids = Array.from({ length: n }, (_, i) => i + 1);
                expect(sum(calculateExactSplit(amount, ids))).toBe(Math.round(amount * 100));
            }
        }
    });

    it('gives the odd unit by userId ASC, not array position (invariant 4)', () => {
        // Same people, opposite display order -- each person keeps their amount.
        const forward = calculateExactSplit(100, ['a', 'b', 'c']);
        const reversed = calculateExactSplit(100, ['c', 'b', 'a']);
        expect(forward).toEqual(['33.34', '33.33', '33.33']);
        expect(reversed).toEqual(['33.33', '33.33', '33.34']);
    });

    it('returns amounts aligned to the ids it was given', () => {
        const ids = [7, 3, 9];
        expect(calculateExactSplit(10, ids)).toHaveLength(ids.length);
    });

    it('handles zero and empty input without throwing', () => {
        expect(calculateExactSplit(0, [1, 2])).toEqual(['0.00', '0.00']);
        expect(calculateExactSplit(100, [])).toEqual([]);
        expect(calculateExactSplit(undefined, [1])).toEqual(['0.00']);
    });
});
