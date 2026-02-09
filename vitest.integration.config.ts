import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.integration.test.ts',
      'src/**/*-integration.test.ts',
      'src/**/*integration*.test.ts',
    ],
    setupFiles: ['./vitest.integration.setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      enabled: false,
    },
  },
})
