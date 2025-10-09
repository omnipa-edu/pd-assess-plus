// eslint.config.js — ESLint v9 (Flat Config) for Vite + React + TypeScript + Tailwind
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tailwind from 'eslint-plugin-tailwindcss';
import importPlugin from 'eslint-plugin-import';

// Prettier turns off formatting-related ESLint rules
// With Flat Config, we emulate "extends: ['prettier']" by appending a config that only sets rule overrides:
const prettierConfig = {
  name: 'prettier-overrides',
  rules: {
    // let Prettier handle formatting—avoid conflicts
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
  },
};

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/generated/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.config.{js,ts}',
      '**/vite.config.ts',
      '**/tailwind.config.ts',
      '**/vitest.config.ts',
      '**/playwright.config.ts',
    ],
  },

  // Base JS (applies to .js/.mjs/.cjs)
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globalThis,
      },
    },
    ...js.configs.recommended,
  },

  // TypeScript + React (applies to .ts/.tsx)
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Auto-detect tsconfig.json
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      tailwindcss: {
        callees: ['cn', 'clsx'], // classnames helper functions
        config: 'tailwind.config.ts',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      tailwindcss: tailwind,
      import: importPlugin,
    },
    rules: {
      // --- TypeScript ---
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // --- React / Hooks / Refresh ---
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off', // TypeScript handles this
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'warn',
      'react/self-closing-comp': 'warn',
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // --- A11y ---
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // --- Imports ---
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
        },
      ],
      'import/no-unresolved': 'off', // handled by TypeScript
      'import/no-duplicates': 'warn',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',

      // --- Tailwind ---
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-contradicting-classname': 'error',

      // --- General ---
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },

  // Test files - relax some rules
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Prettier-style overrides last
  prettierConfig,
);
