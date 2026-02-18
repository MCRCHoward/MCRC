import { Timestamp } from 'firebase-admin/firestore'
import type { FirestoreCost, FirestoreVenue } from '@/types/event-firestore'

/**
 * Input for creating/updating events.
 * Mirrors the EventForm payload shape used by firebase-actions.
 */
export interface EventFormInput {
  title: string
  summary?: string
  descriptionHtml?: string
  imageUrl?: string
  secondaryImageUrl?: string
  externalRegistrationLink?: string
  slug?: string
  startAt: string // ISO
  endAt?: string // ISO
  timezone?: string
  isOnline: boolean
  onlineMeetingUrl?: string
  onlineMeetingDetails?: string
  venue?: FirestoreVenue
  capacity?: number
  isFree: boolean
  price?: number
  currency?: string
  costDescription?: string
  cost?: FirestoreCost
  listed?: boolean
  status?: 'draft' | 'published'
  isRegistrationRequired?: boolean
  category?: string
  subcategory?: string
  format?: string
}

/**
 * Base Firestore write payload generated from EventFormInput.
 * Server-managed fields (timestamps/archive fields) are added by actions.
 */
export interface FirestoreEventWritePayload {
  title: string
  slug: string
  summary?: string
  descriptionHtml?: string
  startAt: Timestamp
  endAt: Timestamp | null
  timezone?: string
  isOnline: boolean
  onlineMeetingUrl?: string
  onlineMeetingDetails?: string
  venue?: FirestoreVenue
  capacity?: number
  isFree: boolean
  cost?: FirestoreCost
  price?: number
  currency?: string
  costDescription?: string
  isRegistrationRequired: boolean
  externalRegistrationLink?: string
  imageUrl?: string
  secondaryImageUrl?: string
  category?: string
  subcategory?: string
  format?: string
  status: 'draft' | 'published'
  listed: boolean
}

/**
 * Generates URL-safe slug from a string.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

/**
 * Converts an ISO string to a Firestore Timestamp.
 */
function toFirestoreTimestamp(isoString: string): Timestamp {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${isoString}`)
  }
  return Timestamp.fromDate(date)
}

/**
 * Builds both normalized and legacy cost fields.
 */
function buildCostPayload(input: EventFormInput): {
  cost?: FirestoreCost
  price?: number
  currency?: string
  costDescription?: string
} {
  if (input.isFree || (!input.cost && !input.price)) {
    return {
      cost: undefined,
      price: undefined,
      currency: undefined,
      costDescription: undefined,
    }
  }

  const cost =
    input.cost ||
    ({
      amount: input.price ?? 0,
      currency: input.currency || 'USD',
      description: input.costDescription,
    } satisfies FirestoreCost)

  return {
    cost,
    price: cost.amount,
    currency: cost.currency,
    costDescription: cost.description,
  }
}

/**
 * Includes venue only when meaningful fields are provided.
 */
function buildVenuePayload(input: EventFormInput): FirestoreVenue | undefined {
  if (!input.venue) return undefined

  const hasVenueData = Boolean(input.venue.name || input.venue.addressLine1 || input.venue.city)
  if (!hasVenueData) return undefined

  return input.venue
}

/**
 * Maps EventForm input into Firestore payload for create/update operations.
 */
export function eventInputToFirestore(input: EventFormInput): FirestoreEventWritePayload {
  const normalizedSlug = input.slug ? slugify(input.slug) : slugify(input.title)
  const costPayload = buildCostPayload(input)
  const venue = buildVenuePayload(input)

  return {
    title: input.title,
    slug: normalizedSlug,
    summary: input.summary,
    descriptionHtml: input.descriptionHtml,
    startAt: toFirestoreTimestamp(input.startAt),
    endAt: input.endAt ? toFirestoreTimestamp(input.endAt) : null,
    timezone: input.timezone,
    isOnline: input.isOnline,
    onlineMeetingUrl: input.onlineMeetingUrl,
    onlineMeetingDetails: input.onlineMeetingDetails,
    venue,
    capacity: input.capacity,
    isFree: input.isFree,
    ...costPayload,
    isRegistrationRequired: input.isRegistrationRequired ?? true,
    externalRegistrationLink: input.externalRegistrationLink,
    imageUrl: input.imageUrl,
    secondaryImageUrl: input.secondaryImageUrl,
    category: input.category,
    subcategory: input.subcategory,
    format: input.format,
    status: input.status ?? 'published',
    listed: input.listed ?? true,
  }
}
