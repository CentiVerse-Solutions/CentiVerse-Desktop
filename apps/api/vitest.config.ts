import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    // Creates and migrates the test database once. The suite runs against a
    // real Postgres on purpose -- see test/setup/testDb.ts.
    globalSetup: ['./test/setup/globalSetup.ts'],
    // Migrations and the constraint triggers make the database tests slower
    // than a unit suite, and they contend on the same rows if run in parallel.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
