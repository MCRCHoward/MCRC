/**
 * Event Mapper Module
 *
 * Centralizes all Firestore → TypeScript Event type conversions.
 *
 * Functions:
 * - firestoreToEvent:        For public pages and CMS list
 * - firestoreToEventForEdit: For CMS edit form (includes extended fields)
 *
 * No firebase-admin import — all read mappers are pure functions that work
 * with both Admin and Client SDK document data via duck-typed timestamps.
 *
 * @module lib/events/event-mapper
 */

import type { Event, EventCost, EventLocation } from '@/types/event'
import type { FirestoreEventData, FirestoreVenue } from '@/types/event-firestore'
import { timestampToISOString } from '@/utilities/event-helpers'

// ============================================================================
// Types
// ============================================================================

/**
 * Extended Event type for CMS edit form.
 * Includes all fields needed to populate the EventForm component.
 *
 * Consolidates the duplicate `EventWithVenueFields` definitions previously
 * in [slug]/page.tsx and EventForm.tsx.
 */
export interface EventWithEditFields extends Event {
  descriptionHtml?: string
  venueFields?: FirestoreVenue
  timezone?: string
  capacity?: number
  category?: string
  subcategory?: string
  format?: string
  status?: 'draft' | 'published'
  onlineMeetingUrl?: string
  onlineMeetingDetails?: string
  costDescription?: string
}

// ============================================================================
// Pure helper functions (not exported — internal to this module)
// ============================================================================

/**
 * Determines event modality from Firestore data.
 *
 * Checks `isOnline && hasVenue` first so hybrid events are resolved
 * correctly. This fixes the unreachable-branch bug in the original
 * `mapFirebaseEventToEvent` where the hybrid case was dead code.
 */
function resolveModality(
  isOnline: boolean | undefined,
  venue: FirestoreVenue | undefined,
): 'in_person' | 'online' | 'hybrid' {
  const hasVenue = Boolean(venue?.name || venue?.addressLine1)

  if (isOnline && hasVenue) return 'hybrid'
  if (isOnline) return 'online'
  return 'in_person'
}

/**
 * Builds an EventLocation from Firestore venue data.
 * Returns undefined when there is no meaningful venue information.
 */
function buildLocation(venue: FirestoreVenue | undefined): EventLocation | undefined {
  if (!venue?.name && !venue?.addressLine1) return undefined

  const addressParts = [
    venue.addressLine1,
    venue.addressLine2,
    venue.city,
    venue.state,
    venue.postalCode,
    venue.country,
  ].filter(Boolean)

  return {
    venueName: venue.name || '',
    address: addressParts.join(', '),
  }
}

/**
 * Builds EventCost from Firestore data.
 * Prefers the normalized `cost` object; falls back to legacy
 * `price` / `currency` / `costDescription` fields.
 */
function buildCost(data: FirestoreEventData): EventCost | undefined {
  if (data.isFree) return undefined

  if (data.cost?.amount) {
    return {
      amount: data.cost.amount,
      currency: data.cost.currency || 'USD',
      description: data.cost.description,
    }
  }

  if (data.price) {
    return {
      amount: data.price,
      currency: data.currency || 'USD',
      description: data.costDescription,
    }
  }

  return undefined
}

/**
 * Builds a featured-image object from a raw URL string.
 */
function buildFeaturedImage(
  imageUrl: string | undefined,
  title: string,
): { url: string; alt: string } | undefined {
  if (!imageUrl) return undefined
  return { url: imageUrl, alt: title || 'Event image' }
}

// ============================================================================
// Read Mappers (Firestore → TypeScript)
// ============================================================================

/**
 * Maps a Firestore event document to the `Event` type.
 *
 * Use for: public pages, CMS list views.
 *
 * @param docId - Firestore document ID
 * @param data  - Raw Firestore document data (caller extracts via `doc.data()`)
 * @returns Event object ready for UI consumption
 */
export function firestoreToEvent(
  docId: string,
  data: FirestoreEventData,
): Event {
  const modality = resolveModality(data.isOnline, data.venue)

  return {
    id: docId,
    name: data.title || '',
    slug: data.slug || docId,
    summary: data.summary,
    content: [],
    eventStartTime: timestampToISOString(data.startAt),
    eventEndTime: data.endAt
      ? timestampToISOString(data.endAt)
      : timestampToISOString(data.startAt),
    modality,
    location: buildLocation(data.venue),
    onlineMeeting:
      data.isOnline && data.onlineMeetingUrl
        ? {
            url: data.onlineMeetingUrl,
            details: data.onlineMeetingDetails || '',
          }
        : undefined,
    isFree: data.isFree ?? true,
    cost: buildCost(data),
    isRegistrationRequired: data.isRegistrationRequired ?? true,
    externalRegistrationLink: data.externalRegistrationLink,
    isArchived: data.isArchived === true,
    listed: data.listed ?? true,
    featuredImage: buildFeaturedImage(data.imageUrl, data.title),
    secondaryImage: data.secondaryImageUrl
      ? {
          url: data.secondaryImageUrl,
          alt: `${data.title || 'Event'} - secondary image`,
        }
      : undefined,
    meta: {
      slug: data.slug || docId,
      status: data.status === 'published' ? 'published' : 'draft',
      eventType: data.category || data.format || undefined,
    },
    createdAt: timestampToISOString(data.createdAt),
    updatedAt: timestampToISOString(data.updatedAt),
  }
}

/**
 * Maps a Firestore event document to `EventWithEditFields`.
 *
 * Use for: CMS edit form (requires all fields to populate form inputs).
 *
 * @param docId - Firestore document ID
 * @param data  - Raw Firestore document data
 * @returns EventWithEditFields with all editable fields
 */
export function firestoreToEventForEdit(
  docId: string,
  data: FirestoreEventData,
): EventWithEditFields {
  const baseEvent = firestoreToEvent(docId, data)

  return {
    ...baseEvent,
    descriptionHtml: data.descriptionHtml,
    venueFields: data.venue,
    timezone: data.timezone,
    capacity: data.capacity,
    category: data.category,
    subcategory: data.subcategory,
    format: data.format,
    status: data.status === 'published' ? 'published' : 'draft',
    onlineMeetingUrl: data.onlineMeetingUrl,
    onlineMeetingDetails: data.onlineMeetingDetails,
    costDescription: data.costDescription || data.cost?.description,
  }
}
