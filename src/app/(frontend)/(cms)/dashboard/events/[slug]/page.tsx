import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import { toISOString } from '../../utils/timestamp-helpers'
import type { Event } from '@/types'
import EventForm from '../EventForm'

type RouteParams = Promise<{ slug: string }>

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Extended Event type with venue fields for editing
 */
type EventWithVenueFields = Event & {
  descriptionHtml?: string
  venueFields?: {
    name?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  timezone?: string
  capacity?: number
  listed?: boolean
  category?: string
  subcategory?: string
  format?: string
}

/**
 * Fetches an event by slug from Firestore with all fields needed for editing
 */
async function fetchEventBySlug(slug: string): Promise<EventWithVenueFields | null> {
  try {
    const snapshot = await adminDb.collection('events').where('slug', '==', slug).limit(1).get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    if (!doc) {
      return null
    }

    const data = doc.data()


    const startAt = data.startAt?.toDate?.() ?? (data.startAt instanceof Date ? data.startAt : null)
    const endAt = data.endAt?.toDate?.() ?? (data.endAt instanceof Date ? data.endAt : null)

    // Determine modality
    let modality: 'in_person' | 'online' | 'hybrid' = 'in_person'
    if (data.isOnline === true) {
      modality = data.venue ? 'hybrid' : 'online'
    } else if (data.venue) {
      modality = 'in_person'
    }

    // Build location from venue (for Event type)
    const location = data.venue
      ? {
          venueName: data.venue.name || '',
          address: [
            data.venue.addressLine1,
            data.venue.addressLine2,
            data.venue.city,
            data.venue.state,
            data.venue.postalCode,
            data.venue.country,
          ]
            .filter(Boolean)
            .join(', '),
        }
      : undefined

    // Store individual venue fields for editing
    const venueFields = data.venue
      ? {
          name: data.venue.name,
          addressLine1: data.venue.addressLine1,
          addressLine2: data.venue.addressLine2,
          city: data.venue.city,
          state: data.venue.state,
          postalCode: data.venue.postalCode,
          country: data.venue.country,
        }
      : undefined

    // Build cost from price/currency
    const cost =
      data.cost && !data.isFree
        ? {
            amount: data.cost.amount,
            currency: data.cost.currency || 'USD',
            description: data.cost.description,
          }
        : data.price && !data.isFree
          ? {
              amount: data.price,
              currency: data.currency || 'USD',
              description: data.costDescription,
            }
          : undefined

    return {
      id: doc.id,
      name: data.title || '',
      slug: data.slug || doc.id,
      summary: data.summary,
      content: [], // Empty for now
      eventStartTime: startAt?.toISOString() || '',
      eventEndTime: endAt?.toISOString() || data.endAt || '',
      modality,
      location,
      onlineMeeting:
        data.isOnline && data.onlineMeetingUrl
          ? {
              url: data.onlineMeetingUrl,
              details: data.onlineMeetingDetails || '',
            }
          : undefined,
      isFree: data.isFree ?? true,
      cost,
      isRegistrationRequired: data.isRegistrationRequired ?? false,
      externalRegistrationLink: data.externalRegistrationLink,
      featuredImage: data.imageUrl
        ? ({
            url: data.imageUrl,
            alt: data.title || 'Event image',
          } as { url: string; alt: string })
        : undefined,
      meta: {
        slug: data.slug || doc.id,
        status: data.status === 'published' ? 'published' : 'draft',
        eventType: data.category || data.format,
      },
      createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
      updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
      // Add fields for editing
      descriptionHtml: data.descriptionHtml,
      venueFields,
      timezone: data.timezone,
      capacity: data.capacity,
      listed: data.listed ?? true,
      category: data.category,
      subcategory: data.subcategory,
      format: data.format,
    } as EventWithVenueFields
  } catch (error) {
    console.error('[fetchEventBySlug] Error:', error)
    return null
  }
}

/**
 * Event Edit Page
 */
export default async function EventPage({ params }: { params: RouteParams }) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return <EventForm mode="edit" event={event} eventId={event.id} />
}
