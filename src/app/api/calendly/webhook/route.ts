import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { FieldPath } from 'firebase-admin/firestore'

import { getCalendlyCredentials } from '@/lib/calendly-config'
import type { CalendlyWebhookPayload } from '@/types/calendly'
import { adminDb } from '@/lib/firebase-admin'

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

async function findInquiryDocument(inquiryId: string) {
  const snapshot = await adminDb
    .collectionGroup('inquiries')
    .where(FieldPath.documentId(), '==', inquiryId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  return snapshot.docs[0]
}

function extractScheduledTime(payload: CalendlyWebhookPayload): string | undefined {
  const scheduledEvent = (payload.payload as { scheduled_event?: { start_time?: string } })
    .scheduled_event
  return scheduledEvent?.start_time ?? payload.created_at
}

async function handleInviteeCreated(payload: CalendlyWebhookPayload) {
  const inquiryId = payload.payload.tracking?.salesforce_uuid
  if (!inquiryId) {
    console.warn('[CalendlyWebhook] invitee.created missing salesforce_uuid')
    return
  }

  const inquiryDoc = await findInquiryDocument(inquiryId)
  if (!inquiryDoc) {
    console.warn('[CalendlyWebhook] Inquiry not found for invitee.created', { inquiryId })
    return
  }

  const scheduledTime = extractScheduledTime(payload)
  await inquiryDoc.ref.update({
    status: 'intake-scheduled',
    calendlyScheduling: {
      eventUri: payload.payload.event,
      inviteeUri: payload.payload.invitee,
      scheduledTime,
    },
  })

  console.log('[CalendlyWebhook] Updated inquiry with scheduling info', {
    inquiryId,
    serviceArea: inquiryDoc.get('serviceArea'),
    scheduledTime,
  })
}

/**
 * GET /api/calendly/webhook
 *
 * Webhook endpoint verification
 * Calendly sends a GET request to verify the endpoint is accessible
 */
export async function GET(_request: NextRequest) {
  // Return 200 OK to confirm endpoint is accessible
  // Calendly uses this to verify the webhook URL before sending events
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is active' }, { status: 200 })
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
        await handleInviteeCreated(payload)
        break
      }

      case 'invitee.canceled': {
        // TODO: Implement invitee.canceled handling
        // Update inquiry status or add cancellation info
        console.log('[CalendlyWebhook] invitee.canceled - TODO: Handle cancellation')
        break
      }

      case 'invitee_no_show.created':
      case 'invitee_no_show.deleted':
      case 'routing_form_submission.created':
        // TODO: Implement handling for these event types if needed
        console.log('[CalendlyWebhook] Unhandled event type:', payload.event)
        break

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

