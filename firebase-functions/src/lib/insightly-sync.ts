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

function syncLog(
  level: 'info' | 'warn' | 'error',
  stage: string,
  ctx: { inquiryId: string; serviceArea: string; formType?: string },
  extra?: Record<string, unknown>,
): void {
  const payload = { ...ctx, stage, ...extra }
  if (level === 'error') {
    console.error(`[functions][insightly] ${stage}`, payload)
  } else if (level === 'warn') {
    console.warn(`[functions][insightly] ${stage}`, payload)
  } else {
    console.log(`[functions][insightly] ${stage}`, payload)
  }
}

export async function runInsightlySyncForInquiry(params: {
  db: FirebaseFirestore.Firestore
  inquiryId: string
  serviceArea: string
  data: FirebaseFirestore.DocumentData
}): Promise<void> {
  const { db, inquiryId, serviceArea } = params
  const data = params.data as InquiryDocData

  const formType = data.formType ?? 'unknown'
  const logCtx = { inquiryId, serviceArea, formType }
  const docRef = db.doc(`serviceAreas/${serviceArea}/inquiries/${inquiryId}`)

  syncLog('info', 'pending-set', logCtx)
  await docRef.set(
    {
      insightlySyncStatus: 'pending',
      insightlyLastSyncError: null,
      insightlyLastSyncedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  try {
    syncLog('info', 'payload-build-start', logCtx)
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
      throw new Error(`Unsupported formType: ${formType}`)
    }

    validateLeadPayload(payload)
    syncLog('info', 'api-call-start', logCtx)
    const lead = await createInsightlyLead(payload)

    syncLog('info', 'success-write', logCtx, { leadId: lead.LEAD_ID })
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

    syncLog('info', 'sync-complete', logCtx, { leadId: lead.LEAD_ID })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    syncLog('error', 'failure-write', logCtx, {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    })
    await docRef.set(
      {
        insightlySyncStatus: 'failed',
        insightlyLastSyncError: message,
        insightlyLastSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }
}

