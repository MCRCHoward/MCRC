import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/lib/insightly/__tests__/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
})

