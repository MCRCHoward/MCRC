'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import type { ServiceArea, FormType } from '@/lib/service-area-config'
import { SERVICE_AREA_METADATA } from '@/lib/service-area-config'
import { createInsightlyLead } from '@/lib/insightly/client'
import {
  buildRestorativeReferralLeadPayload,
  buildSelfReferralLeadPayload,
} from '@/lib/insightly/mappers'
import { updateInsightlySyncFields } from '@/lib/insightly/linking'
import { buildInsightlyLeadUrl } from '@/lib/insightly/config'
import { mediationFormSchema } from '@/Forms/schema/request-mediation-self-referral-form'
import { restorativeProgramReferralFormSchema } from '@/Forms/schema/restorative-program-referral-form'
import { hydrateFormDataFromFirestore } from '@/lib/inquiries/form-data'

const SUPPORTED_FORM_TYPES: FormType[] = [
  'mediation-self-referral',
  'restorative-program-referral',
]

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
  const docPath = `serviceAreas/${serviceArea}/inquiries/${inquiryId}`
  const docSnapshot = await adminDb.doc(docPath).get()

  if (!docSnapshot.exists) {
    return { success: false, error: 'Inquiry not found' }
  }

  const data = docSnapshot.data()
  const formType = data?.formType as FormType | undefined

  if (!formType || !SUPPORTED_FORM_TYPES.includes(formType)) {
    return { success: false, error: 'Form type is not configured for Insightly sync' }
  }

  if (!data?.formData) {
    return { success: false, error: 'Inquiry is missing form data' }
  }

  const hydratedFormData = hydrateFormDataFromFirestore(
    (data.formData ?? {}) as Record<string, unknown>,
  )

  let payload

  try {
    if (formType === 'mediation-self-referral') {
      const parsed = mediationFormSchema.parse(hydratedFormData)
      payload = buildSelfReferralLeadPayload(parsed)
    } else {
      const parsed = restorativeProgramReferralFormSchema.parse(hydratedFormData)
      payload = buildRestorativeReferralLeadPayload(parsed)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: `Invalid form data: ${message}` }
  }

  await updateInsightlySyncFields(serviceArea, inquiryId, {
    insightlySyncStatus: 'pending',
    insightlyLastSyncError: null,
  })

  try {
    const lead = await createInsightlyLead(payload)
    await updateInsightlySyncFields(serviceArea, inquiryId, {
      insightlyLeadId: lead.LEAD_ID,
      insightlyLeadUrl: buildInsightlyLeadUrl(lead.LEAD_ID),
      insightlySyncStatus: 'success',
      insightlyLastSyncError: null,
    })
    revalidateInquiry(serviceArea, inquiryId)
    return { success: true, leadId: lead.LEAD_ID }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Insightly] Lead sync failed', {
      inquiryId,
      serviceArea,
      formType,
      error: message,
    })
    await updateInsightlySyncFields(serviceArea, inquiryId, {
      insightlySyncStatus: 'failed',
      insightlyLastSyncError: message,
    })
    revalidateInquiry(serviceArea, inquiryId)
    return { success: false, error: message }
  }
}

