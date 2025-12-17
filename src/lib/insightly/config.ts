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
  /**
   * Retry configuration for rate limiting
   * Can be overridden via environment variables if needed
   */
  retryConfig: {
    maxRetries: parseNumberEnv('INSIGHTLY_MAX_RETRIES', 3) || 3,
    initialDelayMs: parseNumberEnv('INSIGHTLY_RETRY_INITIAL_DELAY_MS', 1000) || 1000,
    maxDelayMs: parseNumberEnv('INSIGHTLY_RETRY_MAX_DELAY_MS', 10000) || 10000,
    backoffMultiplier: parseNumberEnv('INSIGHTLY_RETRY_BACKOFF_MULTIPLIER', 2) || 2,
  },
}

/**
 * Formats a Date object to Insightly's required UTC format: yyyy-MM-dd HH:mm:ss
 * Use this utility when adding date fields to lead payloads.
 *
 * @param date - Date object to format
 * @returns Formatted date string in UTC
 *
 * @example
 * const formattedDate = formatInsightlyDate(new Date())
 * payload.CUSTOMFIELD_DATE = formattedDate
 */
export function formatInsightlyDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function buildInsightlyLeadUrl(leadId: number): string | undefined {
  if (!insightlyDefaults.webBaseUrl) return undefined
  return `${insightlyDefaults.webBaseUrl}/Leads/Details/${leadId}`
}
