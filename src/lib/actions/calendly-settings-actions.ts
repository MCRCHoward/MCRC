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

  // DEBUG: Log function entry
  console.log('[DEBUG] createCalendlyWebhookAction - Entry', {
    webhookUrl,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })

  try {
    // DEBUG: Step 1 - Get user info using Personal Access Token
    console.log('[DEBUG] createCalendlyWebhookAction - Step 1: Getting user info via PAT')
    const user = await getCalendlyUserWithPAT()
    
    if (!user?.resource?.uri) {
      console.error('[DEBUG] createCalendlyWebhookAction - Step 1 FAILED: No user URI', {
        hasUser: !!user,
        hasResource: !!user?.resource,
        userUri: user?.resource?.uri,
      })
      throw new Error(
        'Could not get Calendly user information. Make sure CALENDLY_PERSONAL_ACCESS_TOKEN is set correctly.',
      )
    }

    if (!user.resource.current_organization) {
      console.error('[DEBUG] createCalendlyWebhookAction - Step 1 FAILED: No organization', {
        userUri: user.resource.uri,
        hasOrganization: !!user.resource.current_organization,
        organizationUri: user.resource.current_organization,
      })
      throw new Error(
        'Could not get Calendly organization information. Make sure your Personal Access Token has organization access.',
      )
    }

    console.log('[DEBUG] createCalendlyWebhookAction - Step 1 SUCCESS', {
      userUri: user.resource.uri,
      organizationUri: user.resource.current_organization,
    })

    // DEBUG: Step 2 - Determine webhook URL based on environment
    console.log('[DEBUG] createCalendlyWebhookAction - Step 2: Determining base URL')
    const env = getCalendlyEnvironment()
    let baseUrl: string

    console.log('[DEBUG] Environment check', {
      env,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      NODE_ENV: process.env.NODE_ENV,
    })

    if (process.env.NEXT_PUBLIC_SERVER_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
      console.log('[DEBUG] Using NEXT_PUBLIC_SERVER_URL:', baseUrl)
    } else if (env === 'production') {
      baseUrl = 'https://mcrchoward.org'
      console.log('[DEBUG] Using production fallback:', baseUrl)
    } else {
      // For local development, require NEXT_PUBLIC_SERVER_URL (should be ngrok URL)
      console.error('[DEBUG] Missing NEXT_PUBLIC_SERVER_URL for local development')
      throw new Error(
        'NEXT_PUBLIC_SERVER_URL must be set for local development. Use ngrok to expose your local server and set the ngrok URL as NEXT_PUBLIC_SERVER_URL.',
      )
    }

    // Ensure baseUrl doesn't end with a slash
    baseUrl = baseUrl.replace(/\/$/, '')
    console.log('[DEBUG] Final baseUrl (after slash removal):', baseUrl)

    // DEBUG: Step 3 - Build full webhook URL
    console.log('[DEBUG] createCalendlyWebhookAction - Step 3: Building full webhook URL')
    const fullWebhookUrl = webhookUrl.startsWith('http')
      ? webhookUrl
      : `${baseUrl}${webhookUrl.startsWith('/') ? webhookUrl : `/${webhookUrl}`}`

    console.log('[DEBUG] Webhook URL construction', {
      inputWebhookUrl: webhookUrl,
      baseUrl,
      fullWebhookUrl,
      isAbsolute: webhookUrl.startsWith('http'),
    })

    // DEBUG: Step 4 - Validate URL format
    console.log('[DEBUG] createCalendlyWebhookAction - Step 4: Validating URL format')
    try {
      const urlObj = new URL(fullWebhookUrl)
      console.log('[DEBUG] URL validation SUCCESS', {
        protocol: urlObj.protocol,
        host: urlObj.host,
        pathname: urlObj.pathname,
        fullUrl: fullWebhookUrl,
      })
    } catch (urlError) {
      console.error('[DEBUG] URL validation FAILED', {
        fullWebhookUrl,
        error: urlError instanceof Error ? urlError.message : String(urlError),
      })
      throw new Error(`Invalid webhook URL format: ${fullWebhookUrl}`)
    }

    // DEBUG: Step 5 - Create webhook subscription request
    console.log('[DEBUG] createCalendlyWebhookAction - Step 5: Creating webhook subscription request')
    // Calendly API requires organization (not user) and scope: 'organization'
    // Events must match Calendly's allowed list: invitee.created, invitee.canceled, etc.
    // Note: invitee.rescheduled is NOT in the allowed list, so we only use created and canceled
    const request: CreateWebhookSubscriptionRequest = {
      url: fullWebhookUrl,
      events: ['invitee.created', 'invitee.canceled'], // Only use events that are in Calendly's allowed list
      organization: user.resource.current_organization,
      scope: 'organization', // Must be 'organization' when using organization parameter
    }

    console.log('[DEBUG] Webhook request payload', {
      url: request.url,
      events: request.events,
      organization: request.organization,
      scope: request.scope,
    })

    // DEBUG: Step 6 - Call createWebhookSubscription
    console.log('[DEBUG] createCalendlyWebhookAction - Step 6: Calling createWebhookSubscription')
    const subscription = await createWebhookSubscription(request)

    if (subscription) {
      console.log('[DEBUG] createCalendlyWebhookAction - Step 7: Webhook created, updating Firestore', {
        webhookUri: subscription.uri,
        webhookState: subscription.state,
        callbackUrl: subscription.callback_url,
      })
      
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
      
      console.log('[DEBUG] createCalendlyWebhookAction - Step 8: Firestore updated successfully')
    } else {
      console.error('[DEBUG] createCalendlyWebhookAction - Step 7 FAILED: createWebhookSubscription returned null')
    }

    return subscription
  } catch (error) {
    // DEBUG: Log full error details
    console.error('[createCalendlyWebhookAction] FAILED:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      webhookUrl,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      CALENDLY_ENVIRONMENT: process.env.CALENDLY_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      hasPAT: !!process.env.CALENDLY_PERSONAL_ACCESS_TOKEN,
    })
    
    throw new Error(
      'Failed to create webhook. Check server logs for details. Make sure CALENDLY_PERSONAL_ACCESS_TOKEN is set and NEXT_PUBLIC_SERVER_URL is configured (use ngrok for local development).',
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
