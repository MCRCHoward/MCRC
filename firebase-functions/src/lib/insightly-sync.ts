import { FieldValue } from 'firebase-admin/firestore'
import { createInsightlyLead } from './insightly/client'
import { buildInsightlyLeadUrl } from './insightly/config'
import {
  buildRestorativeReferralLeadPayload,
  buildSelfReferralLeadPayload,
  validateLeadPayload,
} from './insightly/mappers'
import { hydrateFormDataFromFirestore } from './inquiries/form-data'

type InquiryDocData = Record<string, unknown> & {
  formType?: string
  formData?: Record<string, unknown>
}

export async function runInsightlySyncForInquiry(params: {
  db: FirebaseFirestore.Firestore
  inquiryId: string
  serviceArea: string
  data: FirebaseFirestore.DocumentData
}): Promise<void> {
  const { db, inquiryId, serviceArea } = params
  const data = params.data as InquiryDocData

  const formType = data.formType
  const docRef = db.doc(`serviceAreas/${serviceArea}/inquiries/${inquiryId}`)

  // Mark pending up-front so CMS can show progress.
  await docRef.set(
    {
      insightlySyncStatus: 'pending',
      insightlyLastSyncError: null,
      insightlyLastSyncedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  try {
    const hydrated = hydrateFormDataFromFirestore((data.formData ?? {}) as Record<string, unknown>)

    let payload
    if (formType === 'mediation-self-referral') {
      payload = buildSelfReferralLeadPayload(hydrated as unknown as Parameters<
        typeof buildSelfReferralLeadPayload
      >[0])
    } else if (formType === 'restorative-program-referral') {
      payload = buildRestorativeReferralLeadPayload(hydrated as unknown as Parameters<
        typeof buildRestorativeReferralLeadPayload
      >[0])
    } else {
      // Unsupported; leave pending state as-is? Prefer to mark failed with message.
      throw new Error(`[Insightly] Unsupported formType: ${String(formType)}`)
    }

    validateLeadPayload(payload)
    const lead = await createInsightlyLead(payload)

    await docRef.set(
      {
        insightlyLeadId: lead.LEAD_ID,
        insightlyLeadUrl: buildInsightlyLeadUrl(lead.LEAD_ID) ?? null,
        insightlySyncStatus: 'success',
        insightlyLastSyncError: null,
        insightlyLastSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    console.log('[functions][insightly] Sync succeeded', {
      inquiryId,
      serviceArea,
      leadId: lead.LEAD_ID,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await docRef.set(
      {
        insightlySyncStatus: 'failed',
        insightlyLastSyncError: message,
        insightlyLastSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    console.error('[functions][insightly] Sync failed', { inquiryId, serviceArea, error: message })
  }
}

