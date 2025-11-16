import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getCalendlyCredentials } from '@/lib/calendly-config'
import { adminDb } from '@/lib/firebase-admin'
import type { CalendlyWebhookPayload } from '@/types/calendly'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify webhook signature from Calendly
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  signingKey: string,
): boolean {
  try {
    const hmac = createHmac('sha256', signingKey)
    hmac.update(payload)
    const expectedSignature = hmac.digest('base64')
    return signature === expectedSignature
  } catch (error) {
    console.error('[CalendlyWebhook] Signature verification error:', error)
    return false
  }
}

/**
 * POST /api/calendly/webhook
 *
 * Handles Calendly webhook events
 * Verifies signature and updates inquiry records
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = request.headers.get('calendly-webhook-signature')
    if (!signature) {
      console.error('[CalendlyWebhook] No signature provided')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Get raw body for signature verification
    const rawBody = await request.text()
    const creds = getCalendlyCredentials()

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, creds.webhookSigningKey)
    if (!isValid) {
      console.error('[CalendlyWebhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    const payload: CalendlyWebhookPayload = JSON.parse(rawBody)
    console.log('[CalendlyWebhook] Received event:', payload.event)

    // Handle different event types
    switch (payload.event) {
      case 'invitee.created': {
        // TODO: Implement invitee.created handling
        // 1. Extract inquiry ID from tracking.salesforce_uuid
        // 2. Find inquiry document in Firestore
        // 3. Update inquiry with:
        //    - calendlyScheduling.eventUri
        //    - calendlyScheduling.inviteeUri
        //    - calendlyScheduling.scheduledTime (from event)
        //    - status: 'scheduled'
        console.log('[CalendlyWebhook] invitee.created - TODO: Update inquiry record')
        console.log('[CalendlyWebhook] Payload:', JSON.stringify(payload, null, 2))
        break
      }

      case 'invitee.canceled': {
        // TODO: Implement invitee.canceled handling
        // Update inquiry status or add cancellation info
        console.log('[CalendlyWebhook] invitee.canceled - TODO: Handle cancellation')
        break
      }

      case 'invitee.rescheduled': {
        // TODO: Implement invitee.rescheduled handling
        // Update inquiry with new scheduled time
        console.log('[CalendlyWebhook] invitee.rescheduled - TODO: Handle reschedule')
        break
      }

      default:
        console.log('[CalendlyWebhook] Unhandled event type:', payload.event)
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[CalendlyWebhook] FAILED:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
  }
}

