import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Port 5173 is what apps/desktop/tauri.conf.json expects as devUrl.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // ports the "@/*" alias from the old jsconfig.json
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', sourcemap: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    css: false,
    // No artificial latency in tests; the delay exists to exercise loading states
    // in the browser, not to slow the suite down.
    env: { VITE_MOCK_LATENCY_MS: '0' },
  },
});
