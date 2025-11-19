'use server'

import type { InsightlyClientConfig } from './types'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[Insightly] Missing required environment variable: ${name}`)
  }
  return value
}

function parseNumberEnv(name: string, fallback?: number): number | undefined {
  const raw = process.env[name]
  if (raw === undefined || raw === '') {
    return fallback
  }
  const value = Number(raw)
  if (Number.isNaN(value)) {
    throw new Error(`[Insightly] Environment variable ${name} must be a number`)
  }
  return value
}

export function getInsightlyApiConfig(): InsightlyClientConfig {
  const apiUrl = requireEnv('INSIGHTLY_API_URL').replace(/\/+$/, '')
  const apiKey = requireEnv('INSIGHTLY_API_KEY')
  return { apiUrl, apiKey }
}

export const insightlyDefaults = {
  leadStatusId: parseNumberEnv('INSIGHTLY_DEFAULT_STATUS_ID', 3380784),
  selfReferralLeadSourceId: parseNumberEnv('INSIGHTLY_SELF_REFERRAL_SOURCE_ID', 3442168),
  restorativeLeadSourceId: parseNumberEnv('INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID', 3442170),
  ownerUserId: parseNumberEnv('INSIGHTLY_DEFAULT_OWNER_USER_ID'),
  responsibleUserId: parseNumberEnv('INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID'),
  defaultCountry: process.env.INSIGHTLY_DEFAULT_COUNTRY || 'United States',
  webBaseUrl: process.env.INSIGHTLY_WEB_BASE_URL?.replace(/\/+$/, ''),
}

export function buildInsightlyLeadUrl(leadId: number): string | undefined {
  if (!insightlyDefaults.webBaseUrl) return undefined
  return `${insightlyDefaults.webBaseUrl}/Leads/Details/${leadId}`
}

