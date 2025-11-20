'use server'

import { adminDb } from '@/lib/firebase-admin'
import type { ServiceArea, FormType } from '@/lib/service-area-config'
import { buildMediationReferralMondayItem, buildRestorativeProgramMondayItem } from '@/lib/monday/mappers'
import { createMondayItem, updateMondayItem } from '@/lib/monday/items'
import { buildMondayItemUrl } from '@/lib/monday/config'
import { updateMondaySyncFields } from '@/lib/monday/linking'
import { mediationFormSchema } from '@/Forms/schema/request-mediation-self-referral-form'
import { restorativeProgramReferralFormSchema } from '@/Forms/schema/restorative-program-referral-form'
import { hydrateFormDataFromFirestore } from '@/lib/inquiries/form-data'

const SUPPORTED_FORM_TYPES: FormType[] = [
  'mediation-self-referral',
  'restorative-program-referral',
]

interface RetryParams {
  inquiryId: string
  serviceArea: ServiceArea
}

export async function retryMondaySyncAction({
  inquiryId,
  serviceArea,
}: RetryParams): Promise<{ success: boolean; error?: string }> {
  const docRef = adminDb
    .collection('serviceAreas')
    .doc(serviceArea)
    .collection('inquiries')
    .doc(inquiryId)
  const snapshot = await docRef.get()

  if (!snapshot.exists) {
    return { success: false, error: 'Inquiry not found' }
  }

  const data = snapshot.data()
  const formType = data?.formType as FormType | undefined

  if (!formType || !SUPPORTED_FORM_TYPES.includes(formType)) {
    return { success: false, error: 'Form type is not supported for Monday sync' }
  }

  const hydratedFormData = hydrateFormDataFromFirestore(
    (data?.formData ?? {}) as Record<string, unknown>,
  )

  // Extract inquiry metadata
  const metadata = {
    submittedAt: data?.submittedAt,
    reviewed: data?.reviewed,
    reviewedAt: data?.reviewedAt,
    submittedBy: data?.submittedBy,
    submissionType: data?.submissionType,
  }

  let mondayInput

  try {
    if (formType === 'mediation-self-referral') {
      const parsed = mediationFormSchema.parse(hydratedFormData)
      mondayInput = await buildMediationReferralMondayItem(parsed, metadata)
    } else {
      const parsed = restorativeProgramReferralFormSchema.parse(hydratedFormData)
      mondayInput = await buildRestorativeProgramMondayItem(parsed, metadata)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid form data'
    return { success: false, error: message }
  }

  await updateMondaySyncFields(serviceArea, inquiryId, {
    mondaySyncStatus: 'pending',
    mondaySyncError: null,
  })

  try {
    const existingItemId = data?.mondayItemId as string | undefined
    if (existingItemId) {
      await updateMondayItem({
        boardId: mondayInput.boardId,
        itemId: existingItemId,
        columnValues: mondayInput.columnValues,
      })
      await updateMondaySyncFields(serviceArea, inquiryId, {
        mondayItemId: existingItemId,
        mondayItemUrl: data?.mondayItemUrl ?? buildMondayItemUrl(existingItemId),
        mondaySyncStatus: 'success',
        mondaySyncError: null,
      })
      return { success: true }
    }

    const { itemId } = await createMondayItem(mondayInput)
    await updateMondaySyncFields(serviceArea, inquiryId, {
      mondayItemId: itemId,
      mondayItemUrl: buildMondayItemUrl(itemId),
      mondaySyncStatus: 'success',
      mondaySyncError: null,
    })
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sync with Monday'
    await updateMondaySyncFields(serviceArea, inquiryId, {
      mondaySyncStatus: 'failed',
      mondaySyncError: message,
    })
    return { success: false, error: message }
  }
}


