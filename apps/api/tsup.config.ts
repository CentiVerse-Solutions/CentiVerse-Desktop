import { defineConfig } from 'tsup';

/**
 * The workspace packages export raw `.ts` (`"exports": "./src/index.ts"`), which
 * plain `tsc` cannot emit for. Bundling resolves them from source, so the deploy
 * artifact is one file with no workspace-linking at runtime.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Prisma's client is generated into node_modules and must not be inlined.
  external: ['@prisma/client'],
});
