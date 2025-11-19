'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, requireRole } from '@/lib/custom-auth'
import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'
import type { ServiceArea } from '@/lib/service-area-config'
import { SERVICE_AREA_METADATA } from '@/lib/service-area-config'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'

/**
 * Recursively serializes an object, converting any Firestore Timestamps to ISO strings.
 * This is necessary for passing data from Server Components to Client Components.
 * Uses toISOString helper to detect and convert all Timestamp formats reliably.
 */
function serializeFormData(data: unknown): unknown {
  if (!data) return data

  // First, attempt to convert using toISOString helper
  // This will catch all Timestamp formats (Admin SDK, raw Firestore, Date objects, ISO strings)
  const isoString = toISOString(data)
  if (isoString !== undefined) {
    // toISOString returned a string, meaning it was a Timestamp or Date
    return isoString
  }

  // Not a Timestamp - continue with recursive processing
  if (typeof data === 'object' && data !== null) {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(serializeFormData)
    }

    // Handle plain objects - recursively serialize all properties
    const obj = data as Record<string, unknown>
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFormData(value)
    }
    return serialized
  }

  // Primitive value (string, number, boolean, etc.) - return as-is
  return data
}

/**
 * Fetches inquiries for a specific service area
 */
export async function fetchInquiries(
  serviceArea: ServiceArea,
  options?: { limit?: number; reviewed?: boolean },
): Promise<Inquiry[]> {
  await requireAuth()

  const collectionPath = `serviceAreas/${serviceArea}/inquiries`
  let query = adminDb.collection(collectionPath).orderBy('submittedAt', 'desc')

  if (options?.reviewed !== undefined) {
    query = query.where('reviewed', '==', options.reviewed)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    // Recursively serialize formData to convert any Timestamp objects to ISO strings
    const serializedFormData = serializeFormData(data.formData ?? {}) as Record<string, unknown>
    
    // Convert submittedAt - handle various timestamp formats
    // DEBUG: Log raw submittedAt value to help diagnose date issues
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] Raw submittedAt for inquiry:', doc.id, {
        submittedAt: data.submittedAt,
        submittedAtType: typeof data.submittedAt,
        hasToDate: data.submittedAt && typeof data.submittedAt === 'object' && 'toDate' in data.submittedAt,
        submittedAtKeys: data.submittedAt && typeof data.submittedAt === 'object' ? Object.keys(data.submittedAt) : null,
      })
    }
    
    // Only use current date fallback if submittedAt is truly missing (null/undefined)
    // If submittedAt exists but conversion fails, log warning
    const submittedAtISO = data.submittedAt 
      ? toISOString(data.submittedAt) ?? (() => {
          console.warn('[fetchInquiries] Failed to convert submittedAt for inquiry:', doc.id, {
            submittedAt: data.submittedAt,
            submittedAtType: typeof data.submittedAt,
            submittedAtValue: JSON.stringify(data.submittedAt),
            hasToDate: data.submittedAt && typeof data.submittedAt === 'object' && 'toDate' in data.submittedAt,
          })
          return undefined // Return undefined so we can detect conversion failures
        })()
      : undefined
    
    return {
      id: doc.id,
      formType: data.formType ?? '',
      serviceArea: data.serviceArea ?? serviceArea,
      formData: serializedFormData,
      // Only use current date fallback if submittedAt is truly missing
      // If conversion failed, we'll still use current date but log a warning
      submittedAt: submittedAtISO ?? new Date().toISOString(),
      submittedBy: data.submittedBy ?? '',
      submissionType: data.submissionType ?? 'anonymous',
      reviewed: data.reviewed ?? false,
      reviewedAt: toISOString(data.reviewedAt),
      reviewedBy: data.reviewedBy,
      status: (data.status as InquiryStatus) ?? 'submitted',
      calendlyScheduling: serializeFormData(data.calendlyScheduling) as Inquiry['calendlyScheduling'],
      insightlyLeadId: data.insightlyLeadId,
      insightlyLeadUrl: data.insightlyLeadUrl,
      insightlySyncStatus: data.insightlySyncStatus,
      insightlyLastSyncError: data.insightlyLastSyncError ?? null,
      insightlyLastSyncedAt: toISOString(data.insightlyLastSyncedAt),
    } as Inquiry
  })
}

/**
 * Gets a single inquiry by ID
 */
export async function getInquiryById(
  serviceArea: ServiceArea,
  id: string,
): Promise<Inquiry | null> {
  await requireAuth()

  const docPath = `serviceAreas/${serviceArea}/inquiries/${id}`
  const doc = await adminDb.doc(docPath).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()
  // Recursively serialize formData to convert any Timestamp objects to ISO strings
  const serializedFormData = serializeFormData(data?.formData ?? {}) as Record<string, unknown>
  
  // Convert submittedAt - handle various timestamp formats
  // Only use current date fallback if submittedAt is truly missing (null/undefined)
  // If submittedAt exists but conversion fails, log warning
  const submittedAtISO = data?.submittedAt 
    ? toISOString(data.submittedAt) ?? (() => {
        console.warn('[getInquiryById] Failed to convert submittedAt for inquiry:', doc.id, {
          submittedAt: data.submittedAt,
          submittedAtType: typeof data.submittedAt,
          submittedAtValue: JSON.stringify(data.submittedAt),
        })
        return undefined // Return undefined so we can detect conversion failures
      })()
    : undefined
  
  return {
    id: doc.id,
    formType: data?.formType ?? '',
    serviceArea: data?.serviceArea ?? serviceArea,
    formData: serializedFormData,
    // Only use current date fallback if submittedAt is truly missing
    // If conversion failed, we'll still use current date but log a warning
    submittedAt: submittedAtISO ?? new Date().toISOString(),
    submittedBy: data?.submittedBy ?? '',
    submissionType: data?.submissionType ?? 'anonymous',
    reviewed: data?.reviewed ?? false,
    reviewedAt: toISOString(data?.reviewedAt),
    reviewedBy: data?.reviewedBy,
    status: (data?.status as InquiryStatus) ?? 'submitted',
    calendlyScheduling: serializeFormData(data?.calendlyScheduling) as Inquiry['calendlyScheduling'],
    insightlyLeadId: data?.insightlyLeadId,
    insightlyLeadUrl: data?.insightlyLeadUrl,
    insightlySyncStatus: data?.insightlySyncStatus,
    insightlyLastSyncError: data?.insightlyLastSyncError ?? null,
    insightlyLastSyncedAt: toISOString(data?.insightlyLastSyncedAt),
  } as Inquiry
}

/**
 * Marks an inquiry as reviewed
 */
export async function markAsReviewed(serviceArea: ServiceArea, id: string) {
  const user = await requireRole('admin')

  const docPath = `serviceAreas/${serviceArea}/inquiries/${id}`
  await adminDb.doc(docPath).update({
    reviewed: true,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: user.id,
  })

  const metadata = SERVICE_AREA_METADATA[serviceArea]
  revalidatePath(`/dashboard/${metadata.slug}/inquiries`)
  revalidatePath(`/dashboard/${metadata.slug}/inquiries/${id}`)
}

/**
 * Updates the status of an inquiry
 */
export async function updateInquiryStatus(
  serviceArea: ServiceArea,
  id: string,
  status: InquiryStatus,
) {
  await requireRole('admin')

  const docPath = `serviceAreas/${serviceArea}/inquiries/${id}`
  await adminDb.doc(docPath).update({ status })

  const metadata = SERVICE_AREA_METADATA[serviceArea]
  revalidatePath(`/dashboard/${metadata.slug}/inquiries`)
  revalidatePath(`/dashboard/${metadata.slug}/inquiries/${id}`)
}

