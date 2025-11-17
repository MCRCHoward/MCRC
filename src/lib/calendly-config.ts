/**
 * Calendly Configuration
 *
 * Maps form types to Calendly event types and provides configuration helpers.
 * Event type mappings can be overridden in Firestore for admin configurability.
 */

import type { FormType } from './service-area-config'

/**
 * Calendly environment type
 */
export type CalendlyEnvironment = 'production' | 'sandbox'

/**
 * Calendly OAuth credentials structure
 */
export interface CalendlyCredentials {
  clientId: string
  clientSecret: string
  redirectUri: string
  webhookSigningKey: string
  environment: CalendlyEnvironment
}

/**
 * Default form to event type mappings
 * These can be overridden in Firestore settings/calendly document
 */
export const DEFAULT_FORM_TO_EVENT_TYPE: Record<FormType, string | null> = {
  'mediation-self-referral': null, // Will be configured in admin UI
  'restorative-program-referral': null,
  'group-facilitation-inquiry': null,
  'community-education-training-request': null,
} as const

/**
 * Calendly API Base URLs
 * Note: Calendly uses the same API endpoint for both production and sandbox environments
 */
export const CALENDLY_API_BASE: Record<CalendlyEnvironment, string> = {
  production: 'https://api.calendly.com',
  sandbox: 'https://api.calendly.com',
} as const

/**
 * Calendly OAuth URLs
 * Note: Calendly uses the same OAuth endpoint for both production and sandbox environments
 */
export const CALENDLY_OAUTH_BASE: Record<CalendlyEnvironment, string> = {
  production: 'https://auth.calendly.com',
  sandbox: 'https://auth.calendly.com',
} as const

/**
 * Get the Calendly event type URI for a form type
 * First checks Firestore settings, then falls back to defaults
 *
 * @param formType - The form type identifier
 * @param eventTypeMappings - Optional mappings from Firestore (if available)
 * @returns Event type URI or null if not configured
 */
export function getEventTypeForForm(
  formType: FormType,
  eventTypeMappings?: Record<string, string>,
): string | null {
  // Check Firestore mappings first (admin-configured)
  if (eventTypeMappings && eventTypeMappings[formType]) {
    return eventTypeMappings[formType] ?? null
  }

  // Fall back to defaults
  return DEFAULT_FORM_TO_EVENT_TYPE[formType] ?? null
}

/**
 * Validate that an event type URI is properly formatted
 *
 * @param uri - The event type URI to validate
 * @returns True if the URI is valid, false otherwise
 */
export function isValidEventTypeUri(uri: string): boolean {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false
  }

  return (
    uri.startsWith('https://api.calendly.com/event_types/') && uri.length > 40 // Minimum length for a valid URI with UUID
  )
}

/**
 * Extract event type UUID from URI
 *
 * @param uri - The Calendly event type URI
 * @returns The UUID if found, null otherwise
 * @example
 * extractEventTypeUuid('https://api.calendly.com/event_types/ABC123')
 * // Returns: 'ABC123'
 */
export function extractEventTypeUuid(uri: string): string | null {
  if (typeof uri !== 'string') {
    return null
  }

  const match = uri.match(/event_types\/([a-f0-9-]+)$/i)
  return match && match[1] ? match[1] : null
}

/**
 * Get Calendly environment (production or sandbox)
 *
 * Priority:
 * 1. CALENDLY_ENVIRONMENT env var (if explicitly set)
 * 2. NODE_ENV === 'production' → 'production'
 * 3. Default to 'sandbox' in development
 *
 * @returns The current Calendly environment
 */
export function getCalendlyEnvironment(): CalendlyEnvironment {
  // Check if explicitly set (takes precedence)
  const explicitEnv = process.env.CALENDLY_ENVIRONMENT
  if (explicitEnv === 'production' || explicitEnv === 'sandbox') {
    return explicitEnv
  }

  // Fall back to NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }

  // Default to sandbox in development
  return 'sandbox'
}

/**
 * Get Calendly OAuth credentials based on environment
 *
 * @returns Calendly credentials object (empty strings if not set)
 * @throws Error if environment variable names are malformed
 */
export function getCalendlyCredentials(): CalendlyCredentials {
  const env = getCalendlyEnvironment()
  const prefix = env === 'production' ? 'PRODUCTION' : 'SANDBOX'

  return {
    clientId: process.env[`${prefix}_CALENDLY_CLIENT_ID`] ?? '',
    clientSecret: process.env[`${prefix}_CALENDLY_CLIENT_SECRET`] ?? '',
    redirectUri: process.env[`${prefix}_CALENDLY_REDIRECT_URI`] ?? '',
    webhookSigningKey: process.env[`${prefix}_CALENDLY_WEBHOOK_SIGNING_KEY`] ?? '',
    environment: env,
  }
}

/**
 * Validate that all required Calendly credentials are present
 *
 * @param includeWebhookKey - Whether to validate webhook signing key (optional, defaults to false)
 * @returns Validation result with list of missing credentials
 */
export function validateCalendlyCredentials(includeWebhookKey = false): {
  valid: boolean
  missing: string[]
} {
  const creds = getCalendlyCredentials()
  const missing: string[] = []
  const prefix = creds.environment.toUpperCase()

  if (!creds.clientId) {
    missing.push(`${prefix}_CALENDLY_CLIENT_ID`)
  }
  if (!creds.clientSecret) {
    missing.push(`${prefix}_CALENDLY_CLIENT_SECRET`)
  }
  if (!creds.redirectUri) {
    missing.push(`${prefix}_CALENDLY_REDIRECT_URI`)
  }
  if (includeWebhookKey && !creds.webhookSigningKey) {
    missing.push(`${prefix}_CALENDLY_WEBHOOK_SIGNING_KEY`)
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
