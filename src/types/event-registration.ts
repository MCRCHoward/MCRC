/**
 * Service interest options for event registration
 */
export type ServiceInterest = 'Mediation' | 'Facilitation' | 'Restorative Practices' | 'Other' | 'None'

/**
 * Event Registration Type
 * 
 * Represents a user's registration for an event.
 * Stored in root-level `eventRegistrations` collection.
 * Document ID is handled separately by Firestore, not stored in the document data.
 */
export interface EventRegistration {
  eventId: string // Reference to event document ID
  userId: string // Firebase Auth UID
  name: string
  email: string
  phone?: string // Optional
  registrationDate: string // ISO timestamp
  status: 'registered' | 'cancelled' | 'attended'
  emailMarketingConsent: boolean
  serviceInterest: ServiceInterest
  notes?: string // Optional, for admin use
  // Denormalized event data (flat fields, not in metadata object)
  eventName: string // Copied from event.title
  eventDate: string // ISO timestamp, copied from event.startAt
  eventSlug: string // Copied from event.slug
}

/**
 * Input type for creating a new event registration
 * Omits fields that are auto-generated or denormalized
 */
export type EventRegistrationInput = Omit<
  EventRegistration,
  'userId' | 'registrationDate' | 'eventName' | 'eventDate' | 'eventSlug' | 'status'
>
