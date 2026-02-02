export type InsightlyTag = {
  TAG_NAME: string
}

export interface InsightlyLeadPayload {
  FIRST_NAME?: string
  LAST_NAME?: string
  TITLE?: string
  EMAIL?: string
  PHONE?: string
  MOBILE?: string
  ORGANIZATION_NAME?: string
  LEAD_STATUS_ID?: number
  LEAD_SOURCE_ID?: number
  OWNER_USER_ID?: number
  RESPONSIBLE_USER_ID?: number
  LEAD_DESCRIPTION?: string
  ADDRESS_STREET?: string
  ADDRESS_CITY?: string
  ADDRESS_STATE?: string
  ADDRESS_POSTCODE?: string
  ADDRESS_COUNTRY?: string
  INDUSTRY?: string
  TAGS?: InsightlyTag[]
  WEBSITE?: string
  /**
   * Custom fields support
   * Use FIELD_NAME as the key (lookup via https://api.{pod}.insightly.com/v3.1/CustomFields)
   * Values can be strings, numbers, dates (yyyy-MM-dd HH:mm:ss UTC format), or booleans
   * To remove a custom field value, use NULL
   *
   * Example:
   * {
   *   ...otherFields,
   *   'CUSTOMFIELD_123': 'Custom value',
   *   'CUSTOMFIELD_456': 42,
   *   'CUSTOMFIELD_789': '2024-01-15 14:30:00'
   * }
   */
  [key: string]: string | number | boolean | InsightlyTag[] | undefined | null
}

export interface InsightlyLeadResponse {
  LEAD_ID: number
  [key: string]: unknown
}

export type InsightlySyncStatus = 'pending' | 'success' | 'failed'

export interface InsightlySyncFields {
  insightlyLeadId?: number
  /** URL to the lead in Insightly web UI. Can be null if INSIGHTLY_WEB_BASE_URL is not configured. */
  insightlyLeadUrl?: string | null
  insightlySyncStatus: InsightlySyncStatus
  insightlyLastSyncError?: string | null
  /**
   * Stored as Firestore Timestamp in DB, converted to ISO string when read.
   * Use toISOString() helper when fetching from Firestore.
   */
  insightlyLastSyncedAt?: string
}

export interface InsightlyClientConfig {
  apiUrl: string
  apiKey: string
}
