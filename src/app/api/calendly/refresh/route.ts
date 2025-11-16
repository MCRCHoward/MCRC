import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/custom-auth'
import { refreshAccessToken } from '@/lib/calendly-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/calendly/refresh
 *
 * Manually refresh Calendly access token (admin only)
 * Useful for testing or manual refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('admin')

    console.log('[CalendlyRefresh] Manual token refresh requested')

    const success = await refreshAccessToken()

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, message: 'Token refreshed successfully' })
  } catch (error) {
    console.error('[CalendlyRefresh] FAILED:', error)
    const errorMessage = error instanceof Error ? error.message : 'Refresh failed'
    return NextResponse.json({ error: errorMessage }, { status: 401 })
  }
}

