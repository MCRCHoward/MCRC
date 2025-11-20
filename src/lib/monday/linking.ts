'use server'

import { FieldValue } from 'firebase-admin/firestore'
import type { ServiceArea } from '@/lib/service-area-config'
import { adminDb } from '@/lib/firebase-admin'
import type { InquiryMondayFields } from '@/types/inquiry'

export async function updateMondaySyncFields(
  serviceArea: ServiceArea,
  inquiryId: string,
  fields: Partial<InquiryMondayFields>,
) {
  const docPath = `serviceAreas/${serviceArea}/inquiries/${inquiryId}`
  await adminDb.doc(docPath).set(
    {
      ...fields,
      mondayLastSyncedAt:
        fields.mondayLastSyncedAt ??
        (fields.mondaySyncStatus === 'success' ? FieldValue.serverTimestamp() : undefined),
    },
    { merge: true },
  )
}


