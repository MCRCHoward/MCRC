'use server'

import { getInsightlyApiConfig, insightlyDefaults } from './config'
import type { InsightlyLeadPayload, InsightlyLeadResponse } from './types'

function buildAuthHeader(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`).toString('base64')
  return `Basic ${token}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      const errorJson = await response.json()
      // Insightly may return structured error objects
      if (typeof errorJson === 'object' && errorJson !== null) {
        if ('message' in errorJson && typeof errorJson.message === 'string') {
          return errorJson.message
        }
        if ('error' in errorJson && typeof errorJson.error === 'string') {
          return errorJson.error
        }
        // Return stringified JSON for structured errors
        return JSON.stringify(errorJson, null, 2)
      }
      return String(errorJson)
    } catch {
      // Fallback to text if JSON parsing fails
    }
  }
  // Fallback to text
  return await response.text().catch(() => 'Unknown error')
}

function validateResponse(data: unknown): InsightlyLeadResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('[Insightly] Invalid response: expected object')
  }
  const response = data as Record<string, unknown>
  if (typeof response.LEAD_ID !== 'number') {
    throw new Error(
      `[Insightly] Invalid response: missing or invalid LEAD_ID. Received: ${JSON.stringify(response)}`,
    )
  }
  return response as InsightlyLeadResponse
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

      // Log rate limit headers
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit')
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
      if (rateLimitLimit || rateLimitRemaining) {
        console.log('[Insightly API] Rate limit headers', {
          limit: rateLimitLimit,
          remaining: rateLimitRemaining,
        })
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay

        if (attempt < retryConfig.maxRetries) {
          console.warn(
            `[Insightly API] Rate limit exceeded (429). Retrying after ${retryDelay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`,
          )
          await sleep(Math.min(retryDelay, retryConfig.maxDelayMs))
          delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs)
          continue
        } else {
          throw new Error(
            `[Insightly] Rate limit exceeded. Daily limit reached. Please try again later.`,
          )
        }
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Only retry on network errors or 429, not on other HTTP errors
      if (
        attempt < retryConfig.maxRetries &&
        !(error instanceof Error && error.message.includes('Rate limit'))
      ) {
        console.warn(
          `[Insightly API] Request failed, retrying after ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`,
          { error: lastError.message },
        )
        await sleep(delay)
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelayMs)
      } else {
        throw lastError
      }
    }
  }

  throw lastError || new Error('[Insightly] Request failed after retries')
}

export async function createInsightlyLead(
  payload: InsightlyLeadPayload,
): Promise<InsightlyLeadResponse> {
  const { apiUrl, apiKey } = getInsightlyApiConfig()
  const url = `${apiUrl}/Leads`

  console.log('[Insightly API] Preparing request', {
    url,
    method: 'POST',
    hasApiKey: !!apiKey,
  })

  // Log sanitized payload (no sensitive data)
  console.log('[Insightly API] Request payload structure', {
    hasLastName: !!payload.LAST_NAME,
    hasFirstName: !!payload.FIRST_NAME,
    hasEmail: !!payload.EMAIL,
    hasPhone: !!payload.PHONE,
    hasDescription: !!payload.LEAD_DESCRIPTION,
    hasLeadSource: !!payload.LEAD_SOURCE_ID,
    tagsCount: payload.TAGS?.length || 0,
  })

  console.log('[Insightly API] Sending request...')
  const response = await makeRequestWithRetry(url, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(apiKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate', // HTTP compression support
    },
    body: JSON.stringify(payload),
  })

  console.log('[Insightly API] Response received', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: {
      contentType: response.headers.get('content-type'),
      rateLimitLimit: response.headers.get('X-RateLimit-Limit'),
      rateLimitRemaining: response.headers.get('X-RateLimit-Remaining'),
    },
  })

  if (!response.ok) {
    const errorBody = await parseErrorResponse(response)
    console.error('[Insightly API] Request failed', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    })
    throw new Error(
      `[Insightly] Failed to create lead (${response.status} ${response.statusText}) ${errorBody}`,
    )
  }

  const responseData = await response.json()
  const validatedResponse = validateResponse(responseData)
  console.log('[Insightly API] Lead created successfully', {
    leadId: validatedResponse.LEAD_ID,
    hasLeadId: !!validatedResponse.LEAD_ID,
  })

  return validatedResponse
}
