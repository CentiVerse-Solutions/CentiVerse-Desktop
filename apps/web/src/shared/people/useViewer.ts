import { VIEWER_ID } from './viewer';

/**
 * The current viewer's identity. One place for every component to ask "who am
 * I?", so no component hardcodes the answer.
 *
 * Phase 3 replaces the constant with the session from the data seam; every
 * caller keeps working because they already ask through this hook.
 */
export const useViewer = () => ({ viewerId: VIEWER_ID });
