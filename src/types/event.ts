import type { Media } from './media'

export interface Event {
  id: string
  name: string
  slug: string
  summary?: string
  content: EventContentBlock[]
  eventStartTime: string
  eventEndTime: string
  modality: 'in_person' | 'online' | 'hybrid'
  location?: EventLocation
  onlineMeeting?: EventOnlineMeeting
  isFree: boolean
  cost?: EventCost
  isRegistrationRequired: boolean
  externalRegistrationLink?: string
  featuredImage?: string | Media | { url: string; alt?: string }
  secondaryImage?: string | Media | { url: string; alt?: string }
  isArchived?: boolean
  listed?: boolean
  meta: EventMeta
  createdAt: string
  updatedAt: string
}

export interface EventContentBlock {
  blockType: 'textBlock'
  text: {
    root: {
      type: string
      children: Array<{
        type: string
        version: number
        children: Array<{
          type: string
          version: number
          text: string
        }>
      }>
      direction: string
      format: string
      indent: number
      version: number
    }
  }
}

export interface EventLocation {
  venueName: string
  address: string
}

export interface EventOnlineMeeting {
  url: string
  details?: string
}

export interface EventCost {
  amount: number
  currency: string
  description?: string
}

export interface EventMeta {
  slug: string
  status: 'draft' | 'published' | 'completed'
  eventType?: string
}

export interface EventInput {
  name: string
  slug?: string
  summary?: string
  content: EventContentBlock[]
  eventStartTime: string
  eventEndTime: string
  modality: 'in_person' | 'online' | 'hybrid'
  location?: EventLocation
  onlineMeeting?: EventOnlineMeeting
  isFree: boolean
  cost?: EventCost
  isRegistrationRequired: boolean
  externalRegistrationLink?: string
  featuredImage?: string
  meta: EventMeta
}

/**
 * Helper type for events with registration status
 * Not stored on event, computed client-side
 */
export interface EventWithRegistrationStatus extends Event {
  userRegistrationStatus?: 'registered' | 'cancelled' | null
  registrationCount?: number // Computed on-demand using Firestore count() query, not denormalized
}
