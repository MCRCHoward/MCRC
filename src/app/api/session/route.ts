'use server'

import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

const COOKIE_NAME = 'firebase-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Ensure a user profile exists in Firestore (server-side via Admin SDK)
 */
async function ensureUserProfile(uid: string, email?: string | null, displayName?: string | null) {
  const profileStart = performance.now()

  try {
    const userRef = adminDb.doc(`users/${uid}`)
    const snapshot = await userRef.get()

    if (!snapshot.exists) {
      await userRef.set(
        {
          email: email ?? null,
          name: displayName ?? email?.split('@')[0] ?? 'New User',
          role: 'participant',
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      )
      console.log(`[SESSION API] New user profile created: ${uid}`)
    } else if (!snapshot.data()?.role) {
      await userRef.set({ role: 'participant' }, { merge: true })
      console.log(`[SESSION API] User profile updated with role: ${uid}`)
    }

    console.log(
      `[SESSION API] Profile check complete: ${(performance.now() - profileStart).toFixed(2)}ms`,
    )
  } catch (error) {
    console.error('[SESSION API] ensureUserProfile error:', error)
  }
}

/**
 * POST /api/session
 *
 * Verifies Firebase ID token from client and sets HttpOnly session cookie.
 * Called by LoginForm after successful sign-in.
 */
export async function POST(request: Request) {
  const startTime = performance.now()
  console.log('[SESSION API] Request received')

  try {
    const body = (await request.json()) as {
      idToken?: string
      email?: string | null
      displayName?: string | null
    }
    const { idToken, email, displayName } = body

    if (!idToken || typeof idToken !== 'string') {
      return Response.json({ error: 'Missing idToken' }, { status: 400 })
    }

    // Token verification
    const verifyStart = performance.now()
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log(`[SESSION API] Token verified: ${(performance.now() - verifyStart).toFixed(2)}ms`)

    const uid = decodedToken.uid

    await Promise.all([
      (async () => {
        const cookieStart = performance.now()
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, idToken, {
          httpOnly: true,
          secure: IS_PRODUCTION,
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        })
        console.log(`[SESSION API] Cookie set: ${(performance.now() - cookieStart).toFixed(2)}ms`)
      })(),
      ensureUserProfile(uid, email, displayName),
    ])

    const totalTime = performance.now() - startTime
    console.log(`[SESSION API] Total request time: ${totalTime.toFixed(2)}ms`)

    return Response.json({ success: true, uid })
  } catch (error) {
    console.error('[SESSION API] POST error:', error)
    const message = error instanceof Error ? error.message : 'Token verification failed'
    return Response.json({ error: message }, { status: 401 })
  }
}

/**
 * DELETE /api/session
 *
 * Clears the session cookie on sign-out.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)

    return Response.json({ success: true })
  } catch (error) {
    console.error('[SESSION API] DELETE error:', error)
    return Response.json({ error: 'Failed to clear session' }, { status: 500 })
  }
}
