import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Files that already import MUI. The ban below stops NEW ones appearing;
 *  these migrate off feature-by-feature and the packages go in Phase 7 (ADR 0001, §12 #8). */
const MUI_ALLOWLIST = [
  'src/context/ThemeContext.jsx',
  'src/components/activity/ActivityFeed/ActivityFeed.jsx',
  'src/components/common/ThemeToggle/ThemeToggle.jsx',
  'src/components/layout/Navbar/Navbar.jsx',
];

export default [
  { ignores: ['dist/**', 'build/**', 'node_modules/**'] },
  js.configs.recommended,
  // TypeScript files need the TS parser; without it `interface` is a syntax error.
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Pre-existing debt in the un-decomposed pages: visible, not blocking.
      // These clear as files are extracted and typed in Phase 4.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      // §12 #8 / non-negotiable 10 -- no NEW MUI.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@mui/*', '@mui/**', '@emotion/*', '@emotion/**'],
          message:
            'MUI is being removed (ARCHITECTURE.md 7.5, non-negotiable 10). Use the Radix/shadcn primitives in components/ui plus lucide-react icons.',
        }],
      }],
    },
  },
  // TS-specific rule tuning, in the same block that registers the plugin.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  { files: ['**/*.test.{js,jsx}', 'src/setupTests.js'], languageOptions: { globals: { ...globals.node, ...globals.vitest } } },
  // Node context: build config and the Playwright suite.
  {
    files: ['vite.config.js', 'eslint.config.js', 'playwright.config.js', 'e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // existing MUI usages stay legal until their feature is migrated
  { files: MUI_ALLOWLIST, rules: { 'no-restricted-imports': 'off' } },
];
