'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import type { ServiceArea } from '@/lib/service-area-config'
import type { InsightlySyncFields } from './types'

export async function updateInsightlySyncFields(
  serviceArea: ServiceArea,
  inquiryId: string,
  fields: Partial<InsightlySyncFields>,
) {
  const docPath = `serviceAreas/${serviceArea}/inquiries/${inquiryId}`
  await adminDb.doc(docPath).set(
    {
      ...fields,
      insightlyLastSyncedAt: fields.insightlyLastSyncedAt ?? FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}


