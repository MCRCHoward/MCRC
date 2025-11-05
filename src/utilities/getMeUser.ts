import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/types'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

/**
 * Gets the current authenticated user and optionally redirects based on authentication state.
 *
 * @deprecated Use `getCurrentUser` from `@/lib/custom-auth` instead for better Firebase integration.
 * This function is kept for backward compatibility but may be removed in the future.
 *
 * @param args - Configuration options
 * @param args.nullUserRedirect - Redirect URL if user is not authenticated
 * @param args.validUserRedirect - Redirect URL if user is authenticated
 * @returns Promise resolving to token and user object
 * @throws Redirects if redirect URLs are provided and conditions are met
 */
export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<{
  token: string
  user: User
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value

  if (!token) {
    if (nullUserRedirect) {
      redirect(nullUserRedirect)
    }
    throw new Error('No authentication token found')
  }

  try {
    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token)
    const uid = decodedToken.uid

    // Fetch user profile from Firestore using Admin SDK
    const userDocRef = adminDb.doc(`users/${uid}`)
    const userDoc = await userDocRef.get()

    let user: User

    if (!userDoc.exists) {
      // User document doesn't exist yet, create a minimal user object
      user = {
        id: uid,
        email: decodedToken.email ?? '',
        name: decodedToken.name ?? '',
        role: 'participant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    } else {
      const userData = userDoc.data()
      user = {
        id: uid,
        email: userData?.email ?? decodedToken.email ?? null,
        name: userData?.name ?? decodedToken.name ?? null,
        role: (userData?.role as User['role']) ?? 'participant',
        createdAt: userData?.createdAt ?? new Date().toISOString(),
        updatedAt: userData?.updatedAt ?? new Date().toISOString(),
      }
    }

    if (validUserRedirect && user) {
      redirect(validUserRedirect)
    }

    return {
      token,
      user,
    }
  } catch (error) {
    console.error('[getMeUser] Error:', error)

    if (nullUserRedirect) {
      redirect(nullUserRedirect)
    }

    throw new Error('Failed to authenticate user')
  }
}
