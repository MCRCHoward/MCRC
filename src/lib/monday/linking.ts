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
  
  // Build update object, only including mondayLastSyncedAt if it should be set
  const updateData: Record<string, unknown> = { ...fields }
  
  // Only set mondayLastSyncedAt if explicitly provided or if sync was successful
  if (fields.mondayLastSyncedAt !== undefined) {
    updateData.mondayLastSyncedAt = fields.mondayLastSyncedAt
  } else if (fields.mondaySyncStatus === 'success') {
    updateData.mondayLastSyncedAt = FieldValue.serverTimestamp()
  }
  // If neither condition is met, omit the field entirely (don't set to undefined)
  
  await adminDb.doc(docPath).set(updateData, { merge: true })
}


