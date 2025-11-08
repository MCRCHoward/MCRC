/**
 * Firebase API functions for blog-related data fetching.
 *
 * All functions in this file use Firebase Admin SDK, which:
 * - Bypasses Firestore security rules (safe for build-time static generation)
 * - Works without user authentication
 * - Is the recommended approach for Next.js server components and static generation
 *
 * Client SDK (firebase/firestore) should only be used in client components ('use client')
 */
import type { Post, Category } from '@/types'
import { fetchUsersByIds } from './firebase-api-users'

// ====================================================================
//                          BLOG API CALLS
// ====================================================================

/**
 * Helper to extract timestamp from various Firebase date formats
 */
function getTimestamp(value: unknown): number {
  if (!value) return 0
  // Firebase Timestamp has toMillis method
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis()
  }
  // Date object or ISO string
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'string') {
    return new Date(value).getTime()
  }
  return 0
}

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

/**
 * Sorts posts by date descending (newest first)
 */
function sortByDateDesc<T extends { createdAt?: unknown; publishedAt?: unknown }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aTs = getTimestamp(a.publishedAt ?? a.createdAt)
    const bTs = getTimestamp(b.publishedAt ?? b.createdAt)
    return bTs - aTs
  })
}

/**
 * Validates post structure and filters out invalid posts
 */
function validateAndFilterPosts(posts: Post[]): Post[] {
  const validPosts: Post[] = []
  const invalidPosts: Array<{ id: string; errors: string[] }> = []

  for (const post of posts) {
    const errors: string[] = []

    if (!post.id || typeof post.id !== 'string') {
      errors.push('Missing or invalid id')
    }
    if (!post.slug || typeof post.slug !== 'string') {
      errors.push('Missing or invalid slug')
    }
    if (!post._status || typeof post._status !== 'string') {
      errors.push('Missing or invalid _status')
    } else if (!['draft', 'published', 'deleted'].includes(post._status)) {
      errors.push(`Invalid _status: ${post._status}`)
    }
    if (!post.title || typeof post.title !== 'string') {
      errors.push('Missing or invalid title')
    }

    if (errors.length === 0) {
      validPosts.push(post)
    } else {
      invalidPosts.push({ id: post.id || 'unknown', errors })
    }
  }

  if (invalidPosts.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('[fetchPosts] Filtered out invalid posts:', invalidPosts)
  }

  return validPosts
}

/**
 * Fetches published posts from Firebase. Can optionally filter by category.
 *
 * Required Firestore indexes:
 * - Collection: posts, Fields: _status (Ascending), publishedAt (Descending)
 * - Collection: posts, Fields: _status (Ascending), createdAt (Descending)
 * - Collection: posts, Fields: _status (Ascending), categories (Arrays), publishedAt (Descending)
 *
 * @param categorySlug - The slug of the category to filter by.
 */
export async function fetchPosts(categorySlug?: string): Promise<Post[]> {
  const startTime = Date.now()
  const queryDetails = {
    categorySlug: categorySlug || 'all',
    hasCategoryFilter: Boolean(categorySlug),
  }

  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    let postsQuery = adminDb.collection('posts').where('_status', '==', 'published')

    if (categorySlug) {
      // First get the category by slug
      try {
        const categorySnapshot = await adminDb
          .collection('categories')
          .where('slug', '==', categorySlug)
          .limit(1)
          .get()

        if (categorySnapshot.empty) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[fetchPosts] Category not found:', categorySlug)
          }
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
      } catch (error) {
        console.error('[fetchPosts] Error fetching category:', error)
        return []
      }
    }

    // Try to order by publishedAt first, fallback to createdAt, then no order
    let posts: Post[]
    let queryMethod = 'unknown'
    let queryError: Error | null = null

    try {
      const snapshot = await postsQuery.orderBy('publishedAt', 'desc').get()
      posts = snapshot.docs.map((doc) => {
        const rawData = doc.data()
        const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
        return serialized as Post
      })
      queryMethod = 'publishedAt desc'
    } catch (error) {
      queryError = error instanceof Error ? error : new Error(String(error))
      const errorCode = (error as { code?: string })?.code

      // Check if it's a missing index error
      if (errorCode === 'failed-precondition') {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[fetchPosts] Missing index for _status + publishedAt. Falling back to createdAt.',
          )
        }
      } else {
        console.error('[fetchPosts] Error with publishedAt query:', error)
      }

      try {
        const snapshot = await postsQuery.orderBy('createdAt', 'desc').get()
        posts = snapshot.docs.map((doc) => {
          const rawData = doc.data()
          const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
          return serialized as Post
        })
        queryMethod = 'createdAt desc'
      } catch (error2) {
        queryError = error2 instanceof Error ? error2 : new Error(String(error2))
        const errorCode2 = (error2 as { code?: string })?.code

        if (errorCode2 === 'failed-precondition') {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[fetchPosts] Missing index for _status + createdAt. Fetching without orderBy.',
            )
          }
        } else {
          console.error('[fetchPosts] Error with createdAt query:', error2)
        }

        // No orderBy - fetch all and sort in memory
        const snapshot = await postsQuery.get()
        posts = snapshot.docs.map((doc) => {
          const rawData = doc.data()
          const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
          return serialized as Post
        })
        posts = sortByDateDesc(posts)
        queryMethod = 'no orderBy (in-memory sort)'
      }
    }

    // Validate and filter posts
    const initialCount = posts.length
    posts = validateAndFilterPosts(posts)
    const validCount = posts.length
    const filteredCount = initialCount - validCount

    if (process.env.NODE_ENV !== 'production') {
      const duration = Date.now() - startTime
      console.log('[fetchPosts] Query completed:', {
        ...queryDetails,
        queryMethod,
        totalFetched: initialCount,
        validPosts: validCount,
        filteredOut: filteredCount,
        duration: `${duration}ms`,
        error: queryError ? queryError.message : null,
      })
    }

    // Populate author data for all posts
    const allAuthorIds = Array.from(
      new Set(posts.flatMap((post) => post.authors || []).filter(Boolean)),
    )
    if (allAuthorIds.length > 0) {
      try {
        const authors = await fetchUsersByIds(allAuthorIds)
        const authorMap = new Map(authors.map((author) => [author.id, author]))

        // Add authorData to each post
        posts = posts.map((post) => ({
          ...post,
          authorData: (post.authors || [])
            .map((authorId) => {
              const author = authorMap.get(authorId)
              return author
                ? { id: author.id, name: author.name || '', email: author.email || '' }
                : null
            })
            .filter(
              (author): author is { id: string; name: string; email: string } => author !== null,
            ),
        }))
      } catch (error) {
        console.error('[fetchPosts] Error populating author data:', error)
        // Continue without author data rather than failing
      }
    }

    return posts
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[fetchPosts] Fatal error fetching posts:', {
      ...queryDetails,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })
    return []
  }
}

/**
 * Helper function to populate author data for a post
 */
async function populateAuthorData(post: Post): Promise<Post> {
  if (!post.authors || post.authors.length === 0) {
    return post
  }

  try {
    const authors = await fetchUsersByIds(post.authors)
    const authorData = authors.map((author) => ({
      id: author.id,
      name: author.name || '',
      email: author.email || '',
    }))

    return {
      ...post,
      authorData,
    }
  } catch (error) {
    console.error('[populateAuthorData] Error populating author data:', error)
    return post
  }
}

/**
 * Fetches the featured published post. Prioritizes posts where featured=true.
 * If no featured post exists, falls back to the most recent published post.
 */
export async function fetchFeaturedPost(): Promise<Post | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    let post: Post | null = null

    // Primary: featured=true, published, newest by publishedAt
    try {
      const snapshot = await adminDb
        .collection('posts')
        .where('_status', '==', 'published')
        .where('featured', '==', true)
        .orderBy('publishedAt', 'desc')
        .limit(1)
        .get()

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        if (doc) {
          const rawData = doc.data()
          const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
          post = serialized as Post
        }
      }
    } catch {
      // Fallback: try with createdAt
      try {
        const snapshot = await adminDb
          .collection('posts')
          .where('_status', '==', 'published')
          .where('featured', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          if (doc) {
            const rawData = doc.data()
            const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
            post = serialized as Post
          }
        }
      } catch {
        // Fallback: any featured (no orderBy)
        const snapshot = await adminDb
          .collection('posts')
          .where('_status', '==', 'published')
          .where('featured', '==', true)
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          if (doc) {
            const rawData = doc.data()
            const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
            post = serialized as Post
          }
        }
      }
    }

    // Fallback: most recent published post
    if (!post) {
      try {
        const snapshot = await adminDb
          .collection('posts')
          .where('_status', '==', 'published')
          .orderBy('publishedAt', 'desc')
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          if (doc) {
            const rawData = doc.data()
            const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
            post = serialized as Post
          }
        }
      } catch {
        // Final fallback: any published post (no orderBy)
        const snapshot = await adminDb
          .collection('posts')
          .where('_status', '==', 'published')
          .limit(1)
          .get()

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          if (doc) {
            const rawData = doc.data()
            const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
            post = serialized as Post
          }
        }
      }
    }

    if (!post) return null

    // Populate author data
    return await populateAuthorData(post)
  } catch (error) {
    console.error('[fetchFeaturedPost] Error fetching featured post:', error)
    return null
  }
}

/**
 * Fetches all categories.
 * Categories are serialized to convert Firebase Timestamps to ISO strings for client components.
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    try {
      const snapshot = await adminDb.collection('categories').orderBy('name', 'asc').get()
      return snapshot.docs.map((doc) => {
        const rawData = doc.data()
        const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
        return serialized as Category
      })
    } catch {
      // Fallback: no orderBy
      const snapshot = await adminDb.collection('categories').get()
      return snapshot.docs.map((doc) => {
        const rawData = doc.data()
        const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
        return serialized as Category
      })
    }
  } catch (error) {
    console.error('[fetchCategories] Error fetching categories:', error)
    return []
  }
}

/**
 * Fetches a single post by its slug.
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    const snapshot = await adminDb
      .collection('posts')
      .where('slug', '==', slug)
      .where('_status', '==', 'published')
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    if (!doc) return null

    const rawData = doc.data()
    const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
    const post = serialized as Post

    // Populate author data
    return await populateAuthorData(post)
  } catch (error) {
    console.error('[fetchPostBySlug] Error fetching post by slug:', error)
    return null
  }
}

/**
 * Fetches a single post by its ID.
 */
export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    const postDoc = await adminDb.collection('posts').doc(id).get()

    if (!postDoc.exists) return null

    const rawData = postDoc.data()
    if (!rawData) return null
    const serialized = serializeFirebaseData({ id: postDoc.id, ...rawData })
    const post = serialized as Post

    // Populate author data
    return await populateAuthorData(post)
  } catch (error) {
    console.error('[fetchPostById] Error fetching post by id:', error)
    return null
  }
}

/**
 * Fetches related posts based on shared categories.
 */
export async function fetchRelatedPosts(
  currentPostId: string,
  categoryIds: string[],
): Promise<Post[]> {
  if (!categoryIds || categoryIds.length === 0) return []

  try {
    // Use Admin SDK for server-side operations (bypasses Firestore rules)
    const { adminDb } = await import('./firebase-admin')

    const snapshot = await adminDb
      .collection('posts')
      .where('_status', '==', 'published')
      .where('categories', 'array-contains-any', categoryIds)
      .limit(4) // Get 4 to filter out current post
      .get()

    // Filter out the current post and limit to 3
    let posts = snapshot.docs
      .map((doc) => {
        const rawData = doc.data()
        const serialized = serializeFirebaseData({ id: doc.id, ...rawData })
        return serialized as Post
      })
      .filter((post) => post.id !== currentPostId)
      .slice(0, 3)

    // Populate author data for all related posts
    const allAuthorIds = Array.from(
      new Set(posts.flatMap((post) => post.authors || []).filter(Boolean)),
    )
    if (allAuthorIds.length > 0) {
      const authors = await fetchUsersByIds(allAuthorIds)
      const authorMap = new Map(authors.map((author) => [author.id, author]))

      posts = posts.map((post) => ({
        ...post,
        authorData: (post.authors || [])
          .map((authorId) => {
            const author = authorMap.get(authorId)
            return author
              ? { id: author.id, name: author.name || '', email: author.email || '' }
              : null
          })
          .filter(
            (author): author is { id: string; name: string; email: string } => author !== null,
          ),
      }))
    }

    return posts
  } catch (error) {
    console.error('[fetchRelatedPosts] Error fetching related posts:', error)
    return []
  }
}
