/**
 * Firebase API functions for user-related data fetching.
 *
 * All functions in this file use Firebase Admin SDK for server-side operations.
 */
import { adminDb } from '@/lib/firebase-admin'
import type { User } from '@/types'

/**
 * Converts Firebase Timestamp to ISO string for serialization
 */
function timestampToISOString(value: unknown): string | undefined {
  if (!value) return undefined

  // Firebase Admin SDK Timestamp has toDate() method
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate: () => Date }).toDate
    if (typeof toDate === 'function') {
      try {
        return toDate().toISOString()
      } catch {
        return undefined
      }
    }
  }

  // Raw Firestore Timestamp format: {_seconds: number, _nanoseconds: number}
  if (
    typeof value === 'object' &&
    value !== null &&
    '_seconds' in value &&
    '_nanoseconds' in value
  ) {
    const seconds = (value as { _seconds?: unknown })._seconds
    const nanoseconds = (value as { _nanoseconds?: unknown })._nanoseconds
    if (
      typeof seconds === 'number' &&
      typeof nanoseconds === 'number' &&
      !Number.isNaN(seconds) &&
      !Number.isNaN(nanoseconds)
    ) {
      try {
        const milliseconds = seconds * 1000 + Math.floor(nanoseconds / 1000000)
        return new Date(milliseconds).toISOString()
      } catch {
        return undefined
      }
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    try {
      return value.toISOString()
    } catch {
      return undefined
    }
  }

  // Already a string
  if (typeof value === 'string') {
    return value
  }

  return undefined
}

/**
 * Fetches all users who can be authors (staff, admin, coordinator roles)
 * Used for author selection in blog post forms
 */
export async function fetchAuthorUsers(): Promise<User[]> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .where('role', 'in', ['admin', 'coordinator', 'mediator'])
      .orderBy('name', 'asc')
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email ?? '',
        name: data.name ?? '',
        role: (data.role as User['role']) ?? 'participant',
        createdAt: timestampToISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: timestampToISOString(data.updatedAt) ?? new Date().toISOString(),
      } as User
    })
  } catch (error) {
    console.error('[fetchAuthorUsers] Error fetching users:', error)
    return []
  }
}

/**
 * Fetches user data by IDs
 * Used to populate author information when displaying posts
 */
export async function fetchUsersByIds(userIds: string[]): Promise<User[]> {
  if (userIds.length === 0) return []

  try {
    // Firestore 'in' queries are limited to 10 items
    // Split into batches if needed
    const batches: string[][] = []
    for (let i = 0; i < userIds.length; i += 10) {
      batches.push(userIds.slice(i, i + 10))
    }

    const userPromises = batches.map(async (batch) => {
      // Use getAll() for batch fetching by document IDs (more efficient than 'in' query)
      const docRefs = batch.map((id) => adminDb.doc(`users/${id}`))
      const docs = await adminDb.getAll(...docRefs)

      return docs
        .filter((doc) => doc.exists)
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            email: data?.email ?? '',
            name: data?.name ?? '',
            role: (data?.role as User['role']) ?? 'participant',
            createdAt: timestampToISOString(data?.createdAt) ?? new Date().toISOString(),
            updatedAt: timestampToISOString(data?.updatedAt) ?? new Date().toISOString(),
          } as User
        })
    })

    const userArrays = await Promise.all(userPromises)
    return userArrays.flat()
  } catch (error) {
    console.error('[fetchUsersByIds] Error fetching users:', error)
    return []
  }
}
