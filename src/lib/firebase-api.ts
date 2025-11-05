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
import type { Post, Event, Page, Category } from '@/types'

// Posts API
export async function fetchPosts(categorySlug?: string): Promise<Post[]> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    let postsQuery = adminDb
      .collection('posts')
      .where('_status', '==', 'published')
      .orderBy('publishedAt', 'desc')

    if (categorySlug) {
      // First get the category by slug
      const categorySnapshot = await adminDb
        .collection('categories')
        .where('slug', '==', categorySlug)
        .limit(1)
        .get()

      if (categorySnapshot.empty) {
        return []
      }

      const firstDoc = categorySnapshot.docs[0]
      if (!firstDoc) {
        return []
      }

      const categoryId = firstDoc.id
      postsQuery = adminDb
        .collection('posts')
        .where('_status', '==', 'published')
        .where('categories', 'array-contains', categoryId)
        .orderBy('publishedAt', 'desc')
    }

    const snapshot = await postsQuery.get()
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Post,
    )
  } catch (error) {
    console.error('[fetchPosts] Error fetching posts:', error)
    return []
  }
}

export async function fetchFeaturedPost(): Promise<Post | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const postsSnapshot = await adminDb
      .collection('posts')
      .where('_status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get()

    if (postsSnapshot.empty) return null

    const firstDoc = postsSnapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Post
  } catch (error) {
    console.error('[fetchFeaturedPost] Error fetching featured post:', error)
    return null
  }
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const postsSnapshot = await adminDb
      .collection('posts')
      .where('slug', '==', slug)
      .where('_status', '==', 'published')
      .limit(1)
      .get()

    if (postsSnapshot.empty) return null

    const firstDoc = postsSnapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Post
  } catch (error) {
    console.error('[fetchPostBySlug] Error fetching post by slug:', error)
    return null
  }
}

export async function fetchRelatedPosts(
  currentPostId: string,
  categoryIds: string[],
): Promise<Post[]> {
  if (!categoryIds || categoryIds.length === 0) return []

  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const postsSnapshot = await adminDb
      .collection('posts')
      .where('_status', '==', 'published')
      .where('categories', 'array-contains-any', categoryIds)
      .limit(3)
      .get()

    // Filter out the current post manually (Admin SDK doesn't support __name__ !=)
    return postsSnapshot.docs
      .filter((doc) => doc.id !== currentPostId)
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Post,
      )
  } catch (error) {
    console.error('[fetchRelatedPosts] Error fetching related posts:', error)
    return []
  }
}

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

    return eventsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Event,
    )
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

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Event
  } catch (error) {
    console.error('[fetchEventBySlug] Error fetching event by slug:', error)
    return null
  }
}

// Categories API
export async function fetchCategories(): Promise<Category[]> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const categoriesSnapshot = await adminDb.collection('categories').orderBy('name', 'asc').get()

    return categoriesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Category,
    )
  } catch (error) {
    console.error('[fetchCategories] Error fetching categories:', error)
    return []
  }
}

// Pages API
export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')
    const pagesSnapshot = await adminDb.collection('pages').where('slug', '==', slug).limit(1).get()

    if (pagesSnapshot.empty) return null

    const firstDoc = pagesSnapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Page
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

    return pagesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Page,
    )
  } catch (error) {
    console.error('[fetchAllPages] Error fetching pages:', error)
    return []
  }
}
