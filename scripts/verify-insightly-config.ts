#!/usr/bin/env npx tsx
/**
 * Verify Insightly API connectivity and configuration
 *
 * This script tests that the Insightly API is accessible and configured correctly.
 * It verifies Lead Sources exist and tests basic API operations.
 *
 * Usage:
 *   npx tsx scripts/verify-insightly-config.ts
 *
 * Or add to package.json:
 *   "verify:insightly": "tsx scripts/verify-insightly-config.ts"
 */

import 'dotenv/config'

// =============================================================================
// Configuration
// =============================================================================

const INSIGHTLY_API_KEY = process.env.INSIGHTLY_API_KEY || ''
const INSIGHTLY_API_URL = process.env.INSIGHTLY_API_URL || 'https://api.na1.insightly.com/v3.1'
const INSIGHTLY_WEB_BASE_URL = process.env.INSIGHTLY_WEB_BASE_URL || 'https://crm.na1.insightly.com'

// Lead sources required for paper intake
const REQUIRED_LEAD_SOURCES = [
  'Web',
  'Phone Inquiry',
  'Partner Referral',
  'Outreach',
  'Other',
]

const PAPER_INTAKE_LEAD_SOURCES = [
  'Staff/Volunteer',
  'Government Agency',
  'Previous Client',
  "State's Attorney",
  'Community Organization',
  'Law Enforcement',
  'Professional Referral',
  'District Court',
  'Circuit Court',
  'Paper Intake',
]

// =============================================================================
// HTTP Client
// =============================================================================

interface InsightlyResponse<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

async function insightlyRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<InsightlyResponse<T>> {
  const url = `${INSIGHTLY_API_URL}${endpoint}`
  const authHeader = `Basic ${Buffer.from(`${INSIGHTLY_API_KEY}:`).toString('base64')}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        ok: false,
        status: response.status,
        error: `${response.status} ${response.statusText}: ${text}`,
      }
    }

    const data = (await response.json()) as T
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

interface TestResult {
  name: string
  passed: boolean
  details?: string
  error?: string
}

interface LeadSource {
  LEAD_SOURCE_ID: number
  LEAD_SOURCE: string
}

interface PipelineStage {
  STAGE_ID: number
  STAGE_NAME: string
  PIPELINE_ID: number
}

interface Pipeline {
  PIPELINE_ID: number
  PIPELINE_NAME: string
  FOR_OPPORTUNITIES: boolean
  FOR_LEADS: boolean
  STAGES?: PipelineStage[]
}

async function testApiConnectivity(): Promise<TestResult> {
  const result = await insightlyRequest<unknown>('/LeadSources')

  if (result.ok) {
    return {
      name: 'API Connectivity',
      passed: true,
      details: `Connected to ${INSIGHTLY_API_URL}`,
    }
  }

  return {
    name: 'API Connectivity',
    passed: false,
    error: result.error,
  }
}

async function testLeadSources(): Promise<TestResult> {
  const result = await insightlyRequest<LeadSource[]>('/LeadSources')

  if (!result.ok || !result.data) {
    return {
      name: 'Lead Sources',
      passed: false,
      error: result.error || 'No data returned',
    }
  }

  const existingNames = result.data.map((ls) => ls.LEAD_SOURCE)
  const missingRequired = REQUIRED_LEAD_SOURCES.filter(
    (name) => !existingNames.includes(name)
  )
  const missingPaperIntake = PAPER_INTAKE_LEAD_SOURCES.filter(
    (name) => !existingNames.includes(name)
  )

  const details: string[] = []
  details.push(`Found ${result.data.length} Lead Sources`)

  if (missingRequired.length > 0) {
    return {
      name: 'Lead Sources',
      passed: false,
      error: `Missing required Lead Sources: ${missingRequired.join(', ')}`,
      details: details.join('; '),
    }
  }

  if (missingPaperIntake.length > 0) {
    details.push(`Paper Intake sources to create: ${missingPaperIntake.join(', ')}`)
    details.push('(These will be auto-created on first use)')
  } else {
    details.push('All Paper Intake Lead Sources exist')
  }

  return {
    name: 'Lead Sources',
    passed: true,
    details: details.join('; '),
  }
}

async function testPipelines(): Promise<TestResult> {
  const result = await insightlyRequest<Pipeline[]>('/Pipelines')

  if (!result.ok || !result.data) {
    return {
      name: 'Pipelines',
      passed: false,
      error: result.error || 'No data returned',
    }
  }

  const leadPipelines = result.data.filter((p) => p.FOR_LEADS)
  const casePipelines = result.data.filter((p) => p.FOR_OPPORTUNITIES)

  const details: string[] = []
  details.push(`Found ${result.data.length} total pipelines`)
  details.push(`Lead pipelines: ${leadPipelines.length}`)
  details.push(`Case (Opportunity) pipelines: ${casePipelines.length}`)

  // Log pipeline details
  casePipelines.forEach((p) => {
    const stageCount = Array.isArray(p.STAGES) ? p.STAGES.length : 0
    details.push(`  - ${p.PIPELINE_NAME} (ID: ${p.PIPELINE_ID}, Stages: ${stageCount})`)
  })

  return {
    name: 'Pipelines',
    passed: true,
    details: details.join('; '),
  }
}

async function testLeadSearch(): Promise<TestResult> {
  // Search for a common name to verify search works
  const postResult = await insightlyRequest<unknown[]>('/Leads/Search', {
    method: 'POST',
    body: JSON.stringify({
      field_name: 'FIRST_NAME',
      field_value: '%',
      operator: 'LIKE',
      top: 1,
    }),
  })

  // Some Insightly tenants only support GET for this endpoint.
  if (!postResult.ok && postResult.status === 405) {
    const query = new URLSearchParams({
      field_name: 'FIRST_NAME',
      field_value: '%',
      operator: 'LIKE',
      top: '1',
    })
    const getResult = await insightlyRequest<unknown[]>(`/Leads/Search?${query.toString()}`)
    if (!getResult.ok) {
      return {
        name: 'Lead Search API',
        passed: false,
        error: getResult.error,
      }
    }
    return {
      name: 'Lead Search API',
      passed: true,
      details: `Search endpoint working (returned ${Array.isArray(getResult.data) ? getResult.data.length : 0} results via GET fallback)`,
    }
  }

  if (!postResult.ok) {
    return {
      name: 'Lead Search API',
      passed: false,
      error: postResult.error,
    }
  }

  return {
    name: 'Lead Search API',
    passed: true,
    details: `Search endpoint working (returned ${Array.isArray(postResult.data) ? postResult.data.length : 0} results)`,
  }
}

async function testUserInfo(): Promise<TestResult> {
  const result = await insightlyRequest<{ USER_ID: number; EMAIL_ADDRESS: string }[]>(
    '/Users'
  )

  if (!result.ok || !result.data) {
    return {
      name: 'User Info',
      passed: false,
      error: result.error || 'No data returned',
    }
  }

  const users = result.data
  const details = `Found ${users.length} users`

  // Check for default owner/responsible users if configured
  const ownerId = process.env.INSIGHTLY_DEFAULT_OWNER_USER_ID
  const responsibleId = process.env.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID

  if (ownerId) {
    const ownerExists = users.some((u) => u.USER_ID === Number.parseInt(ownerId, 10))
    if (!ownerExists) {
      return {
        name: 'User Info',
        passed: false,
        error: `Default Owner User ID ${ownerId} not found in Insightly`,
        details,
      }
    }
  }

  if (responsibleId) {
    const responsibleExists = users.some(
      (u) => u.USER_ID === Number.parseInt(responsibleId, 10)
    )
    if (!responsibleExists) {
      return {
        name: 'User Info',
        passed: false,
        error: `Default Responsible User ID ${responsibleId} not found in Insightly`,
        details,
      }
    }
  }

  return {
    name: 'User Info',
    passed: true,
    details,
  }
}

async function testCustomFields(): Promise<TestResult> {
  // Check for Opportunity (Case) custom fields
  const result = await insightlyRequest<{ FIELD_NAME: string; FIELD_LABEL: string }[]>(
    '/CustomFields/Opportunity'
  )

  if (!result.ok || !result.data) {
    return {
      name: 'Custom Fields',
      passed: false,
      error: result.error || 'No data returned',
    }
  }

  const expectedFields = [
    'Case_Number_NEW__c',
    'Referral_Source__c',
    'Mediation_Case_Type__c',
    'Session_Type__c',
  ]

  const existingFields = result.data.map((f) => f.FIELD_NAME)
  const missingFields = expectedFields.filter((f) => !existingFields.includes(f))

  if (missingFields.length > 0) {
    return {
      name: 'Custom Fields',
      passed: false,
      error: `Missing Opportunity custom fields: ${missingFields.join(', ')}`,
      details: `Found ${result.data.length} custom fields`,
    }
  }

  return {
    name: 'Custom Fields',
    passed: true,
    details: `Found all ${expectedFields.length} required custom fields for Cases`,
  }
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  console.log('\nInsightly API Configuration Verification\n')
  console.log('='.repeat(60))

  // Check configuration
  console.log('\nConfiguration\n')

  if (!INSIGHTLY_API_KEY) {
    console.log('   INSIGHTLY_API_KEY is not set')
    console.log('\n   Please set INSIGHTLY_API_KEY in your .env file')
    process.exit(1)
  }
  console.log('   INSIGHTLY_API_KEY is set')
  console.log(`   API URL: ${INSIGHTLY_API_URL}`)
  console.log(`   Web URL: ${INSIGHTLY_WEB_BASE_URL}`)

  const optionalVars = [
    ['INSIGHTLY_DEFAULT_OWNER_USER_ID', process.env.INSIGHTLY_DEFAULT_OWNER_USER_ID],
    ['INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID', process.env.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID],
    ['INSIGHTLY_DEFAULT_COUNTRY', process.env.INSIGHTLY_DEFAULT_COUNTRY],
  ] as const

  console.log('\n   Optional settings:')
  optionalVars.forEach(([name, value]) => {
    console.log(`   ${value ? 'SET' : 'NOT SET'} ${name}: ${value || '(not set)'}`)
  })

  // Run tests
  console.log('\nRunning Tests...\n')

  const tests = [
    testApiConnectivity,
    testLeadSources,
    testPipelines,
    testLeadSearch,
    testUserInfo,
    testCustomFields,
  ]

  const results: TestResult[] = []

  for (const test of tests) {
    const result = await test()
    results.push(result)

    const icon = result.passed ? 'PASS' : 'FAIL'
    console.log(`   ${icon} ${result.name}`)
    if (result.details) {
      console.log(`      ${result.details}`)
    }
    if (result.error) {
      console.log(`      Error: ${result.error}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\nSummary\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`   Total:  ${results.length}`)
  console.log(`   Passed: ${passed}`)
  console.log(`   Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nSome tests failed. Check the errors above.')
    console.log('\n   Common issues:')
    console.log('   - Invalid API key: Check INSIGHTLY_API_KEY')
    console.log('   - Wrong API URL: Check INSIGHTLY_API_URL (na1, eu1, au1)')
    console.log('   - Missing Lead Sources: Will be auto-created on first sync')
    console.log('   - Missing Custom Fields: May need manual setup in Insightly')
    process.exit(1)
  }

  console.log('\nAll tests passed! Insightly integration is ready.\n')
}

main().catch((error) => {
  console.error('\nUnexpected error:', error)
  process.exit(1)
})
