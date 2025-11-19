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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(apiKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `[Insightly] Failed to create lead (${response.status} ${response.statusText}) ${errorBody}`,
    )
  }

  return (await response.json()) as InsightlyLeadResponse
}

