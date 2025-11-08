/**
 * Firebase API functions for server-side data fetching.
 *
 * All functions in this file use Firebase Admin SDK, which:
 * - Bypasses Firestore security rules (safe for build-time static generation)
 * - Works without user authentication
 * - Is the recommended approach for Next.js server components and static generation
 *
 * Client SDK (firebase/firestore) should only be used in client components ('use client')
 */
import type { Event, Page } from '@/types'

/**
 * Converts Firebase Timestamp to ISO string for serialization
 * Handles both Admin SDK Timestamps (with toDate()) and raw Firestore Timestamps (with _seconds/_nanoseconds)
 */
function timestampToISOString(value: unknown): string | undefined {
  if (!value) return undefined

  // Firebase Admin SDK Timestamp has toDate() method
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate: () => Date }).toDate
    if (typeof toDate === 'function') {
      return toDate().toISOString()
    }
  }

  // Raw Firestore Timestamp format: {_seconds: number, _nanoseconds: number}
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    '_nanoseconds' in value
  ) {
    const seconds = (value as { _seconds: number })._seconds
    const nanoseconds = (value as { _nanoseconds: number })._nanoseconds
    if (typeof seconds === 'number') {
      // Convert seconds + nanoseconds to milliseconds
      const milliseconds = seconds * 1000 + Math.floor(nanoseconds / 1000000)
      return new Date(milliseconds).toISOString()
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    return value.toISOString()
  }

  // Already a string
  if (typeof value === 'string') {
    return value
  }

  return undefined
}

/**
 * Recursively serializes Firebase data, converting Timestamps to ISO strings
 * This is required for passing data from Server Components to Client Components
 */
function serializeFirebaseData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirebaseData(item)) as T
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a Firebase Timestamp (Admin SDK with toDate() or raw format)
    if (
      ('toDate' in data && typeof (data as { toDate?: () => Date }).toDate === 'function') ||
      ('_seconds' in data && '_nanoseconds' in data)
    ) {
      const timestamp = timestampToISOString(data)
      return timestamp as unknown as T
    }

    // Regular object - serialize all properties
    const serialized = {} as T
    for (const [key, value] of Object.entries(data)) {
      ;(serialized as Record<string, unknown>)[key] = serializeFirebaseData(value)
    }
    return serialized
  }

  // Primitive values (string, number, boolean) - return as-is
  return data
}

// Posts API - Re-exported from firebase-api-blog.ts
// All blog-related functions have been moved to firebase-api-blog.ts for better organization
// These re-exports maintain backward compatibility
export {
  fetchPosts,
  fetchFeaturedPost,
  fetchPostBySlug,
  fetchPostById,
  fetchRelatedPosts,
} from './firebase-api-blog'

// Events API
export async function fetchPublishedEvents(): Promise<Event[]> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const eventsSnapshot = await adminDb
      .collection('events')
      .where('meta.status', 'in', ['published', 'completed'])
      .orderBy('eventStartTime', 'desc')
      .get()

    return eventsSnapshot.docs.map((doc) => {
      const rawData = doc.data()
      const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
      return serialized as Event
    })
  } catch (error) {
    console.error('[fetchPublishedEvents] Error fetching events:', error)
    return []
  }
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const eventsSnapshot = await adminDb
      .collection('events')
      .where('slug', '==', slug)
      .where('meta.status', 'in', ['published', 'completed'])
      .limit(1)
      .get()

    if (eventsSnapshot.empty) return null

    const firstDoc = eventsSnapshot.docs[0]
    if (!firstDoc) return null

    const rawData = firstDoc.data()
    const serialized = serializeFirebaseData({ id: firstDoc.id, ...rawData })
    return serialized as Event
  } catch (error) {
    console.error('[fetchEventBySlug] Error fetching event by slug:', error)
    return null
  }
}

// Categories API - Re-exported from firebase-api-blog.ts
export { fetchCategories } from './firebase-api-blog'

// Pages API
export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const pagesSnapshot = await adminDb.collection('pages').where('slug', '==', slug).limit(1).get()

    if (pagesSnapshot.empty) return null

    const firstDoc = pagesSnapshot.docs[0]
    if (!firstDoc) return null

    const rawData = firstDoc.data()
    const serialized = serializeFirebaseData({ id: firstDoc.id, ...rawData })
    return serialized as Page
  } catch (error) {
    console.error('[fetchPageBySlug] Error fetching page by slug:', error)
    return null
  }
}

export async function fetchAllPages(): Promise<Page[]> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    // This is necessary during build time when there's no authenticated user
    const { adminDb } = await import('./firebase-admin')
    const pagesSnapshot = await adminDb.collection('pages').orderBy('title', 'asc').get()

    return pagesSnapshot.docs.map((doc) => {
      const rawData = doc.data()
      const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
      return serialized as Page
    })
  } catch (error) {
    console.error('[fetchAllPages] Error fetching pages:', error)
    return []
  }
}
