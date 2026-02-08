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
      'src/lib/insightly/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
      'src/**/*paper-intake*.test.ts',
    ],
    coverage: {
      enabled: false,
    },
  },
})

