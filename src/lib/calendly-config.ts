/**
 * Calendly Configuration
 *
 * Maps form types to Calendly event types and provides configuration helpers.
 * Event type mappings can be overridden in Firestore for admin configurability.
 */

import type { FormType } from './service-area-config'

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
    return eventTypeMappings[formType]
  }

  // Fall back to defaults
  return DEFAULT_FORM_TO_EVENT_TYPE[formType] || null
}

/**
 * Validate that an event type URI is properly formatted
 */
export function isValidEventTypeUri(uri: string): boolean {
  return (
    typeof uri === 'string' &&
    uri.startsWith('https://api.calendly.com/event_types/') &&
    uri.length > 40
  )
}

/**
 * Extract event type UUID from URI
 */
export function extractEventTypeUuid(uri: string): string | null {
  const match = uri.match(/event_types\/([a-f0-9-]+)$/i)
  return match ? match[1] : null
}

/**
 * Calendly API Base URLs
 */
export const CALENDLY_API_BASE = {
  production: 'https://api.calendly.com',
  sandbox: 'https://api.calendly.com', // Calendly uses same API for sandbox
} as const

/**
 * Calendly OAuth URLs
 */
export const CALENDLY_OAUTH_BASE = {
  production: 'https://auth.calendly.com',
  sandbox: 'https://auth.calendly.com', // Same OAuth endpoint
} as const

/**
 * Get Calendly environment (production or sandbox)
 * Defaults to sandbox in development, production in production
 */
export function getCalendlyEnvironment(): 'production' | 'sandbox' {
  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }
  // Check if explicitly set
  const env = process.env.CALENDLY_ENVIRONMENT
  if (env === 'production' || env === 'sandbox') {
    return env
  }
  // Default to sandbox in development
  return 'sandbox'
}

/**
 * Get Calendly OAuth credentials based on environment
 */
export function getCalendlyCredentials() {
  const env = getCalendlyEnvironment()
  const prefix = env === 'production' ? 'PRODUCTION' : 'SANDBOX'

  return {
    clientId: process.env[`${prefix}_CALENDLY_CLIENT_ID`] || '',
    clientSecret: process.env[`${prefix}_CALENDLY_CLIENT_SECRET`] || '',
    redirectUri: process.env[`${prefix}_CALENDLY_REDIRECT_URI`] || '',
    webhookSigningKey: process.env[`${prefix}_CALENDLY_WEBHOOK_SIGNING_KEY`] || '',
    environment: env,
  }
}

/**
 * Validate that all required Calendly credentials are present
 */
export function validateCalendlyCredentials(): {
  valid: boolean
  missing: string[]
} {
  const creds = getCalendlyCredentials()
  const missing: string[] = []

  if (!creds.clientId) {
    missing.push(`${creds.environment.toUpperCase()}_CALENDLY_CLIENT_ID`)
  }
  if (!creds.clientSecret) {
    missing.push(`${creds.environment.toUpperCase()}_CALENDLY_CLIENT_SECRET`)
  }
  if (!creds.redirectUri) {
    missing.push(`${creds.environment.toUpperCase()}_CALENDLY_REDIRECT_URI`)
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

