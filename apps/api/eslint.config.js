import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'prisma/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // The API layer is where money crosses a boundary; a float here is a bug
      // that the type system cannot see, so keep the domain rule visible.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@prisma/client/*'],
          message: 'Import from @prisma/client directly.',
        }],
      }],
    },
  },
];
