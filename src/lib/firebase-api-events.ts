/**
 * Firebase API calls for Events
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from '@/firebase/client'
import type { Event } from '@/types'

/**
 * Maps Firebase event data to Event type
 */
function mapFirebaseEventToEvent(
  doc: QueryDocumentSnapshot<DocumentData>,
): Event & { descriptionHtml?: string } {
  const data = doc.data() || {}

  // Determine modality
  let modality: 'in_person' | 'online' | 'hybrid' = 'in_person'
  if (data.isOnline === true) {
    modality = 'online'
  } else if (data.isOnline === false && data.venue) {
    modality = 'in_person'
  } else if (data.isOnline === true && data.venue) {
    modality = 'hybrid'
  }

  // Map Firebase structure to Event type
  return {
    id: doc.id,
    name: data.title || '',
    slug: data.slug || doc.id,
    summary: data.summary,
    content: [], // Empty for now, can be populated if needed
    eventStartTime: data.startAt || '',
    eventEndTime: data.endAt || data.startAt || '',
    modality,
    location:
      data.venue?.name || data.venue?.addressLine1
        ? {
            venueName: data.venue?.name || '',
            address: [
              data.venue?.addressLine1,
              data.venue?.addressLine2,
              data.venue?.city,
              data.venue?.state,
              data.venue?.postalCode,
              data.venue?.country,
            ]
              .filter(Boolean)
              .join(', '),
          }
        : undefined,
    onlineMeeting:
      data.isOnline && data.onlineMeetingUrl
        ? {
            url: data.onlineMeetingUrl,
            details: data.onlineMeetingDetails || '',
          }
        : undefined,
    isFree: data.isFree ?? true,
    cost:
      data.price && !data.isFree
        ? {
            amount: data.price,
            currency: data.currency || 'USD',
            description: data.costDescription,
          }
        : undefined,
    isRegistrationRequired: data.isRegistrationRequired ?? false,
    externalRegistrationLink: data.externalRegistrationLink,
    featuredImage: data.imageUrl
      ? ({
          url: data.imageUrl,
          alt: data.title || 'Event image',
        } as any)
      : undefined,
    meta: {
      slug: data.slug || doc.id,
      status: data.status === 'published' ? 'published' : 'draft',
      eventType: data.category || data.format || undefined,
    },
    createdAt:
      data.createdAt?.toDate?.()?.toISOString() ||
      (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date().toISOString()),
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString() ||
      (data.updatedAt instanceof Date ? data.updatedAt.toISOString() : new Date().toISOString()),
    // Add descriptionHtml as an extension
    descriptionHtml: data.descriptionHtml,
  }
}

/**
 * Fetches all published or listed events from Firebase.
 */
export async function fetchPublishedEvents(): Promise<Event[]> {
  function isIndexError(e: unknown) {
    return e instanceof FirebaseError && e.code === 'failed-precondition'
  }

  function sortByDateDesc(rows: Event[]) {
    return [...rows].sort((a, b) => {
      const aDate = a.eventStartTime ? new Date(a.eventStartTime).getTime() : 0
      const bDate = b.eventStartTime ? new Date(b.eventStartTime).getTime() : 0
      return bDate - aDate
    })
  }

  try {
    // Try with status filter and orderBy
    let eventsQuery: Query<DocumentData> = query(
      collection(db, 'events'),
      where('status', '==', 'published'),
      where('listed', '==', true),
      orderBy('startAt', 'desc'),
    )

    try {
      const snapshot = await getDocs(eventsQuery)
      return snapshot.docs.map((doc) => mapFirebaseEventToEvent(doc))
    } catch (error) {
      if (isIndexError(error)) {
        // Fallback: try without orderBy
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[fetchPublishedEvents] Missing composite index for (status ==, listed ==, orderBy startAt). Falling back to client-side sorting. Create the index at: https://console.firebase.google.com/project/_/firestore/indexes',
          )
        }
        try {
          eventsQuery = query(
            collection(db, 'events'),
            where('status', '==', 'published'),
            where('listed', '==', true),
          )
          const snapshot = await getDocs(eventsQuery)
          const events = snapshot.docs.map((doc) => mapFirebaseEventToEvent(doc))
          return sortByDateDesc(events)
        } catch (fallbackError) {
          // Final fallback: fetch all and filter manually
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[fetchPublishedEvents] Missing index for (status ==, listed ==). Falling back to fetching all events and filtering client-side.',
            )
          }
          const snapshot = await getDocs(collection(db, 'events'))
          const allEvents = snapshot.docs
            .map((doc) => {
              const data = doc.data()
              return {
                event: mapFirebaseEventToEvent(doc),
                listed: data.listed ?? true,
              }
            })
            .filter((item) => item.event.meta.status === 'published' && item.listed)
            .map((item) => item.event)
          return sortByDateDesc(allEvents)
        }
      }
      throw error
    }
  } catch (error) {
    console.error('Error in fetchPublishedEvents:', error)
    return []
  }
}

/**
 * Fetches all unique event type badge values from the events collection.
 */
export async function fetchEventTypeBadges(): Promise<string[]> {
  try {
    const eventsQuery = query(collection(db, 'events'), limit(1000))

    const snapshot = await getDocs(eventsQuery)
    const badges = new Set<string>()

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      // Check both category and format fields
      if (data.category && typeof data.category === 'string') {
        badges.add(data.category)
      }
      if (data.format && typeof data.format === 'string') {
        badges.add(data.format)
      }
      // Also check legacy meta.eventType if it exists
      if (data.meta?.eventType && typeof data.meta.eventType === 'string') {
        badges.add(data.meta.eventType)
      }
    })

    return Array.from(badges).sort()
  } catch (error) {
    console.error('Error in fetchEventTypeBadges:', error)
    return []
  }
}

/**
 * Fetches a single event by its slug.
 */
export async function fetchEventBySlug(
  slug: string,
): Promise<(Event & { descriptionHtml?: string }) | null> {
  try {
    const eventsQuery = query(collection(db, 'events'), where('slug', '==', slug))

    const snapshot = await getDocs(eventsQuery)
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    if (!doc) return null
    return mapFirebaseEventToEvent(doc)
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}
