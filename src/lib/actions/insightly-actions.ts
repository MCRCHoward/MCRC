'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import type { ServiceArea, FormType } from '@/lib/service-area-config'
import { SERVICE_AREA_METADATA } from '@/lib/service-area-config'
import { createInsightlyLead } from '@/lib/insightly/client'
import {
  buildRestorativeReferralLeadPayload,
  buildSelfReferralLeadPayload,
  validateLeadPayload,
} from '@/lib/insightly/mappers'
import { updateInsightlySyncFields } from '@/lib/insightly/linking'
import { buildInsightlyLeadUrl } from '@/lib/insightly/config'
import { mediationFormSchema } from '@/Forms/schema/request-mediation-self-referral-form'
import { restorativeProgramReferralFormSchema } from '@/Forms/schema/restorative-program-referral-form'
import { hydrateFormDataFromFirestore } from '@/lib/inquiries/form-data'

const SUPPORTED_FORM_TYPES: FormType[] = ['mediation-self-referral', 'restorative-program-referral']

function revalidateInquiry(serviceArea: ServiceArea, inquiryId: string) {
  const metadata = SERVICE_AREA_METADATA[serviceArea]
  const slug = metadata?.slug ?? serviceArea
  revalidatePath(`/dashboard/${slug}/inquiries`)
  revalidatePath(`/dashboard/${slug}/inquiries/${inquiryId}`)
}

interface SyncParams {
  inquiryId: string
  serviceArea: ServiceArea
}

export async function syncInquiryWithInsightlyAction({
  inquiryId,
  serviceArea,
}: SyncParams): Promise<{ success: boolean; leadId?: number; error?: string }> {
  console.log('[Insightly] Starting sync', { inquiryId, serviceArea })

  const docPath = `serviceAreas/${serviceArea}/inquiries/${inquiryId}`
  console.log('[Insightly] Retrieving inquiry document', { docPath })
  const docSnapshot = await adminDb.doc(docPath).get()

  if (!docSnapshot.exists) {
    console.error('[Insightly] Inquiry not found', { docPath })
    return { success: false, error: 'Inquiry not found' }
  }

  const data = docSnapshot.data()
  const formType = data?.formType as FormType | undefined
  console.log('[Insightly] Inquiry data retrieved', { formType, hasFormData: !!data?.formData })

  if (!formType || !SUPPORTED_FORM_TYPES.includes(formType)) {
    console.error('[Insightly] Form type not supported', {
      formType,
      supported: SUPPORTED_FORM_TYPES,
    })
    return { success: false, error: 'Form type is not configured for Insightly sync' }
  }

  if (!data?.formData) {
    console.error('[Insightly] Inquiry missing form data', { inquiryId })
    return { success: false, error: 'Inquiry is missing form data' }
  }

  console.log('[Insightly] Hydrating form data from Firestore...')
  const hydratedFormData = hydrateFormDataFromFirestore(
    (data.formData ?? {}) as Record<string, unknown>,
  )

  let payload

  console.log('[Insightly] Building payload for form type:', formType)
  try {
    if (formType === 'mediation-self-referral') {
      const parsed = mediationFormSchema.parse(hydratedFormData)
      payload = buildSelfReferralLeadPayload(parsed)
      console.log('[Insightly] Self-referral payload built', {
        hasLastName: !!payload.LAST_NAME,
        hasFirstName: !!payload.FIRST_NAME,
        hasEmail: !!payload.EMAIL_ADDRESS,
        hasPhone: !!payload.PHONE_NUMBER,
        tagsCount: payload.TAGS?.length || 0,
      })
    } else {
      const parsed = restorativeProgramReferralFormSchema.parse(hydratedFormData)
      payload = buildRestorativeReferralLeadPayload(parsed)
      console.log('[Insightly] Restorative referral payload built', {
        hasLastName: !!payload.LAST_NAME,
        hasFirstName: !!payload.FIRST_NAME,
        hasEmail: !!payload.EMAIL_ADDRESS,
        hasPhone: !!payload.PHONE_NUMBER,
        tagsCount: payload.TAGS?.length || 0,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Insightly] Failed to build payload', { error: message, formType })
    return { success: false, error: `Invalid form data: ${message}` }
  }

  console.log('[Insightly] Validating payload before API call...')
  try {
    validateLeadPayload(payload)
    console.log('[Insightly] Payload validation passed')
  } catch (validationError) {
    const message =
      validationError instanceof Error ? validationError.message : String(validationError)
    console.error('[Insightly] Payload validation failed', { error: message })
    return { success: false, error: `Payload validation failed: ${message}` }
  }

  console.log('[Insightly] Updating sync status to pending...')
  await updateInsightlySyncFields(serviceArea, inquiryId, {
    insightlySyncStatus: 'pending',
    insightlyLastSyncError: null,
  })

  console.log('[Insightly] Calling API to create lead...')
  try {
    const lead = await createInsightlyLead(payload)
    console.log('[Insightly] Lead created successfully', { leadId: lead.LEAD_ID })

    await updateInsightlySyncFields(serviceArea, inquiryId, {
      insightlyLeadId: lead.LEAD_ID,
      insightlyLeadUrl: buildInsightlyLeadUrl(lead.LEAD_ID),
      insightlySyncStatus: 'success',
      insightlyLastSyncError: null,
    })
    console.log('[Insightly] Sync fields updated in Firestore')

    revalidateInquiry(serviceArea, inquiryId)
    console.log('[Insightly] Sync completed successfully', { leadId: lead.LEAD_ID })
    return { success: true, leadId: lead.LEAD_ID }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Insightly] Lead sync failed', {
      inquiryId,
      serviceArea,
      formType,
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    })
    await updateInsightlySyncFields(serviceArea, inquiryId, {
      insightlySyncStatus: 'failed',
      insightlyLastSyncError: message,
    })
    revalidateInquiry(serviceArea, inquiryId)
    return { success: false, error: message }
  }
}
