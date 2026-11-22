// ABOUTME: Vitest configuration for the site and preview verification skill.
// ABOUTME: Uses jsdom environment and resolves path aliases from tsconfig.
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      '.agents/skills/verify-preview-nvidia/scripts/*.test.mjs',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@components': resolve(import.meta.dirname, './src/components'),
      '@layouts': resolve(import.meta.dirname, './src/layouts'),
      '@lib': resolve(import.meta.dirname, './src/lib'),
    },
  },
});
