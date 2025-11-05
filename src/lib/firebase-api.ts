import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'
import type { Post, Event, Page, Category } from '@/types'

// Posts API
export async function fetchPosts(categorySlug?: string): Promise<Post[]> {
  try {
    let postsQuery = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    )

    if (categorySlug) {
      // First get the category by slug
      const categoriesQuery = query(collection(db, 'categories'), where('slug', '==', categorySlug))
      const categorySnapshot = await getDocs(categoriesQuery)

      if (categorySnapshot.empty) {
        return []
      }

      const firstDoc = categorySnapshot.docs[0]
      if (!firstDoc) {
        return []
      }

      const categoryId = firstDoc.id
      postsQuery = query(
        collection(db, 'posts'),
        where('_status', '==', 'published'),
        where('categories', 'array-contains', categoryId),
        orderBy('publishedAt', 'desc'),
      )
    }

    const snapshot = await getDocs(postsQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Post,
    )
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function fetchFeaturedPost(): Promise<Post | null> {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(1),
    )

    const snapshot = await getDocs(postsQuery)
    if (snapshot.empty) return null

    const firstDoc = snapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Post
  } catch (error) {
    console.error('Error fetching featured post:', error)
    return null
  }
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('slug', '==', slug),
      where('_status', '==', 'published'),
    )

    const snapshot = await getDocs(postsQuery)
    if (snapshot.empty) return null

    const firstDoc = snapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Post
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

export async function fetchRelatedPosts(
  currentPostId: string,
  categoryIds: string[],
): Promise<Post[]> {
  if (!categoryIds || categoryIds.length === 0) return []

  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      where('categories', 'array-contains-any', categoryIds),
      where('__name__', '!=', currentPostId),
      limit(3),
    )

    const snapshot = await getDocs(postsQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Post,
    )
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

// Events API
export async function fetchPublishedEvents(): Promise<Event[]> {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      where('meta.status', 'in', ['published', 'completed']),
      orderBy('eventStartTime', 'desc'),
    )

    const snapshot = await getDocs(eventsQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Event,
    )
  } catch (error) {
    // During build time, Firebase errors are expected if Firestore rules restrict access
    // These are caught and logged, but don't fail the build
    if (process.env.NODE_ENV === 'production') {
      console.warn('[fetchPublishedEvents] Error during build (may be expected):', error)
    } else {
      console.error('[fetchPublishedEvents] Error fetching events:', error)
    }
    return []
  }
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      where('slug', '==', slug),
      where('meta.status', 'in', ['published', 'completed']),
    )

    const snapshot = await getDocs(eventsQuery)
    if (snapshot.empty) return null

    const firstDoc = snapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Event
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}

// Categories API
export async function fetchCategories(): Promise<Category[]> {
  try {
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'))

    const snapshot = await getDocs(categoriesQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Category,
    )
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Pages API
export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  try {
    const pagesQuery = query(collection(db, 'pages'), where('slug', '==', slug))

    const snapshot = await getDocs(pagesQuery)
    if (snapshot.empty) return null

    const firstDoc = snapshot.docs[0]
    if (!firstDoc) return null

    return {
      id: firstDoc.id,
      ...firstDoc.data(),
    } as Page
  } catch (error) {
    console.error('Error fetching page by slug:', error)
    return null
  }
}

export async function fetchAllPages(): Promise<Page[]> {
  try {
    const pagesQuery = query(collection(db, 'pages'), orderBy('title', 'asc'))

    const snapshot = await getDocs(pagesQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Page,
    )
  } catch (error) {
    // During build time, Firebase errors are expected if Firestore rules restrict access
    // These are caught and logged, but don't fail the build
    if (process.env.NODE_ENV === 'production') {
      console.warn('[fetchAllPages] Error during build (may be expected):', error)
    } else {
      console.error('[fetchAllPages] Error fetching pages:', error)
    }
    return []
  }
}
