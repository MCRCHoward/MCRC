import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/custom-auth'
import { getCalendlyCredentials, CALENDLY_OAUTH_BASE, getCalendlyEnvironment } from '@/lib/calendly-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/calendly/authorize
 *
 * Initiates Calendly OAuth flow (admin only)
 * Redirects user to Calendly authorization page
 */
export async function GET(_request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    const creds = getCalendlyCredentials()
    const env = getCalendlyEnvironment()

    // Validate credentials
    if (!creds.clientId || !creds.redirectUri) {
      console.error('[CalendlyAuthorize] Missing credentials')
      return NextResponse.json(
        { error: 'Calendly credentials not configured' },
        { status: 500 },
      )
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')

    // Build authorization URL
    // Note: Calendly OAuth does NOT support custom scopes
    // It uses a default scope that grants access to all API endpoints
    // permitted by the user's subscription and role
    // See: https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-oauth-scopes
    const authUrl = new URL(`${CALENDLY_OAUTH_BASE[env]}/oauth/authorize`)
    authUrl.searchParams.append('client_id', creds.clientId)
    authUrl.searchParams.append('redirect_uri', creds.redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    // Do NOT include scope parameter - Calendly uses default scope only
    authUrl.searchParams.append('state', state)
    
    console.log('[CalendlyAuthorize] OAuth URL:', authUrl.toString())

    console.log('[CalendlyAuthorize] Redirecting to Calendly OAuth')

    // Redirect to Calendly
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('[CalendlyAuthorize] FAILED:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authorization failed'
    return NextResponse.json({ error: errorMessage }, { status: 401 })
  }
}

