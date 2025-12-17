export type InsightlyTag = {
  TAG_NAME: string
}

export interface InsightlyLeadPayload {
  FIRST_NAME?: string
  LAST_NAME?: string
  TITLE?: string
  EMAIL_ADDRESS?: string
  PHONE_NUMBER?: string
  MOBILE_PHONE_NUMBER?: string
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
  insightlyLeadUrl?: string
  insightlySyncStatus: InsightlySyncStatus
  insightlyLastSyncError?: string | null
  insightlyLastSyncedAt?: string
}

export interface InsightlyClientConfig {
  apiUrl: string
  apiKey: string
}
