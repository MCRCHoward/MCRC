import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/events/**', 'src/app/**/events/**'],
      exclude: ['**/__tests__/**', '**/*.test.ts'],
    },
    projects: [
      // Unit / integration tests
      {
        test: {
          name: 'unit',
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
          exclude: ['src/__tests__/integration/**'],
          environment: 'node',
        },
        resolve: {
          alias: {
            '@': path.resolve(dirname, 'src'),
          },
        },
      },
      // Storybook visual tests
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
})
