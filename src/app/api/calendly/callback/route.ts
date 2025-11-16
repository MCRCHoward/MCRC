import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/custom-auth'
import { getCalendlyCredentials, CALENDLY_OAUTH_BASE, getCalendlyEnvironment } from '@/lib/calendly-config'
import { saveCalendlyTokens } from '@/lib/actions/calendly-settings-actions'
import type { CalendlyTokenResponse, CalendlyErrorResponse } from '@/types/calendly'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/calendly/callback
 *
 * Handles OAuth callback from Calendly
 * Exchanges authorization code for access token
 * Stores encrypted tokens in Firestore
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const _state = searchParams.get('state')

    // Handle OAuth errors
    if (error) {
      console.error('[CalendlyCallback] OAuth error:', error)
      return NextResponse.redirect(
        new URL('/dashboard/settings/calendly?error=oauth_denied', request.url),
      )
    }

    // Validate authorization code
    if (!code) {
      console.error('[CalendlyCallback] No authorization code provided')
      return NextResponse.redirect(
        new URL('/dashboard/settings/calendly?error=no_code', request.url),
      )
    }

    const creds = getCalendlyCredentials()
    const env = getCalendlyEnvironment()

    // Exchange code for tokens
    console.log('[CalendlyCallback] Exchanging code for tokens...')

    const tokenResponse = await fetch(`${CALENDLY_OAUTH_BASE[env]}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: creds.redirectUri,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData: CalendlyErrorResponse = await tokenResponse.json()
      console.error('[CalendlyCallback] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings/calendly?error=${encodeURIComponent(errorData.message || 'token_exchange_failed')}`,
          request.url,
        ),
      )
    }

    const tokenData: CalendlyTokenResponse = await tokenResponse.json()

    // Save encrypted tokens to Firestore
    console.log('[CalendlyCallback] Saving tokens...')
    await saveCalendlyTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      owner: tokenData.owner,
    })

    console.log('[CalendlyCallback] OAuth flow completed successfully')

    // Redirect back to settings page with success
    return NextResponse.redirect(
      new URL('/dashboard/settings/calendly?success=connected', request.url),
    )
  } catch (error) {
    console.error('[CalendlyCallback] FAILED:', error)
    const errorMessage = error instanceof Error ? error.message : 'Callback failed'
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/calendly?error=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    )
  }
}

