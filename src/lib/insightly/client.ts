'use server'

import { getInsightlyApiConfig } from './config'
import type { InsightlyLeadPayload, InsightlyLeadResponse } from './types'

function buildAuthHeader(apiKey: string): string {
  const token = Buffer.from(`${apiKey}:`).toString('base64')
  return `Basic ${token}`
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
    hasEmail: !!payload.EMAIL_ADDRESS,
    hasPhone: !!payload.PHONE,
    hasDescription: !!payload.LEAD_DESCRIPTION,
    hasLeadSource: !!payload.LEAD_SOURCE_ID,
    tagsCount: payload.TAGS?.length || 0,
    customFieldsCount: payload.CUSTOMFIELDS?.length || 0,
  })

  console.log('[Insightly API] Sending request...')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(apiKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  console.log('[Insightly API] Response received', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: {
      contentType: response.headers.get('content-type'),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    console.error('[Insightly API] Request failed', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    })
    throw new Error(
      `[Insightly] Failed to create lead (${response.status} ${response.statusText}) ${errorBody}`,
    )
  }

  const responseData = (await response.json()) as InsightlyLeadResponse
  console.log('[Insightly API] Lead created successfully', {
    leadId: responseData.LEAD_ID,
    hasLeadId: !!responseData.LEAD_ID,
  })

  return responseData
}

