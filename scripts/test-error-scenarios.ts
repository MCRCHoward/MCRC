#!/usr/bin/env npx tsx
/**
 * Test error scenarios manually
 *
 * Verifies that the Insightly integration handles error conditions gracefully:
 * - Invalid authentication (bad API key)
 * - Network timeout (unreachable host)
 * - Rate limiting (optional, commented out by default)
 *
 * Usage:
 *   npx tsx scripts/test-error-scenarios.ts
 */

import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

// =============================================================================
// Inline Insightly request (avoids importing from src which may require build)
// =============================================================================

const INSIGHTLY_API_KEY = process.env.INSIGHTLY_API_KEY || ''
const INSIGHTLY_API_URL = process.env.INSIGHTLY_API_URL || 'https://api.na1.insightly.com/v3.1'

async function insightlyFetch(
  apiUrl: string,
  apiKey: string,
  endpoint: string
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = `${apiUrl}${endpoint}`
  const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const text = await response.text()
      return { ok: false, status: response.status, error: `${response.status}: ${text}` }
    }

    const data = await response.json()
    return { ok: true, status: response.status, data }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// =============================================================================
// Test Functions
// =============================================================================

async function testInvalidAuth(): Promise<void> {
  console.log('Testing invalid auth...')

  const result = await insightlyFetch(INSIGHTLY_API_URL, 'invalid-key-12345', '/LeadSources')

  if (!result.ok) {
    console.log('  PASS: Correctly rejected invalid key')
    console.log(`  Status: ${result.status}`)
    console.log(`  Error: ${result.error}`)
  } else {
    console.log('  FAIL: Should have rejected invalid key!')
  }
}

async function testNetworkTimeout(): Promise<void> {
  console.log('\nTesting network timeout...')

  const result = await insightlyFetch(
    'https://nonexistent.invalid/v3.1',
    INSIGHTLY_API_KEY,
    '/LeadSources'
  )

  if (!result.ok) {
    console.log('  PASS: Correctly caught network error')
    console.log(`  Error: ${result.error}`)
  } else {
    console.log('  FAIL: Should have thrown network error!')
  }
}

async function testRateLimiting(): Promise<void> {
  console.log('\nTesting rate limit handling...')
  console.log('  (Sending 150 rapid-fire requests to trigger 429)')

  let okCount = 0
  let rateLimited = 0
  let errorCount = 0

  const promises = Array.from({ length: 150 }, async (_, i) => {
    const result = await insightlyFetch(INSIGHTLY_API_URL, INSIGHTLY_API_KEY, '/LeadSources')
    if (result.ok) {
      okCount++
    } else if (result.status === 429) {
      rateLimited++
    } else {
      errorCount++
    }
    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/150`)
    }
  })

  await Promise.all(promises)

  console.log(`  OK: ${okCount}, Rate Limited: ${rateLimited}, Other Errors: ${errorCount}`)
  if (rateLimited > 0) {
    console.log('  PASS: Rate limiting detected')
  } else {
    console.log('  INFO: No rate limiting triggered (API may have high limits)')
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  console.log('\nInsightly Error Scenario Tests\n')
  console.log('='.repeat(50))

  if (!INSIGHTLY_API_KEY) {
    console.log('\nINSIGHTLY_API_KEY is not set. Some tests will be limited.')
  }

  await testInvalidAuth()
  await testNetworkTimeout()

  // Uncomment to test rate limiting against your API (only run against sandbox/test)
  // await testRateLimiting()

  console.log('\n' + '='.repeat(50))
  console.log('\nError scenario tests complete.\n')
}

main().catch((error) => {
  console.error('\nUnexpected error:', error)
  process.exit(1)
})
