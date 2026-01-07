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
  [key: string]: string | number | boolean | InsightlyTag[] | undefined | null
}

export interface InsightlyLeadResponse {
  LEAD_ID: number
  [key: string]: unknown
}

export type InsightlySyncStatus = 'pending' | 'success' | 'failed'

export interface InsightlyClientConfig {
  apiUrl: string
  apiKey: string
}

