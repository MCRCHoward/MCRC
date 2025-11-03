/**
 * This file serves as the central library for all Firebase API calls.
 * It contains functions for fetching data related to various collections
 * like Posts, Categories, and Events.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  type Query,
  type DocumentData,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { db } from './firebase'
import type { Post, Category, Event } from '@/types'

// ====================================================================
//                          BLOG API CALLS
// ====================================================================

/**
 * Fetches published posts from Firebase. Can optionally filter by category.
 * @param categorySlug - The slug of the category to filter by.
 */
export async function fetchPosts(categorySlug?: string): Promise<Post[]> {
  function isIndexError(e: unknown) {
    return e instanceof FirebaseError && e.code === 'failed-precondition'
  }

  function mapSnapshot<T>(snap: Awaited<ReturnType<typeof getDocs>>): T[] {
    return snap.docs.map((d) => {
      const data = (d.data() || {}) as Record<string, unknown>
      return { id: d.id, ...data } as T
    })
  }

  function sortByDateDesc<T extends { createdAt?: any; publishedAt?: any }>(rows: T[]) {
    return [...rows].sort((a, b) => {
      const aTs = (a.publishedAt ?? a.createdAt)?.toMillis?.() ?? 0
      const bTs = (b.publishedAt ?? b.createdAt)?.toMillis?.() ?? 0
      return bTs - aTs
    })
  }

  try {
    let base: Query<DocumentData>

    if (categorySlug) {
      // Resolve category id from slug first
      const categoriesQ = query(collection(db, 'categories'), where('slug', '==', categorySlug))
      const catSnap = await getDocs(categoriesQ)
      if (catSnap.empty) return []
      const firstCat = catSnap.docs.at(0)
      if (!firstCat) return []
      const categoryId = firstCat.id

      // Primary query (may need composite index)
      base = query(
        collection(db, 'posts'),
        where('_status', '==', 'published'),
        where('categories', 'array-contains', categoryId),
        orderBy('publishedAt', 'desc'),
      )

      try {
        const snap = await getDocs(base)
        return mapSnapshot<Post>(snap)
      } catch (e) {
        if (isIndexError(e)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[fetchPosts] Missing index for (categories ARRAY_CONTAINS, _status ==, orderBy publishedAt). Falling back to createdAt…',
            )
          }
          // Fallback 1: order by createdAt
          const fb1 = query(
            collection(db, 'posts'),
            where('_status', '==', 'published'),
            where('categories', 'array-contains', categoryId),
            orderBy('createdAt', 'desc'),
          )
          try {
            const snap = await getDocs(fb1)
            return mapSnapshot<Post>(snap)
          } catch (e2) {
            if (isIndexError(e2)) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(
                  '[fetchPosts] Missing index for (categories ARRAY_CONTAINS, _status ==, orderBy createdAt). Falling back to no order…',
                )
              }
              const fb2 = query(
                collection(db, 'posts'),
                where('_status', '==', 'published'),
                where('categories', 'array-contains', categoryId),
              )
              const snap = await getDocs(fb2)
              return sortByDateDesc<Post>(mapSnapshot<Post>(snap))
            }
            throw e2
          }
        }
        throw e
      }
    } else {
      // No category filter
      base = query(
        collection(db, 'posts'),
        where('_status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
      )

      try {
        const snap = await getDocs(base)
        return mapSnapshot<Post>(snap)
      } catch (e) {
        if (isIndexError(e)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[fetchPosts] Missing index for (_status ==, orderBy publishedAt). Falling back to createdAt…',
            )
          }
          const fb1 = query(
            collection(db, 'posts'),
            where('_status', '==', 'published'),
            orderBy('createdAt', 'desc'),
          )
          try {
            const snap = await getDocs(fb1)
            return mapSnapshot<Post>(snap)
          } catch (e2) {
            if (isIndexError(e2)) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(
                  '[fetchPosts] Missing index for (_status ==, orderBy createdAt). Falling back to no order…',
                )
              }
              const fb2 = query(collection(db, 'posts'), where('_status', '==', 'published'))
              const snap = await getDocs(fb2)
              return sortByDateDesc<Post>(mapSnapshot<Post>(snap))
            }
            throw e2
          }
        }
        throw e
      }
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

/**
 * Fetches the featured published post. Prioritizes posts where featured=true.
 * If no featured post exists, falls back to the most recent published post.
 */
export async function fetchFeaturedPost(): Promise<Post | null> {
  function isIndexError(e: unknown) {
    return e instanceof FirebaseError && e.code === 'failed-precondition'
  }

  try {
    // Primary: featured=true, published, newest by createdAt
    const primary = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1),
    )

    try {
      const snap = await getDocs(primary)
      if (!snap.empty) {
        const doc0 = snap.docs.at(0)
        if (doc0) return { id: doc0.id, ...(doc0.data() as Record<string, unknown>) } as Post
      }
    } catch (e) {
      if (isIndexError(e) && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[fetchFeaturedPost] Missing index for (_status ==, featured ==, orderBy createdAt). Falling back…',
        )
      }
      // fall through
    }

    // Fallback 1: any featured (no orderBy)
    const fb1 = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      where('featured', '==', true),
      limit(1),
    )
    const fb1Snap = await getDocs(fb1)
    if (!fb1Snap.empty) {
      const doc0 = fb1Snap.docs.at(0)
      if (doc0) return { id: doc0.id, ...(doc0.data() as Record<string, unknown>) } as Post
    }

    // Fallback 2: most recent published by createdAt
    const fb2 = query(
      collection(db, 'posts'),
      where('_status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(1),
    )
    try {
      const fb2Snap = await getDocs(fb2)
      if (!fb2Snap.empty) {
        const doc0 = fb2Snap.docs.at(0)
        if (doc0) return { id: doc0.id, ...(doc0.data() as Record<string, unknown>) } as Post
      }
    } catch (e2) {
      if (isIndexError(e2) && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[fetchFeaturedPost] Missing index for (_status ==, orderBy createdAt). Final fallback…',
        )
      }
      const fb3 = query(collection(db, 'posts'), where('_status', '==', 'published'), limit(1))
      const fb3Snap = await getDocs(fb3)
      if (!fb3Snap.empty) {
        const doc0 = fb3Snap.docs.at(0)
        if (doc0) return { id: doc0.id, ...(doc0.data() as Record<string, unknown>) } as Post
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching featured post:', error)
    return null
  }
}

/**
 * Fetches all categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'))
    try {
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[fetchCategories] Failed orderBy(name). Retrying without orderBy…')
      }
      const fb = query(collection(db, 'categories'))
      const snapshot = await getDocs(fb)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Category)
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Fetches a single post by its slug.
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    const postsQuery = query(
      collection(db, 'posts'),
      where('slug', '==', slug),
      where('_status', '==', 'published'),
    )

    const snapshot = await getDocs(postsQuery)
    if (snapshot.empty) return null
    const doc0 = snapshot.docs.at(0)
    if (!doc0) return null
    return { id: doc0.id, ...(doc0.data() as Record<string, unknown>) } as Post
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

/**
 * Fetches a single post by its ID.
 */
export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    const postRef = doc(db, 'posts', id)
    const postSnap = await getDoc(postRef)

    if (!postSnap.exists()) return null

    return { id: postSnap.id, ...(postSnap.data() as Record<string, unknown>) } as Post
  } catch (error) {
    console.error('Error fetching post by id:', error)
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
