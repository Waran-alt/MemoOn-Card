/**
 * Backend Vitest config (Node environment, TypeScript typecheck in test run).
 *
 * Coverage thresholds are set just below the current suite aggregate so CI fails if coverage
 * regresses meaningfully; raise them when you add tests across large untouched modules (e.g. some
 * services remain partially covered by design until integration tests land).
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/**',
        '**/*.config.ts',
        '**/*.{test,spec}.ts',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/types/**',
        '**/index.ts',
      ],
      thresholds: {
        lines: 76,
        statements: 76,
        branches: 72,
        functions: 78,
      },
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
