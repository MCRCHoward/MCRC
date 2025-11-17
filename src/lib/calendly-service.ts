/**
 * Calendly Service Layer
 *
 * Provides functions to interact with Calendly API:
 * - Token management (get, refresh)
 * - Event types
 * - Scheduling links
 * - Event and invitee data
 */

import {
  getDecryptedAccessToken,
  getDecryptedRefreshToken,
  saveCalendlyTokens,
  getCalendlySettings,
} from './actions/calendly-settings-actions'
import {
  getCalendlyCredentials,
  getCalendlyEnvironment,
  CALENDLY_API_BASE,
  CALENDLY_OAUTH_BASE,
} from './calendly-config'
import type {
  CalendlyTokenResponse,
  CalendlyEventTypesResponse,
  CalendlyEventType,
  CalendlyScheduledEvent,
  CalendlyInvitee,
  CalendlySchedulingParams,
  CalendlySchedulingLinkResponse,
  CalendlyErrorResponse,
  CalendlyUser,
  CalendlyWebhookSubscription,
  CalendlyWebhookSubscriptionsResponse,
  CreateWebhookSubscriptionRequest,
  CreateWebhookSubscriptionResponse,
} from '@/types/calendly'

/**
 * Get a valid access token, refreshing if necessary
 * Returns null if no tokens are stored or refresh fails
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const settings = await getCalendlySettings()
    if (!settings?.tokens) {
      console.log('[CalendlyService] No tokens stored')
      return null
    }

    const now = Date.now()
    const expiresAt = settings.tokens.expiresAt

    // Check if token is expired or will expire in the next 5 minutes
    if (now >= expiresAt - 5 * 60 * 1000) {
      console.log('[CalendlyService] Token expired or expiring soon, refreshing...')
      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        return null
      }
      return await getDecryptedAccessToken()
    }

    return await getDecryptedAccessToken()
  } catch (error) {
    console.error('[CalendlyService] getAccessToken FAILED:', error)
    return null
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getDecryptedRefreshToken()
    if (!refreshToken) {
      console.error('[CalendlyService] No refresh token available')
      return false
    }

    const creds = getCalendlyCredentials()
    const env = getCalendlyEnvironment()

    const response = await fetch(`${CALENDLY_OAUTH_BASE[env]}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }),
    })

    if (!response.ok) {
      const error: CalendlyErrorResponse = await response.json()
      console.error('[CalendlyService] Token refresh failed:', error)
      return false
    }

    const tokenData: CalendlyTokenResponse = await response.json()

    // Save the new tokens
    await saveCalendlyTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      owner: tokenData.owner,
    })

    console.log('[CalendlyService] Token refreshed successfully')
    return true
  } catch (error) {
    console.error('[CalendlyService] refreshAccessToken FAILED:', error)
    return false
  }
}

/**
 * Make an authenticated request to Calendly API
 */
async function calendlyApiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      console.error('[CalendlyService] No access token available')
      return null
    }

    const env = getCalendlyEnvironment()
    const url = `${CALENDLY_API_BASE[env]}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try refreshing once
        console.log('[CalendlyService] 401 Unauthorized, attempting token refresh...')
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          // Retry the request with new token
          const newAccessToken = await getDecryptedAccessToken()
          if (newAccessToken) {
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
                ...options?.headers,
              },
            })
            if (retryResponse.ok) {
              return (await retryResponse.json()) as T
            }
          }
        }
      }

      const error: CalendlyErrorResponse = await response.json()
      console.error('[CalendlyService] API request failed:', error)
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    console.error('[CalendlyService] API request error:', error)
    return null
  }
}

/**
 * Get current user information from Calendly (using OAuth token)
 */
export async function getCalendlyUser(): Promise<CalendlyUser | null> {
  return calendlyApiRequest<CalendlyUser>('/users/me')
}

/**
 * Get current user information from Calendly (using Personal Access Token)
 * Used for webhook management
 */
export async function getCalendlyUserWithPAT(): Promise<CalendlyUser | null> {
  // DEBUG: Get user info via PAT (required for webhook management)
  console.log('[DEBUG] getCalendlyUserWithPAT - Starting user info fetch')
  const user = await calendlyApiRequestWithPAT<CalendlyUser>('/users/me')
  
  if (user) {
    console.log('[DEBUG] getCalendlyUserWithPAT - Success', {
      hasResource: !!user.resource,
      userUri: user.resource?.uri,
      userName: user.resource?.name,
      hasOrganization: !!user.resource?.current_organization,
      organizationUri: user.resource?.current_organization,
    })
  } else {
    console.error('[DEBUG] getCalendlyUserWithPAT - Failed to get user info')
  }
  
  return user
}

/**
 * Get all event types for the authenticated user
 * Calendly API requires a 'user' parameter to list event types
 */
export async function getEventTypes(): Promise<CalendlyEventType[]> {
  try {
    // First, get the current user to get their URI
    const user = await getCalendlyUser()
    if (!user || !user.resource?.uri) {
      console.error('[CalendlyService] Could not get user information')
      return []
    }

    // Build the endpoint with the user parameter
    const params = new URLSearchParams()
    params.append('user', user.resource.uri)

    const response = await calendlyApiRequest<CalendlyEventTypesResponse>(
      `/event_types?${params.toString()}`,
      {
        method: 'GET',
      },
    )

    if (!response) {
      return []
    }

    return response.collection || []
  } catch (error) {
    console.error('[CalendlyService] getEventTypes FAILED:', error)
    return []
  }
}

/**
 * Get a specific event type by URI
 */
export async function getEventType(eventTypeUri: string): Promise<CalendlyEventType | null> {
  return calendlyApiRequest<CalendlyEventType>(eventTypeUri.replace(CALENDLY_API_BASE.production, ''))
}

/**
 * Create a scheduling link with pre-filled invitee data
 * Note: Calendly doesn't have a direct API for this, so we construct the URL
 */
export async function createSchedulingLink(
  params: CalendlySchedulingParams,
): Promise<CalendlySchedulingLinkResponse | null> {
  try {
    // Get the event type to get the scheduling URL
    const eventType = await getEventType(params.eventTypeUri)
    if (!eventType) {
      console.error('[CalendlyService] Event type not found:', params.eventTypeUri)
      return null
    }

    // Build the scheduling URL with pre-filled data
    const baseUrl = eventType.scheduling_url
    const urlParams = new URLSearchParams()

    // Pre-fill invitee information
    if (params.inviteeEmail) {
      urlParams.append('email', params.inviteeEmail)
    }
    if (params.inviteeName) {
      urlParams.append('name', params.inviteeName)
    }
    if (params.inviteeFirstName) {
      urlParams.append('first_name', params.inviteeFirstName)
    }
    if (params.inviteeLastName) {
      urlParams.append('last_name', params.inviteeLastName)
    }
    if (params.inviteePhoneNumber) {
      urlParams.append('a1', params.inviteePhoneNumber) // Calendly uses a1 for phone
    }

    // Add tracking parameters (including inquiry ID as salesforce_uuid)
    if (params.tracking) {
      Object.entries(params.tracking).forEach(([key, value]) => {
        if (value) {
          urlParams.append(key, value)
        }
      })
    }

    const schedulingUrl = `${baseUrl}?${urlParams.toString()}`

    return {
      schedulingUrl,
      eventUri: params.eventTypeUri,
    }
  } catch (error) {
    console.error('[CalendlyService] createSchedulingLink FAILED:', error)
    return null
  }
}

/**
 * Get a scheduled event by URI
 */
export async function getScheduledEvent(eventUri: string): Promise<CalendlyScheduledEvent | null> {
  const endpoint = eventUri.replace(CALENDLY_API_BASE.production, '')
  return calendlyApiRequest<CalendlyScheduledEvent>(endpoint)
}

/**
 * Get an invitee by URI
 */
export async function getInvitee(inviteeUri: string): Promise<CalendlyInvitee | null> {
  const endpoint = inviteeUri.replace(CALENDLY_API_BASE.production, '')
  return calendlyApiRequest<CalendlyInvitee>(endpoint)
}

/**
 * List scheduled events for the authenticated user
 */
export async function listUserEvents(options?: {
  count?: number
  page_token?: string
  status?: 'active' | 'canceled'
  min_start_time?: string
  max_start_time?: string
}): Promise<{ collection: CalendlyScheduledEvent[]; pagination: { next_page?: string } } | null> {
  const params = new URLSearchParams()
  if (options?.count) params.append('count', String(options.count))
  if (options?.page_token) params.append('page_token', options.page_token)
  if (options?.status) params.append('status', options.status)
  if (options?.min_start_time) params.append('min_start_time', options.min_start_time)
  if (options?.max_start_time) params.append('max_start_time', options.max_start_time)

  const queryString = params.toString()
  const endpoint = `/scheduled_events${queryString ? `?${queryString}` : ''}`

  return calendlyApiRequest(endpoint)
}

/**
 * Get personal access token for webhook management
 * Webhooks require a personal access token, not OAuth tokens
 */
function getPersonalAccessToken(): string | null {
  // DEBUG: Check if PAT is set
  const token = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN
  
  // PRODUCTION DEBUG: Log environment detection
  const isProduction = process.env.NODE_ENV === 'production'
  const isLocalhost = process.env.NODE_ENV === 'development'
  
  console.log('[DEBUG] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
    isLocalhost,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token?.substring(0, 20) || 'N/A', // First 20 chars for debugging
  })
  
  if (!token) {
    console.error('[CalendlyService] CALENDLY_PERSONAL_ACCESS_TOKEN not set')
    console.error('[DEBUG] Available env vars:', {
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      CALENDLY_ENVIRONMENT: process.env.CALENDLY_ENVIRONMENT,
      // Don't log other sensitive vars
    })
    return null
  }
  
  // DEBUG: Log successful token retrieval (without exposing full token)
  console.log('[DEBUG] Personal Access Token retrieved successfully')
  return token
}

/**
 * Make an API request using personal access token (for webhooks)
 */
async function calendlyApiRequestWithPAT<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    // DEBUG: Step 1 - Get PAT
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 1: Getting PAT')
    const token = getPersonalAccessToken()
    if (!token) {
      console.error('[CalendlyService] No personal access token available')
      console.error('[DEBUG] PAT check failed - cannot proceed with API request')
      return null
    }

    // DEBUG: Step 2 - Determine environment and build URL
    const env = getCalendlyEnvironment()
    const url = `${CALENDLY_API_BASE[env]}${endpoint}`
    
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 2: Building request', {
      env,
      endpoint,
      fullUrl: url,
      method: options?.method || 'GET',
      hasBody: !!options?.body,
    })

    // DEBUG: Step 3 - Make API request
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 3: Making fetch request')
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    // DEBUG: Step 4 - Check response status
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 4: Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      // DEBUG: Log detailed error information
      const errorText = await response.text()
      let error: CalendlyErrorResponse
      
      try {
        error = JSON.parse(errorText) as CalendlyErrorResponse
      } catch {
        // If JSON parsing fails, create a structured error
        error = {
          message: errorText || `HTTP ${response.status}: ${response.statusText}`,
          title: 'API Request Failed',
          details: [],
        }
      }
      
      console.error('[CalendlyService] API request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        error,
        // PRODUCTION DEBUG: Include request details
        requestMethod: options?.method || 'GET',
        requestEndpoint: endpoint,
        environment: env,
      })
      return null
    }

    // DEBUG: Step 5 - Parse response
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 5: Parsing JSON response')
    const data = (await response.json()) as T
    console.log('[DEBUG] calendlyApiRequestWithPAT - Step 6: Success', {
      hasData: !!data,
      dataKeys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A',
    })
    
    return data
  } catch (error) {
    // DEBUG: Log full error details
    console.error('[CalendlyService] API request error:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      endpoint,
      environment: getCalendlyEnvironment(),
    })
    return null
  }
}

/**
 * Create a webhook subscription
 * Requires personal access token
 */
export async function createWebhookSubscription(
  request: CreateWebhookSubscriptionRequest,
): Promise<CalendlyWebhookSubscription | null> {
  try {
    // DEBUG: Log webhook creation request details
    console.log('[DEBUG] createWebhookSubscription - Step 1: Preparing request', {
      url: request.url,
      events: request.events,
      organization: request.organization,
      scope: request.scope,
      user: request.user,
    })
    
    // DEBUG: Validate request payload
    if (!request.url) {
      console.error('[DEBUG] createWebhookSubscription - Missing URL')
      return null
    }
    if (!request.events || request.events.length === 0) {
      console.error('[DEBUG] createWebhookSubscription - Missing events')
      return null
    }
    if (!request.organization && !request.user) {
      console.error('[DEBUG] createWebhookSubscription - Missing organization or user')
      return null
    }
    
    // DEBUG: Step 2 - Make API request
    console.log('[DEBUG] createWebhookSubscription - Step 2: Making API request')
    const response = await calendlyApiRequestWithPAT<CreateWebhookSubscriptionResponse>(
      '/webhook_subscriptions',
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    )

    if (!response) {
      console.error('[DEBUG] createWebhookSubscription - Step 3: API request returned null')
      return null
    }

    // DEBUG: Step 4 - Extract resource
    console.log('[DEBUG] createWebhookSubscription - Step 4: Success', {
      hasResource: !!response.resource,
      webhookUri: response.resource?.uri,
      webhookState: response.resource?.state,
      webhookCallbackUrl: response.resource?.callback_url,
    })

    return response.resource
  } catch (error) {
    console.error('[CalendlyService] createWebhookSubscription FAILED:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      request: {
        url: request.url,
        events: request.events,
        organization: request.organization,
        scope: request.scope,
      },
    })
    return null
  }
}

/**
 * List webhook subscriptions
 * Requires personal access token
 */
export async function listWebhookSubscriptions(options?: {
  organization?: string
  user?: string
  scope?: 'user' | 'organization'
  count?: number
  page_token?: string
}): Promise<CalendlyWebhookSubscription[]> {
  try {
    const params = new URLSearchParams()
    if (options?.organization) params.append('organization', options.organization)
    if (options?.user) params.append('user', options.user)
    if (options?.scope) params.append('scope', options.scope)
    if (options?.count) params.append('count', String(options.count))
    if (options?.page_token) params.append('page_token', options.page_token)

    const queryString = params.toString()
    const endpoint = `/webhook_subscriptions${queryString ? `?${queryString}` : ''}`

    const response = await calendlyApiRequestWithPAT<CalendlyWebhookSubscriptionsResponse>(
      endpoint,
      {
        method: 'GET',
      },
    )

    if (!response) {
      return []
    }

    return response.collection || []
  } catch (error) {
    console.error('[CalendlyService] listWebhookSubscriptions FAILED:', error)
    return []
  }
}

/**
 * Delete a webhook subscription
 * Requires personal access token
 */
export async function deleteWebhookSubscription(webhookUri: string): Promise<boolean> {
  try {
    const token = getPersonalAccessToken()
    if (!token) {
      console.error('[CalendlyService] No personal access token available')
      return false
    }

    const env = getCalendlyEnvironment()
    const url = webhookUri.startsWith('http')
      ? webhookUri
      : `${CALENDLY_API_BASE[env]}${webhookUri}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error: CalendlyErrorResponse = await response.json()
      console.error('[CalendlyService] Delete webhook failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[CalendlyService] deleteWebhookSubscription FAILED:', error)
    return false
  }
}

