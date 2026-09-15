/**
 * @centiverse/contracts -- zod schemas and the types inferred from them.
 *
 * Dependency rule (§3.2): contracts depends on core only. Never on apps.
 *
 * `constants/apiEndpoints.js` in the old codebase was meant to hold endpoint
 * strings. It stays deleted: endpoints become typed functions in Phase 5, not
 * string constants.
 */
export * from './entities/auth';
export * from './entities/common';
export * from './entities/expense';
export * from './entities/user';
