import type { Group } from '../../data/port';
import type { LegacyExpense } from '../../data/legacy';

/**
 * An activity feed row: an expense plus the group it belongs to and the
 * viewer-relative settlement info the page computes.
 */
export interface ActivityRow extends LegacyExpense {
  group: Group | null;
  type: 'expense' | 'settlement';
  isSettled?: boolean;
  userIsPayer?: boolean;
  userShare?: number;
}
