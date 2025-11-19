'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import type { FormType, ServiceArea } from '@/lib/service-area-config'
import { getServiceAreaFromFormType } from '@/lib/service-area-config'
import {
  mediationFormSchema,
  type MediationFormValues,
} from '@/Forms/schema/request-mediation-self-referral-form'
import {
  restorativeProgramReferralFormSchema,
  type RestorativeProgramReferralFormValues,
} from '@/Forms/schema/restorative-program-referral-form'
import { prepareFormDataForFirestore } from '@/lib/inquiries/form-data'
import { syncInquiryWithInsightlyAction } from '@/lib/actions/insightly-actions'

interface SubmissionResult {
  success: boolean
  inquiryId?: string
  error?: string
  insightly?: {
    success: boolean
    leadId?: number
    error?: string
  }
}

const SELF_REFERRAL_FORM_TYPE: FormType = 'mediation-self-referral'
const RESTORATIVE_FORM_TYPE: FormType = 'restorative-program-referral'

async function createInquiryDocument(
  serviceArea: ServiceArea,
  formType: FormType,
  formData: Record<string, unknown>,
) {
  const collectionRef = adminDb
    .collection('serviceAreas')
    .doc(serviceArea)
    .collection('inquiries')

  const docRef = await collectionRef.add({
    formType,
    serviceArea,
    formData,
    status: 'submitted',
    submittedAt: FieldValue.serverTimestamp(),
    submittedBy: 'anonymous-public',
    submissionType: 'anonymous',
    reviewed: false,
    calendlyScheduling: null,
  })

  return docRef.id
}

async function submitPublicForm({
  formType,
  parsedData,
}: {
  formType: FormType
  parsedData: Record<string, unknown>
}): Promise<SubmissionResult> {
  try {
    const serviceArea = getServiceAreaFromFormType(formType)
    const serializedFormData = prepareFormDataForFirestore(parsedData)
    const inquiryId = await createInquiryDocument(serviceArea, formType, serializedFormData)

    let insightly
    try {
      insightly = await syncInquiryWithInsightlyAction({
        inquiryId,
        serviceArea,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Insightly error'
      insightly = { success: false, error: message }
    }

    if (!insightly) {
      insightly = { success: false, error: 'Unknown Insightly response' }
    }

    return {
      success: true,
      inquiryId,
      insightly,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit form right now.'
    console.error('[PublicFormSubmission] Failed to submit form', {
      formType,
      error: message,
    })
    return {
      success: false,
      error: message,
    }
  }
}

export async function submitSelfReferralFormAction(
  values: MediationFormValues,
): Promise<SubmissionResult> {
  try {
    const parsed = mediationFormSchema.parse(values)
    return await submitPublicForm({
      formType: SELF_REFERRAL_FORM_TYPE,
      parsedData: parsed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid form submission'
    return { success: false, error: message }
  }
}

export async function submitRestorativeReferralFormAction(
  values: RestorativeProgramReferralFormValues,
): Promise<SubmissionResult> {
  try {
    const parsed = restorativeProgramReferralFormSchema.parse(values)
    return await submitPublicForm({
      formType: RESTORATIVE_FORM_TYPE,
      parsedData: parsed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid form submission'
    return { success: false, error: message }
  }
}


