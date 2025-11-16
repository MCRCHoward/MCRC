import { NextRequest, NextResponse } from 'next/server'
import { getInquiryById } from '@/lib/actions/inquiry-actions'
import { getServiceAreaFromFormType, isValidServiceArea } from '@/lib/service-area-config'
import { getCalendlySettings } from '@/lib/actions/calendly-settings-actions'
import { getEventTypeForForm } from '@/lib/calendly-config'
import { createSchedulingLink } from '@/lib/calendly-service'
import type { FormType } from '@/lib/service-area-config'
import type { CalendlySchedulingParams } from '@/types/calendly'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/forms/[formType]/schedule
 *
 * Generates a Calendly scheduling link for a form submission
 * Accepts submission ID and returns scheduling URL with pre-filled data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formType: string }> },
) {
  try {
    const { formType } = await params
    const body = await request.json()
    const { inquiryId } = body

    if (!inquiryId) {
      return NextResponse.json({ error: 'inquiryId is required' }, { status: 400 })
    }

    // Validate form type
    if (!['mediation-self-referral', 'restorative-program-referral', 'group-facilitation-inquiry', 'community-education-training-request'].includes(formType)) {
      return NextResponse.json({ error: 'Invalid form type' }, { status: 400 })
    }

    const validFormType = formType as FormType
    const serviceArea = getServiceAreaFromFormType(validFormType)

    if (!isValidServiceArea(serviceArea)) {
      return NextResponse.json({ error: 'Invalid service area' }, { status: 400 })
    }

    // Get inquiry data
    const inquiry = await getInquiryById(serviceArea, inquiryId)
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Get Calendly settings and event type mapping
    const settings = await getCalendlySettings()
    if (!settings?.connected) {
      return NextResponse.json({ error: 'Calendly not connected' }, { status: 503 })
    }

    const eventTypeUri = getEventTypeForForm(validFormType, settings.eventTypeMappings)
    if (!eventTypeUri) {
      return NextResponse.json(
        { error: 'Event type not configured for this form' },
        { status: 400 },
      )
    }

    // Extract form data for pre-filling
    const formData = inquiry.formData || {}
    const email = (formData.email as string) || (formData.participantEmail as string) || ''
    
    // Extract name fields safely
    const participantName = typeof formData.participantName === 'string' ? formData.participantName : ''
    const nameParts = participantName ? participantName.split(' ') : []
    const firstName = (formData.firstName as string) || (nameParts[0] || '')
    const lastName = (formData.lastName as string) || (nameParts.slice(1).join(' ') || '')
    const name = participantName || (formData.firstName as string) || `${firstName} ${lastName}`.trim() || 'Guest'
    const phone = (formData.phone as string) || (formData.participantPhone as string) || ''

    // Build scheduling parameters
    const schedulingParams: CalendlySchedulingParams = {
      eventTypeUri,
      inviteeEmail: email,
      inviteeName: name,
      inviteeFirstName: firstName || undefined,
      inviteeLastName: lastName || undefined,
      inviteePhoneNumber: phone || undefined,
      tracking: {
        salesforce_uuid: inquiryId, // Use inquiry ID for webhook correlation
        utm_source: 'mcrchoward',
        utm_medium: 'form',
        utm_campaign: validFormType,
      },
    }

    // Generate scheduling link
    const schedulingLink = await createSchedulingLink(schedulingParams)
    if (!schedulingLink) {
      return NextResponse.json(
        { error: 'Failed to generate scheduling link' },
        { status: 500 },
      )
    }

    console.log(`[ScheduleAPI] Generated scheduling link for inquiry ${inquiryId}`)

    return NextResponse.json(schedulingLink)
  } catch (error) {
    console.error('[ScheduleAPI] FAILED:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate scheduling link'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

