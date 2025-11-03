'use server'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'

const COOKIE_NAME = 'firebase-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * POST /api/session
 *
 * Verifies Firebase ID token from client and sets HttpOnly session cookie.
 * Called by LoginForm after successful sign-in.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { idToken } = body as { idToken?: string }

    if (!idToken || typeof idToken !== 'string') {
      return Response.json({ error: 'Missing idToken' }, { status: 400 })
    }

    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Get additional user data from Firestore if needed
    // For now, we'll just store the verified token in the cookie

    // Set secure, HttpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

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
