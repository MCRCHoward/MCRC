import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import type { User } from '@/types'
import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'

/**
 * Gets the current authenticated user from the session cookie.
 * Verifies the token with Firebase Admin and fetches user data from Firestore.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const idToken = cookieStore.get('firebase-token')?.value

    if (!idToken) {
      return null
    }

    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Fetch user profile from Firestore using Admin SDK
    const userDocRef = adminDb.doc(`users/${uid}`)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      // User document doesn't exist yet, create a minimal user object
      return {
        id: uid,
        email: decodedToken.email ?? '',
        name: decodedToken.name ?? '',
        role: 'participant', // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const userData = userDoc.data()

    // Build User object from Firestore data
    // Convert Firestore Timestamps to ISO strings for client components
    const user: User = {
      id: uid,
      email: userData?.email ?? decodedToken.email ?? '',
      name: userData?.name ?? decodedToken.name ?? '',
      role: (userData?.role as User['role']) ?? 'participant',
      createdAt: toISOString(userData?.createdAt) ?? new Date().toISOString(),
      updatedAt: toISOString(userData?.updatedAt) ?? new Date().toISOString(),
    }

    return user
  } catch (error) {
    console.error('[getCurrentUser] Error:', error)
    return null
  }
}

/**
 * Requires authentication. Throws if no user is authenticated.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Requires a specific role. Admins can access any role-protected route.
 */
export async function requireRole(requiredRole: 'admin' | 'coordinator'): Promise<User> {
  const user = await requireAuth()
  if (user.role !== requiredRole && user.role !== 'admin') {
    throw new Error(`Role ${requiredRole} required`)
  }
  return user
}
