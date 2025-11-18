import type { ServiceArea } from '@/lib/service-area-config'

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
export interface Inquiry {
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
}

