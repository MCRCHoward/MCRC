'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { requireRole } from '@/lib/custom-auth'
import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'
import type {
  CalendlySettings,
  CalendlyTokens,
  CalendlyWebhookSubscription,
  CreateWebhookSubscriptionRequest,
} from '@/types/calendly'
import { encrypt, decrypt } from '@/lib/encryption'
import {
  createWebhookSubscription,
  listWebhookSubscriptions,
  deleteWebhookSubscription,
  getCalendlyUserWithPAT,
} from '@/lib/calendly-service'
import { getCalendlyEnvironment } from '@/lib/calendly-config'

const SETTINGS_DOC_PATH = 'settings/calendly'

/**
 * Get Calendly settings from Firestore
 * Accessible by admins and coordinators
 */
export async function getCalendlySettings(): Promise<CalendlySettings | null> {
  await requireRole('coordinator') // Admin or coordinator

  try {
    const docRef = adminDb.doc(SETTINGS_DOC_PATH)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return null
    }

    const data = docSnap.data() as CalendlySettings
    return data
  } catch (error) {
    console.error('[getCalendlySettings] FAILED:', error)
    throw new Error('Failed to get Calendly settings')
  }
}

/**
 * Save Calendly OAuth tokens (encrypted)
 * Accessible by admins only
 */
export async function saveCalendlyTokens(tokens: {
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string
  owner?: string
}): Promise<void> {
  await requireRole('admin') // Admin only

  try {
    const now = Date.now()
    const expiresAt = now + tokens.expiresIn * 1000

    // Encrypt tokens before storing
    const encryptedAccessToken = await encrypt(tokens.accessToken)
    const encryptedRefreshToken = await encrypt(tokens.refreshToken)

    const calendlyTokens: CalendlyTokens = {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      tokenType: 'Bearer',
      scope: tokens.scope,
      owner: tokens.owner,
      createdAt: now,
    }

    const docRef = adminDb.doc(SETTINGS_DOC_PATH)
    const existing = await docRef.get()

    const user = await requireRole('admin')
    const settings: CalendlySettings = {
      connected: true,
      connectedAt: toISOString(new Date()) || new Date().toISOString(),
      connectedBy: user.id,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      tokens: calendlyTokens,
      eventTypeMappings: existing.exists
        ? (existing.data() as CalendlySettings)?.eventTypeMappings || {}
        : {},
      webhookConfigured: existing.exists
        ? (existing.data() as CalendlySettings)?.webhookConfigured || false
        : false,
    }

    await docRef.set(settings, { merge: true })
  } catch (error) {
    console.error('[saveCalendlyTokens] FAILED:', error)
    throw new Error('Failed to save Calendly tokens')
  }
}

/**
 * Update Calendly settings (event type mappings, etc.)
 * Accessible by admins only
 */
export async function updateCalendlySettings(
  updates: Partial<
    Pick<CalendlySettings, 'eventTypeMappings' | 'webhookConfigured' | 'webhookUrl'>
  >,
): Promise<void> {
  await requireRole('admin') // Admin only

  try {
    const docRef = adminDb.doc(SETTINGS_DOC_PATH)
    await docRef.set(updates, { merge: true })
  } catch (error) {
    console.error('[updateCalendlySettings] FAILED:', error)
    throw new Error('Failed to update Calendly settings')
  }
}

/**
 * Get decrypted access token (for use in service layer)
 * Accessible by admins and coordinators
 */
export async function getDecryptedAccessToken(): Promise<string | null> {
  await requireRole('coordinator') // Admin or coordinator

  try {
    const settings = await getCalendlySettings()
    if (!settings?.tokens?.accessToken) {
      return null
    }

    // Decrypt the access token
    const decrypted = await decrypt(settings.tokens.accessToken)
    return decrypted
  } catch (error) {
    console.error('[getDecryptedAccessToken] FAILED:', error)
    return null
  }
}

/**
 * Get decrypted refresh token (for use in service layer)
 * Accessible by admins and coordinators
 */
export async function getDecryptedRefreshToken(): Promise<string | null> {
  await requireRole('coordinator') // Admin or coordinator

  try {
    const settings = await getCalendlySettings()
    if (!settings?.tokens?.refreshToken) {
      return null
    }

    // Decrypt the refresh token
    const decrypted = await decrypt(settings.tokens.refreshToken)
    return decrypted
  } catch (error) {
    console.error('[getDecryptedRefreshToken] FAILED:', error)
    return null
  }
}

/**
 * Disconnect Calendly (remove tokens)
 * Accessible by admins only
 */
export async function disconnectCalendly(): Promise<void> {
  await requireRole('admin') // Admin only

  try {
    const docRef = adminDb.doc(SETTINGS_DOC_PATH)
    await docRef.update({
      connected: false,
      tokens: null,
      connectedAt: null,
      connectedBy: null,
    })
    revalidatePath('/dashboard/settings/calendly')
  } catch (error) {
    console.error('[disconnectCalendly] FAILED:', error)
    throw new Error('Failed to disconnect Calendly')
  }
}

/**
 * Create a webhook subscription
 * Accessible by admins only
 */
export async function createCalendlyWebhookAction(
  webhookUrl: string,
): Promise<CalendlyWebhookSubscription | null> {
  await requireRole('admin') // Admin only

  try {
    // Get user info using Personal Access Token (required for webhook management)
    const user = await getCalendlyUserWithPAT()
    if (!user?.resource?.uri) {
      throw new Error(
        'Could not get Calendly user information. Make sure CALENDLY_PERSONAL_ACCESS_TOKEN is set correctly.',
      )
    }

    if (!user.resource.current_organization) {
      throw new Error(
        'Could not get Calendly organization information. Make sure your Personal Access Token has organization access.',
      )
    }

    // Determine webhook URL based on environment
    const env = getCalendlyEnvironment()
    let baseUrl: string

    if (process.env.NEXT_PUBLIC_SERVER_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
    } else if (env === 'production') {
      baseUrl = 'https://mcrchoward.org'
    } else {
      // For local development, require NEXT_PUBLIC_SERVER_URL (should be ngrok URL)
      throw new Error(
        'NEXT_PUBLIC_SERVER_URL must be set for local development. Use ngrok to expose your local server and set the ngrok URL as NEXT_PUBLIC_SERVER_URL.',
      )
    }

    // Ensure baseUrl doesn't end with a slash
    baseUrl = baseUrl.replace(/\/$/, '')

    // Build full webhook URL
    const fullWebhookUrl = webhookUrl.startsWith('http')
      ? webhookUrl
      : `${baseUrl}${webhookUrl.startsWith('/') ? webhookUrl : `/${webhookUrl}`}`

    // Validate URL format
    try {
      new URL(fullWebhookUrl)
    } catch {
      throw new Error(`Invalid webhook URL format: ${fullWebhookUrl}`)
    }

    // Create webhook subscription
    // Calendly API requires organization (not user) and scope: 'organization'
    // Events must match Calendly's allowed list: invitee.created, invitee.canceled, etc.
    // Note: invitee.rescheduled is NOT in the allowed list, so we only use created and canceled
    const request: CreateWebhookSubscriptionRequest = {
      url: fullWebhookUrl,
      events: ['invitee.created', 'invitee.canceled'], // Only use events that are in Calendly's allowed list
      organization: user.resource.current_organization,
      scope: 'organization', // Must be 'organization' when using organization parameter
    }

    const subscription = await createWebhookSubscription(request)

    if (subscription) {
      // Update settings to mark webhook as configured
      const docRef = adminDb.doc(SETTINGS_DOC_PATH)
      await docRef.set(
        {
          webhookConfigured: true,
          webhookUrl: fullWebhookUrl,
        },
        { merge: true },
      )
      revalidatePath('/dashboard/settings/calendly')
    }

    return subscription
  } catch (error) {
    console.error('[createCalendlyWebhookAction] FAILED:', error)
    throw new Error(
      `Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * List webhook subscriptions
 * Accessible by admins only
 */
export async function listCalendlyWebhooksAction(): Promise<CalendlyWebhookSubscription[]> {
  await requireRole('admin') // Admin only

  try {
    // Get user info using Personal Access Token to get organization URI
    const user = await getCalendlyUserWithPAT()
    if (!user?.resource?.current_organization) {
      console.error('[listCalendlyWebhooksAction] No organization found for user')
      return []
    }

    // Calendly API requires organization and scope when listing webhooks
    const webhooks = await listWebhookSubscriptions({
      organization: user.resource.current_organization,
      scope: 'organization',
    })

    return webhooks
  } catch (error) {
    console.error('[listCalendlyWebhooksAction] FAILED:', error)
    return []
  }
}

/**
 * Delete a webhook subscription
 * Accessible by admins only
 */
export async function deleteCalendlyWebhookAction(webhookUri: string): Promise<boolean> {
  await requireRole('admin') // Admin only

  try {
    const success = await deleteWebhookSubscription(webhookUri)

    if (success) {
      // Update settings to mark webhook as not configured
      const docRef = adminDb.doc(SETTINGS_DOC_PATH)
      await docRef.set(
        {
          webhookConfigured: false,
          webhookUrl: null,
        },
        { merge: true },
      )
      revalidatePath('/dashboard/settings/calendly')
    }

    return success
  } catch (error) {
    console.error('[deleteCalendlyWebhookAction] FAILED:', error)
    throw new Error(
      `Failed to delete webhook: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
