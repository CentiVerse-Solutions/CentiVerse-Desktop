import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // type-only modules and barrels have no runtime code to cover
      exclude: ['src/index.ts', 'src/types.ts', 'src/split/strategies.ts'],
      // §4.5: 100% branch coverage is the stated target for this package.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
