/**
 * Vitest Configuration
 *
 * Unit and component testing configuration for AutoRev.
 * Uses jsdom for browser environment simulation.
 *
 * Usage:
 *   npm run test:unit      - Run tests once
 *   npm run test:unit:watch - Run tests in watch mode
 *
 * @see https://vitest.dev/config/
 */

import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Use jsdom for browser environment simulation
    environment: 'jsdom',

    // Enable global test functions (describe, it, expect)
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./tests/setup.tsx'],

    // Include patterns for test files
    include: [
      'components/**/*.test.{ts,tsx,js,jsx}',
      'lib/**/*.test.{ts,tsx,js,jsx}',
      'hooks/**/*.test.{ts,tsx,js,jsx}',
      'tests/unit/**/*.test.{ts,tsx,js,jsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'tests/e2e/**',
      'tests/integration/**',
      '.next',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.d.ts',
        '.next/',
        'scripts/',
      ],
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporter: ['verbose'],
  },

  // Resolve aliases to match Next.js paths (using path.resolve for spaces in path)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
