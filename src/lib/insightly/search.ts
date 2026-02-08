/**
 * Insightly Search and Lead Source Management
 *
 * Functions for searching Leads/Cases and managing Lead Sources
 * for the paper intake data entry feature.
 */

import { insightlyDefaults } from './config'
import {
  INSIGHTLY_API_KEY,
  INSIGHTLY_API_URL,
  EXISTING_LEAD_SOURCES,
  LEAD_SOURCES_TO_CREATE,
  buildLeadUrl,
  setLeadSourceCache,
  getCachedLeadSourceId,
} from './paper-intake-config'
import type { LeadSearchResult, DuplicateCheckResult } from '@/types/paper-intake'

// =============================================================================
// API Helpers
// =============================================================================

interface InsightlyRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

function buildAuthHeader(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`).toString('base64')
  return `Basic ${token}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      const errorJson = await response.json()
      if (typeof errorJson === 'object' && errorJson !== null) {
        if ('message' in errorJson && typeof errorJson.message === 'string') {
          return errorJson.message
        }
        if ('error' in errorJson && typeof errorJson.error === 'string') {
          return errorJson.error
        }
        return JSON.stringify(errorJson, null, 2)
      }
      return String(errorJson)
    } catch {
      // Fallback to text if JSON parsing fails
    }
  }
  return await response.text().catch(() => 'Unknown error')
}

async function makeRequestWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig = insightlyDefaults.retryConfig,
): Promise<Response> {
  let lastError: Error | null = null
  let delay = retryConfig.initialDelayMs

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay

        if (attempt < retryConfig.maxRetries) {
          await sleep(Math.min(retryDelay, retryConfig.maxDelayMs))
          delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs)
          continue
        }

        throw new Error('[Insightly] Rate limit exceeded. Please try again later.')
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < retryConfig.maxRetries) {
        await sleep(delay)
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs)
      } else {
        throw lastError
      }
    }
  }

  throw lastError || new Error('[Insightly] Request failed after retries')
}

/**
 * Make an authenticated request to the Insightly API
 */
export async function insightlyRequest<T>(
  endpoint: string,
  options: InsightlyRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body } = options

  if (!INSIGHTLY_API_KEY) {
    throw new Error('Insightly API key is not configured')
  }

  const url = `${INSIGHTLY_API_URL}${endpoint}`
  const headers: HeadersInit = {
    Authorization: buildAuthHeader(INSIGHTLY_API_KEY),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const response = await makeRequestWithRetry(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await parseErrorResponse(response)
    throw new Error(`Insightly API error (${response.status}): ${errorText}`)
  }

  const text = await response.text()
  if (!text) return {} as T

  return JSON.parse(text) as T
}

// =============================================================================
// Lead Source Management
// =============================================================================

interface InsightlyLeadSource {
  LEAD_SOURCE_ID: number
  LEAD_SOURCE: string
  DEFAULT_VALUE: boolean
  FIELD_ORDER: number
}

/**
 * Fetch all Lead Sources from Insightly
 */
export async function fetchLeadSources(): Promise<InsightlyLeadSource[]> {
  return insightlyRequest<InsightlyLeadSource[]>('/LeadSources')
}

/**
 * Create a new Lead Source in Insightly
 */
export async function createLeadSource(sourceName: string): Promise<InsightlyLeadSource> {
  return insightlyRequest<InsightlyLeadSource>('/LeadSources', {
    method: 'POST',
    body: {
      LEAD_SOURCE: sourceName,
      DEFAULT_VALUE: false,
    },
  })
}

/**
 * Ensure all required Lead Sources exist in Insightly
 * Creates any missing ones and returns a map of name → ID
 */
export async function ensureLeadSourcesExist(): Promise<{
  success: boolean
  leadSources: Record<string, number>
  created: string[]
  errors: string[]
}> {
  const created: string[] = []
  const errors: string[] = []

  try {
    const existingSources = await fetchLeadSources()
    const sourceMap: Record<string, number> = { ...EXISTING_LEAD_SOURCES }

    for (const source of existingSources) {
      sourceMap[source.LEAD_SOURCE] = source.LEAD_SOURCE_ID
    }

    const sourcesToCreate = LEAD_SOURCES_TO_CREATE.filter(
      (name) => !sourceMap[name],
    )

    for (const sourceName of sourcesToCreate) {
      try {
        const newSource = await createLeadSource(sourceName)
        sourceMap[newSource.LEAD_SOURCE] = newSource.LEAD_SOURCE_ID
        created.push(sourceName)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to create "${sourceName}": ${message}`)
      }
    }

    setLeadSourceCache(sourceMap)

    return {
      success: errors.length === 0,
      leadSources: sourceMap,
      created,
      errors,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      leadSources: {},
      created: [],
      errors: [`Failed to fetch Lead Sources: ${message}`],
    }
  }
}

/**
 * Get Lead Source ID by name, with lazy initialization
 */
export async function getLeadSourceId(
  sourceName: string,
): Promise<number | undefined> {
  let id = getCachedLeadSourceId(sourceName)
  if (id !== undefined) return id

  const result = await ensureLeadSourcesExist()
  return result.leadSources[sourceName]
}

// =============================================================================
// Lead Search
// =============================================================================

interface InsightlyLead {
  LEAD_ID: number
  FIRST_NAME: string | null
  LAST_NAME: string | null
  EMAIL: string | null
  PHONE: string | null
  LEAD_STATUS_ID: number | null
  DATE_CREATED_UTC: string
  TAGS?: Array<{ TAG_NAME: string }>
}

interface InsightlyLeadStatus {
  LEAD_STATUS_ID: number
  LEAD_STATUS: string
}

let leadStatusCache: Record<number, string> | null = null

async function getLeadStatusName(statusId: number | null): Promise<string> {
  if (!statusId) return 'Unknown'

  if (!leadStatusCache) {
    try {
      const statuses = await insightlyRequest<InsightlyLeadStatus[]>('/LeadStatuses')
      leadStatusCache = {}
      for (const status of statuses) {
        leadStatusCache[status.LEAD_STATUS_ID] = status.LEAD_STATUS
      }
    } catch {
      return 'Unknown'
    }
  }

  return leadStatusCache[statusId] || 'Unknown'
}

/**
 * Search for Leads by name
 * Uses the Insightly search API
 */
export async function searchLeadsByName(
  firstName: string,
  lastName: string,
): Promise<LeadSearchResult[]> {
  try {
    const params = new URLSearchParams()

    if (firstName && lastName) {
      params.set('first_name', firstName)
      params.set('last_name', lastName)
    } else if (lastName) {
      params.set('last_name', lastName)
    } else if (firstName) {
      params.set('first_name', firstName)
    } else {
      return []
    }

    params.set('top', '20')
    params.set('brief', 'false')

    const leads = await insightlyRequest<InsightlyLead[]>(
      `/Leads?${params.toString()}`,
    )

    const results: LeadSearchResult[] = []

    for (const lead of leads) {
      const statusName = await getLeadStatusName(lead.LEAD_STATUS_ID)

      results.push({
        leadId: lead.LEAD_ID,
        firstName: lead.FIRST_NAME || '',
        lastName: lead.LAST_NAME || '',
        fullName:
          [lead.FIRST_NAME, lead.LAST_NAME].filter(Boolean).join(' ') || 'Unknown',
        email: lead.EMAIL || undefined,
        phone: lead.PHONE || undefined,
        leadStatus: statusName,
        leadUrl: buildLeadUrl(lead.LEAD_ID),
        createdAt: lead.DATE_CREATED_UTC,
        tags: lead.TAGS?.map((t) => t.TAG_NAME),
      })
    }

    return results
  } catch (error) {
    console.error('[Insightly] Error searching leads:', error)
    throw error
  }
}

/**
 * Search for Leads by email
 */
export async function searchLeadsByEmail(email: string): Promise<LeadSearchResult[]> {
  if (!email) return []

  try {
    const params = new URLSearchParams()
    params.set('email', email)
    params.set('top', '20')
    params.set('brief', 'false')

    const leads = await insightlyRequest<InsightlyLead[]>(
      `/Leads?${params.toString()}`,
    )

    const results: LeadSearchResult[] = []

    for (const lead of leads) {
      const statusName = await getLeadStatusName(lead.LEAD_STATUS_ID)

      results.push({
        leadId: lead.LEAD_ID,
        firstName: lead.FIRST_NAME || '',
        lastName: lead.LAST_NAME || '',
        fullName:
          [lead.FIRST_NAME, lead.LAST_NAME].filter(Boolean).join(' ') || 'Unknown',
        email: lead.EMAIL || undefined,
        phone: lead.PHONE || undefined,
        leadStatus: statusName,
        leadUrl: buildLeadUrl(lead.LEAD_ID),
        createdAt: lead.DATE_CREATED_UTC,
        tags: lead.TAGS?.map((t) => t.TAG_NAME),
      })
    }

    return results
  } catch (error) {
    console.error('[Insightly] Error searching leads by email:', error)
    throw error
  }
}

/**
 * Check for potential duplicate Leads
 * Searches by name and optionally by email
 */
export async function checkForDuplicates(
  name: string,
  email?: string,
): Promise<DuplicateCheckResult> {
  const nameParts = name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const allMatches: LeadSearchResult[] = []
  const seenIds = new Set<number>()

  if (firstName || lastName) {
    try {
      const nameMatches = await searchLeadsByName(firstName, lastName)
      for (const match of nameMatches) {
        if (!seenIds.has(match.leadId)) {
          seenIds.add(match.leadId)
          allMatches.push(match)
        }
      }
    } catch (error) {
      console.error('[Insightly] Name search failed:', error)
    }
  }

  if (email) {
    try {
      const emailMatches = await searchLeadsByEmail(email)
      for (const match of emailMatches) {
        if (!seenIds.has(match.leadId)) {
          seenIds.add(match.leadId)
          allMatches.push(match)
        }
      }
    } catch (error) {
      console.error('[Insightly] Email search failed:', error)
    }
  }

  return {
    hasPotentialDuplicates: allMatches.length > 0,
    matches: allMatches,
    searchedName: name,
  }
}

/**
 * Get a single Lead by ID
 */
export async function getLeadById(leadId: number): Promise<InsightlyLead | null> {
  try {
    return await insightlyRequest<InsightlyLead>(`/Leads/${leadId}`)
  } catch (error) {
    console.error(`[Insightly] Error fetching lead ${leadId}:`, error)
    return null
  }
}

// =============================================================================
// Case (Opportunity) Search
// =============================================================================

interface InsightlyOpportunity {
  OPPORTUNITY_ID: number
  OPPORTUNITY_NAME: string
  OPPORTUNITY_STATE: string
  PIPELINE_ID: number
  STAGE_ID: number
  DATE_CREATED_UTC: string
  CUSTOMFIELDS?: Array<{
    FIELD_NAME: string
    FIELD_VALUE: unknown
  }>
}

/**
 * Search for Cases by case number
 */
export async function searchCasesByCaseNumber(
  caseNumber: string,
): Promise<InsightlyOpportunity[]> {
  if (!caseNumber) return []

  try {
    const params = new URLSearchParams()
    params.set('top', '10')
    params.set('brief', 'false')

    const opportunities = await insightlyRequest<InsightlyOpportunity[]>(
      `/Opportunities/Search?${params.toString()}`,
      {
        method: 'POST',
        body: {
          field_name: 'OPPORTUNITY_NAME',
          field_value: caseNumber,
          operator: 'CONTAINS',
        },
      },
    )

    return opportunities
  } catch (error) {
    console.error('[Insightly] Error searching cases:', error)
    return []
  }
}
