/**
 * Single integration test setup — env loading, Insightly fallbacks, and Firebase emulator.
 * Used by vitest.integration.config.ts as the sole setupFiles entry.
 */

// 1. Load environment variables FIRST (before any Firebase imports)
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

// 2. Set Insightly fallbacks (for paper-intake integration tests in clean envs)
process.env.INSIGHTLY_API_KEY = process.env.INSIGHTLY_API_KEY || 'test-api-key'
process.env.INSIGHTLY_API_URL =
  process.env.INSIGHTLY_API_URL || 'https://api.na1.insightly.com/v3.1'
process.env.INSIGHTLY_WEB_BASE_URL =
  process.env.INSIGHTLY_WEB_BASE_URL || 'https://crm.na1.insightly.com'

// 3. THEN import vitest and emulator helpers
import { beforeAll, afterAll, beforeEach } from 'vitest'
import {
  setEmulatorEnv,
  clearFirestoreData,
  initializeAdminForEmulator,
} from './admin-emulator-setup'

// Set emulator env vars (after dotenv so .env.local overrides apply)
setEmulatorEnv()

let emulatorsChecked = false

beforeAll(async () => {
  if (!emulatorsChecked) {
    try {
      const response = await fetch('http://127.0.0.1:8080/')
      if (!response.ok) {
        throw new Error('Firestore emulator not responding')
      }
      emulatorsChecked = true
    } catch {
      console.error('\n  Firebase emulators are not running!')
      console.error('  Start them with: pnpm emulators\n')
      throw new Error('Firebase emulators must be running for integration tests')
    }
  }

  initializeAdminForEmulator()
})

beforeEach(async () => {
  await clearFirestoreData()
})

afterAll(async () => {
  await clearFirestoreData()
})
