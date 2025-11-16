/**
 * Calendly API Types
 *
 * TypeScript interfaces for Calendly OAuth, events, invitees, and webhooks.
 * Based on Calendly API v2 documentation.
 */

/**
 * OAuth Token Response
 */
export interface CalendlyTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: string
  created_at: number
  owner?: string
}

/**
 * Stored OAuth Tokens (encrypted in Firestore)
 */
export interface CalendlyTokens {
  accessToken: string // Encrypted
  refreshToken: string // Encrypted
  expiresAt: number // Unix timestamp
  tokenType: 'Bearer'
  scope: string
  owner?: string
  createdAt: number
}

/**
 * Calendly User (from /users/me endpoint)
 */
export interface CalendlyUser {
  resource: {
    uri: string
    name: string
    email: string
    slug: string
    avatar_url?: string
    created_at: string
    updated_at: string
    current_organization: string
  }
}

/**
 * Event Type
 */
export interface CalendlyEventType {
  uri: string
  name: string
  active: boolean
  slug: string
  scheduling_url: string
  duration: number // in minutes
  kind: 'solo' | 'collective' | 'group'
  pooling_type?: 'round_robin' | 'collective'
  type: 'StandardEventType' | 'AdhocEventType'
  color?: string
  created_at: string
  updated_at: string
  internal_note?: string
  description_plain?: string
  description_html?: string
  profile: {
    type: string
    owner: string
    name: string
  }
}

/**
 * Event Types Collection Response
 */
export interface CalendlyEventTypesResponse {
  collection: CalendlyEventType[]
  pagination: {
    count: number
    next_page?: string
    previous_page?: string
  }
}

/**
 * Scheduled Event
 */
export interface CalendlyScheduledEvent {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string // ISO 8601
  end_time: string // ISO 8601
  event_type: string // URI
  location?: {
    type: 'physical' | 'google_meet' | 'gotomeeting' | 'zoom' | 'webex' | 'custom'
    location?: string
    phone_number?: string
    additional_info?: string
  }
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  created_at: string
  updated_at: string
  event_memberships: Array<{
    user: string // URI
  }>
  event_guests: Array<{
    email: string
    created_at: string
    updated_at: string
  }>
}

/**
 * Invitee
 */
export interface CalendlyInvitee {
  uri: string
  name: string
  email: string
  text_reminder_number?: string
  timezone: string
  event: string // Event URI
  created_at: string
  updated_at: string
  canceled: boolean
  canceler_name?: string
  cancel_reason?: string
  canceled_at?: string
  payment?: {
    external_id: string
    provider: string
    amount: number
    currency: string
    terms: string
    successful: boolean
  }
  questions_and_answers?: Array<{
    question: string
    answer: string
    position: number
  }>
  tracking?: {
    utm_campaign?: string
    utm_source?: string
    utm_medium?: string
    utm_content?: string
    utm_term?: string
    salesforce_uuid?: string // We'll use this for inquiry ID
  }
  rescheduled: boolean
  old_invitee?: string // URI if rescheduled
  new_invitee?: string // URI if rescheduled
  cancel_url: string
  reschedule_url: string
}

/**
 * Webhook Event Types
 * Based on Calendly API v2 allowed events
 */
export type CalendlyWebhookEvent =
  | 'invitee.created'
  | 'invitee.canceled'
  | 'invitee_no_show.created'
  | 'invitee_no_show.deleted'
  | 'routing_form_submission.created'

/**
 * Webhook Payload Structure
 */
export interface CalendlyWebhookPayload {
  event: CalendlyWebhookEvent
  created_at: string
  payload: {
    event: string // Event URI
    invitee: string // Invitee URI
    questions_and_answers?: Array<{
      question: string
      answer: string
      position: number
    }>
    questions_and_answers_count: number
    tracking?: {
      utm_campaign?: string
      utm_source?: string
      utm_medium?: string
      utm_content?: string
      utm_term?: string
      salesforce_uuid?: string
    }
  }
}

/**
 * Calendly Settings (stored in Firestore)
 */
export interface CalendlySettings {
  connected: boolean
  connectedAt?: string
  connectedBy?: string
  environment: 'production' | 'sandbox'
  tokens?: CalendlyTokens
  eventTypeMappings?: Record<string, string> // Form type -> Event Type URI
  webhookUrl?: string
  webhookConfigured?: boolean
  lastSyncAt?: string
}

/**
 * Scheduling Link Parameters
 */
export interface CalendlySchedulingParams {
  eventTypeUri: string
  inviteeEmail: string
  inviteeName: string
  inviteeFirstName?: string
  inviteeLastName?: string
  inviteePhoneNumber?: string
  inviteeTimezone?: string
  inviteeLocation?: string
  customQuestions?: Array<{
    name: string
    value: string
  }>
  tracking?: {
    utm_campaign?: string
    utm_source?: string
    utm_medium?: string
    utm_content?: string
    utm_term?: string
    salesforce_uuid?: string // Inquiry ID
  }
}

/**
 * Scheduling Link Response
 */
export interface CalendlySchedulingLinkResponse {
  schedulingUrl: string
  eventUri?: string
  inviteeUri?: string
}

/**
 * Webhook Subscription
 */
export interface CalendlyWebhookSubscription {
  uri: string
  callback_url: string
  created_at: string
  updated_at: string
  retry_started_at?: string
  state: 'active' | 'disabled'
  events: CalendlyWebhookEvent[]
  organization?: string // Organization URI
  user?: string // User URI
  creator: string // Creator URI
  scope: 'user' | 'organization'
}

/**
 * Webhook Subscriptions Collection Response
 */
export interface CalendlyWebhookSubscriptionsResponse {
  collection: CalendlyWebhookSubscription[]
  pagination: {
    count: number
    next_page?: string
    previous_page?: string
  }
}

/**
 * Create Webhook Subscription Request
 */
export interface CreateWebhookSubscriptionRequest {
  url: string
  events: CalendlyWebhookEvent[]
  organization?: string // Organization URI (optional)
  user?: string // User URI (optional)
  scope: 'user' | 'organization'
}

/**
 * Create Webhook Subscription Response
 */
export interface CreateWebhookSubscriptionResponse {
  resource: CalendlyWebhookSubscription
}

/**
 * Error Response from Calendly API
 */
export interface CalendlyErrorResponse {
  title: string
  message: string
  details?: Array<{
    parameter?: string
    message: string
  }>
}

