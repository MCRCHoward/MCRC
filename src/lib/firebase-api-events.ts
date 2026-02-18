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
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from '@/firebase/client'
import type { Event } from '@/types'
import type { FirestoreEventData } from '@/types/event-firestore'
import { firestoreToEvent, firestoreToEventForEdit } from '@/lib/events'

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
      where('isArchived', '==', false),
      orderBy('startAt', 'desc'),
    )

    try {
      const snapshot = await getDocs(eventsQuery)
      return snapshot.docs
        .map((doc) => firestoreToEvent(doc.id, doc.data() as FirestoreEventData))
        .filter((ev) => ev.isArchived !== true)
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
            where('isArchived', '==', false),
          )
          const snapshot = await getDocs(eventsQuery)
          const events = snapshot.docs
            .map((doc) => firestoreToEvent(doc.id, doc.data() as FirestoreEventData))
            .filter((ev) => ev.isArchived !== true)
          return sortByDateDesc(events)
        } catch (_fallbackError) {
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
                event: firestoreToEvent(doc.id, data as FirestoreEventData),
                listed: data.listed ?? true,
                isArchived: data.isArchived === true,
              }
            })
            .filter(
              (item) =>
                item.event.meta.status === 'published' &&
                item.listed &&
                item.isArchived === false,
            )
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
 * Uses firestoreToEventForEdit to include descriptionHtml for detail pages.
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
    return firestoreToEventForEdit(doc.id, doc.data() as FirestoreEventData)
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}
