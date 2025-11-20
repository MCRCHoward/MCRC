import type { ServiceArea } from '@/lib/service-area-config'
import type { InsightlySyncStatus } from '@/lib/insightly/types'

/**
 * Inquiry status values
 */
export type InquiryStatus =
  | 'submitted'
  | 'intake-scheduled'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'closed'

/**
 * Calendly scheduling information
 */
export interface CalendlyScheduling {
  eventUri?: string
  scheduledTime?: string
  inviteeUri?: string
}

/**
 * Inquiry document structure
 */
export type MondaySyncStatus = 'pending' | 'success' | 'failed'

export interface InquiryMondayFields {
  mondayItemId?: string
  mondayItemUrl?: string
  mondaySyncStatus?: MondaySyncStatus
  mondaySyncError?: string | null
  mondayLastSyncedAt?: string
}

export interface Inquiry extends InquiryMondayFields {
  id: string
  formType: string
  serviceArea: ServiceArea
  formData: Record<string, unknown>
  submittedAt: string
  submittedBy: string
  submissionType: 'authenticated' | 'anonymous'
  reviewed: boolean
  reviewedAt?: string
  reviewedBy?: string
  status: InquiryStatus
  calendlyScheduling?: CalendlyScheduling
  insightlyLeadId?: number
  insightlyLeadUrl?: string
  insightlySyncStatus?: InsightlySyncStatus
  insightlyLastSyncError?: string | null
  insightlyLastSyncedAt?: string
}

