'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import type { ServiceArea } from '@/lib/service-area-config'
import type { InsightlySyncFields } from './types'

/**
 * Filters out undefined values from an object.
 * Firestore does not accept undefined as a value - use null instead or omit the field.
 */
function filterUndefinedValues<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as {
    [K in keyof T]: Exclude<T[K], undefined>
  }
}

export async function updateInsightlySyncFields(
  serviceArea: ServiceArea,
  inquiryId: string,
  fields: Partial<InsightlySyncFields>,
) {
  const docPath = `serviceAreas/${serviceArea}/inquiries/${inquiryId}`

  // Filter out undefined values - Firestore doesn't accept undefined
  // This is a defensive measure; callers should use null instead of undefined
  const filteredFields = filterUndefinedValues(fields)

  await adminDb.doc(docPath).set(
    {
      ...filteredFields,
      insightlyLastSyncedAt: fields.insightlyLastSyncedAt ?? FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}
