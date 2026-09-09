import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      // §4.5: 100% branch coverage is the stated target for this package.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
});
