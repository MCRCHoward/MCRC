import { config as loadEnv } from 'dotenv'
import { beforeAll, afterAll } from 'vitest'

// Load environment variables matching project convention (.env.local first, then .env)
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

beforeAll(() => {
  // Provide fallback env vars so tests run even without a real Insightly key
  process.env.INSIGHTLY_API_KEY = process.env.INSIGHTLY_API_KEY || 'test-api-key'
  process.env.INSIGHTLY_API_URL =
    process.env.INSIGHTLY_API_URL || 'https://api.na1.insightly.com/v3.1'
  process.env.INSIGHTLY_WEB_BASE_URL =
    process.env.INSIGHTLY_WEB_BASE_URL || 'https://crm.na1.insightly.com'
})

afterAll(() => {
  // Cleanup if needed
})
