/**
 * Firestore Event Document Schema
 *
 * Represents the actual structure stored in the `events` collection.
 * Field names here match Firestore field names exactly.
 *
 * No firebase-admin import — uses structural types so this file
 * can be imported from both server and client contexts.
 *
 * @see src/lib/events/event-mapper.ts for conversion to/from Event type
 */

// ---------------------------------------------------------------------------
// Sub-document types
// ---------------------------------------------------------------------------

/**
 * Venue structure as stored in Firestore
 */
export interface FirestoreVenue {
  name?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

/**
 * Cost structure as stored in Firestore (normalized format)
 */
export interface FirestoreCost {
  amount: number
  currency: string
  description?: string
}

// ---------------------------------------------------------------------------
// Timestamp union
// ---------------------------------------------------------------------------

/**
 * All timestamp representations that may appear in Firestore documents.
 *
 * - Admin / Client SDK Timestamp (duck-typed via `toDate()`)
 * - Raw serialized format (`{ _seconds, _nanoseconds }`)
 * - Plain Date object
 * - ISO-8601 string (legacy data)
 *
 * Structural types only — no firebase-admin import required.
 */
export type FirestoreTimestamp =
  | { toDate: () => Date }
  | { _seconds: number; _nanoseconds: number }
  | Date
  | string

// ---------------------------------------------------------------------------
// Read-side document shape
// ---------------------------------------------------------------------------

/**
 * Complete Firestore event document structure (read side).
 *
 * This is the source of truth for what the `events` collection stores.
 * Fields are optional where Firestore documents may omit them.
 */
export interface FirestoreEventData {
  // Core fields
  title: string
  slug: string
  summary?: string
  descriptionHtml?: string

  // Date / time
  startAt: FirestoreTimestamp
  endAt?: FirestoreTimestamp | null
  timezone?: string

  // Location
  isOnline: boolean
  venue?: FirestoreVenue
  onlineMeetingUrl?: string
  onlineMeetingDetails?: string

  // Capacity & registration
  capacity?: number
  isRegistrationRequired?: boolean
  externalRegistrationLink?: string

  // Pricing (normalized)
  isFree: boolean
  cost?: FirestoreCost

  // Pricing (legacy — maintained for backward compatibility)
  price?: number
  currency?: string
  costDescription?: string

  // Images
  imageUrl?: string
  secondaryImageUrl?: string

  // Classification
  category?: string
  subcategory?: string
  format?: string

  // Status
  status: 'draft' | 'published'
  listed: boolean
  isArchived: boolean
  archivedAt?: FirestoreTimestamp | null
  archivedBy?: string | null

  // Timestamps
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}
