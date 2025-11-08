/**
 * Blog fetching diagnostic utilities.
 * These functions help diagnose issues with blog post fetching from Firestore.
 */

import type { Post } from '@/types'

/**
 * Validates that a post has all required fields
 */
export function validatePostStructure(post: unknown): {
  valid: boolean
  errors: string[]
  post: Post | null
} {
  const errors: string[] = []
  let validPost: Post | null = null

  if (!post || typeof post !== 'object') {
    return { valid: false, errors: ['Post is not an object'], post: null }
  }

  const p = post as Record<string, unknown>

  // Check required fields
  if (!p.id || typeof p.id !== 'string') {
    errors.push('Missing or invalid id field')
  }

  if (!p.slug || typeof p.slug !== 'string') {
    errors.push('Missing or invalid slug field')
  }

  if (!p._status || typeof p._status !== 'string') {
    errors.push('Missing or invalid _status field')
  } else if (!['draft', 'published', 'deleted'].includes(p._status)) {
    errors.push(`Invalid _status value: ${p._status}`)
  }

  if (!p.title || typeof p.title !== 'string') {
    errors.push('Missing or invalid title field')
  }

  if (errors.length === 0) {
    // Type assertion is safe here because we've validated all required fields
    validPost = p as unknown as Post
  }

  return { valid: errors.length === 0, errors, post: validPost }
}

/**
 * Tests Admin SDK connection by attempting a simple query
 */
export async function testAdminSDKConnection(): Promise<{
  success: boolean
  error?: string
  details?: {
    projectId?: string
    collectionCount?: number
  }
}> {
  try {
    const { adminDb, default: adminApp } = await import('./firebase-admin')

    // Try to get a collection reference (doesn't actually query)
    const postsRef = adminDb.collection('posts')
    const projectId = adminApp?.options.projectId

    // Try a simple count query (limited to 1 doc for speed)
    const testSnapshot = await postsRef.limit(1).get()

    return {
      success: true,
      details: {
        projectId,
        collectionCount: testSnapshot.size,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Comprehensive diagnostic for blog fetching
 * Checks posts, status distribution, missing fields, etc.
 */
export async function diagnoseBlogFetching(): Promise<{
  totalPosts: number
  postsByStatus: Record<string, number>
  publishedPosts: number
  postsWithMissingFields: Array<{ id: string; errors: string[] }>
  samplePublishedPost?: Post
  adminSDKStatus: Awaited<ReturnType<typeof testAdminSDKConnection>>
}> {
  try {
    const { adminDb } = await import('./firebase-admin')

    // Fetch all posts (no filter to see everything)
    const allPostsSnapshot = await adminDb.collection('posts').limit(100).get()

    const totalPosts = allPostsSnapshot.size
    const postsByStatus: Record<string, number> = {}
    const postsWithMissingFields: Array<{ id: string; errors: string[] }> = []
    let publishedPosts = 0
    let samplePublishedPost: Post | undefined

    for (const doc of allPostsSnapshot.docs) {
      const data = doc.data()
      const status = (data._status as string) || 'unknown'
      postsByStatus[status] = (postsByStatus[status] || 0) + 1

      if (status === 'published') {
        publishedPosts++
        if (!samplePublishedPost) {
          const validation = validatePostStructure({ id: doc.id, ...data })
          if (validation.valid && validation.post) {
            samplePublishedPost = validation.post
          }
        }
      }

      // Validate structure
      const validation = validatePostStructure({ id: doc.id, ...data })
      if (!validation.valid) {
        postsWithMissingFields.push({
          id: doc.id,
          errors: validation.errors,
        })
      }
    }

    const adminSDKStatus = await testAdminSDKConnection()

    return {
      totalPosts,
      postsByStatus,
      publishedPosts,
      postsWithMissingFields,
      samplePublishedPost,
      adminSDKStatus,
    }
  } catch (error) {
    console.error('[diagnoseBlogFetching] Error:', error)
    return {
      totalPosts: 0,
      postsByStatus: {},
      publishedPosts: 0,
      postsWithMissingFields: [],
      adminSDKStatus: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

/**
 * Checks if required Firestore indexes exist by attempting queries
 * Note: This doesn't actually check index existence, but tests if queries work
 */
export async function checkFirestoreIndexes(): Promise<{
  indexes: Array<{
    name: string
    query: string
    works: boolean
    error?: string
  }>
}> {
  const indexes: Array<{
    name: string
    query: string
    works: boolean
    error?: string
  }> = []

  try {
    const { adminDb } = await import('./firebase-admin')

    // Test 1: _status == 'published' + orderBy('publishedAt')
    try {
      await adminDb
        .collection('posts')
        .where('_status', '==', 'published')
        .orderBy('publishedAt', 'desc')
        .limit(1)
        .get()
      indexes.push({
        name: '_status + publishedAt',
        query: "where('_status', '==', 'published').orderBy('publishedAt', 'desc')",
        works: true,
      })
    } catch (error) {
      indexes.push({
        name: '_status + publishedAt',
        query: "where('_status', '==', 'published').orderBy('publishedAt', 'desc')",
        works: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Test 2: _status == 'published' + orderBy('createdAt')
    try {
      await adminDb
        .collection('posts')
        .where('_status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
      indexes.push({
        name: '_status + createdAt',
        query: "where('_status', '==', 'published').orderBy('createdAt', 'desc')",
        works: true,
      })
    } catch (error) {
      indexes.push({
        name: '_status + createdAt',
        query: "where('_status', '==', 'published').orderBy('createdAt', 'desc')",
        works: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Test 3: _status + featured + publishedAt
    try {
      await adminDb
        .collection('posts')
        .where('_status', '==', 'published')
        .where('featured', '==', true)
        .orderBy('publishedAt', 'desc')
        .limit(1)
        .get()
      indexes.push({
        name: '_status + featured + publishedAt',
        query:
          "where('_status', '==', 'published').where('featured', '==', true).orderBy('publishedAt', 'desc')",
        works: true,
      })
    } catch (error) {
      indexes.push({
        name: '_status + featured + publishedAt',
        query:
          "where('_status', '==', 'published').where('featured', '==', true).orderBy('publishedAt', 'desc')",
        works: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Test 4: slug + _status
    try {
      await adminDb
        .collection('posts')
        .where('slug', '==', 'test-slug')
        .where('_status', '==', 'published')
        .limit(1)
        .get()
      indexes.push({
        name: 'slug + _status',
        query: "where('slug', '==', 'test-slug').where('_status', '==', 'published')",
        works: true,
      })
    } catch (error) {
      indexes.push({
        name: 'slug + _status',
        query: "where('slug', '==', 'test-slug').where('_status', '==', 'published')",
        works: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } catch (error) {
    console.error('[checkFirestoreIndexes] Error:', error)
  }

  return { indexes }
}
