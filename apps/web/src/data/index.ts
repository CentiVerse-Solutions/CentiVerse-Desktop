import type { DataPort } from './port';
import { mockPort } from './mock';

/**
 * §5.2 -- backend cutover is one env var, not a rewrite.
 *
 * `httpPort` lands in Phase 5 and slots in here with identical signatures.
 * Mock mode stays forever: it is the demo build and the E2E harness
 * (invariant 10).
 */
export const data: DataPort = mockPort;

export * from './port';
export { resetMockData } from './mock';
