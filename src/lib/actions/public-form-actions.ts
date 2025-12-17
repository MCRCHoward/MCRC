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
import { buildMediationReferralMondayItem, buildRestorativeProgramMondayItem } from '@/lib/monday/mappers'
import { createMondayItem } from '@/lib/monday/items'
import type { CreateMondayItemInput } from '@/lib/monday/items'
import { buildMondayItemUrl } from '@/lib/monday/config'
import { updateMondaySyncFields } from '@/lib/monday/linking'

interface SubmissionResult {
  success: boolean
  inquiryId?: string
  error?: string
  insightly?: {
    success: boolean
    leadId?: number
    error?: string
  }
  monday?: {
    success: boolean
    itemId?: string
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
    mondaySyncStatus: 'pending',
    mondaySyncError: null,
  })

  return docRef.id
}

interface SubmitPublicFormParams<T extends Record<string, unknown>> {
  formType: FormType
  parsedData: T
  mondayBuilder: (
    values: T,
    metadata?: { submittedAt: Date; submittedBy?: string; submissionType?: string },
  ) => Promise<CreateMondayItemInput>
}

async function submitPublicForm<T extends Record<string, unknown>>({
  formType,
  parsedData,
  mondayBuilder,
}: SubmitPublicFormParams<T>): Promise<SubmissionResult> {
  try {
    console.log('[PublicFormSubmission] Starting form submission', { formType })
    
    const serviceArea = getServiceAreaFromFormType(formType)
    const serializedFormData = prepareFormDataForFirestore(parsedData)
    
    console.log('[PublicFormSubmission] Creating inquiry document...', { serviceArea, formType })
    const inquiryId = await createInquiryDocument(serviceArea, formType, serializedFormData)
    console.log('[PublicFormSubmission] Inquiry created successfully', { inquiryId })

    // Insightly Sync
    console.log('[PublicFormSubmission] Starting Insightly sync...', { inquiryId, serviceArea })
    let insightly
    try {
      insightly = await syncInquiryWithInsightlyAction({
        inquiryId,
        serviceArea,
      })
      console.log('[PublicFormSubmission] Insightly sync completed', {
        success: insightly.success,
        leadId: insightly.leadId,
        error: insightly.error,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Insightly error'
      console.error('[PublicFormSubmission] Insightly sync threw exception', { error: message })
      insightly = { success: false, error: message }
    }

    if (!insightly) {
      console.error('[PublicFormSubmission] Insightly sync returned null/undefined')
      insightly = { success: false, error: 'Unknown Insightly response' }
    }

    // Monday Sync
    console.log('[PublicFormSubmission] Marking Monday sync as pending...', { inquiryId })
    await updateMondaySyncFields(serviceArea, inquiryId, {
      mondaySyncStatus: 'pending',
      mondaySyncError: null,
    })

    console.log('[PublicFormSubmission] Starting Monday sync...', { inquiryId, serviceArea })
    let mondayResult
    try {
      // Pass metadata with current timestamp for new submissions
      const metadata = {
        submittedAt: new Date(),
        submittedBy: 'anonymous-public',
        submissionType: 'anonymous',
      }
      
      console.log('[PublicFormSubmission] Building Monday item payload...')
      const mondayInput = await mondayBuilder(parsedData, metadata)
      console.log('[PublicFormSubmission] Monday payload built', {
        boardId: mondayInput.boardId,
        groupId: mondayInput.groupId,
        itemName: mondayInput.itemName,
        columnValuesLength: mondayInput.columnValues.length,
      })
      
      console.log('[PublicFormSubmission] Creating Monday item...')
      const { itemId } = await createMondayItem(mondayInput)
      console.log('[PublicFormSubmission] Monday item created successfully', { itemId })
      
      await updateMondaySyncFields(serviceArea, inquiryId, {
        mondayItemId: itemId,
        mondayItemUrl: buildMondayItemUrl(itemId),
        mondaySyncStatus: 'success',
        mondaySyncError: null,
      })
      mondayResult = { success: true, itemId }
      console.log('[PublicFormSubmission] Monday sync completed successfully', { itemId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Monday error'
      console.error('[PublicFormSubmission] Monday sync failed', {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      })
      await updateMondaySyncFields(serviceArea, inquiryId, {
        mondaySyncStatus: 'failed',
        mondaySyncError: message,
      })
      mondayResult = { success: false, error: message }
    }

    console.log('[PublicFormSubmission] Form submission complete', {
      inquiryId,
      insightlySuccess: insightly.success,
      mondaySuccess: mondayResult.success,
    })

    return {
      success: true,
      inquiryId,
      insightly,
      monday: mondayResult,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit form right now.'
    console.error('[PublicFormSubmission] Failed to submit form', {
      formType,
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
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
      mondayBuilder: buildMediationReferralMondayItem,
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
      mondayBuilder: buildRestorativeProgramMondayItem,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid form submission'
    return { success: false, error: message }
  }
}


