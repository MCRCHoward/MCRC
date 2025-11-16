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
 */
function serializeFormData(data: unknown): unknown {
  if (!data) return data

  // Handle Firestore Timestamp objects
  if (typeof data === 'object' && data !== null) {
    // Check if it's a Firestore Timestamp (has _seconds and _nanoseconds)
    const obj = data as Record<string, unknown>
    if (
      typeof obj._seconds === 'number' &&
      typeof obj._nanoseconds === 'number' &&
      !('toDate' in obj) // Not an Admin SDK Timestamp
    ) {
      const isoString = toISOString(obj)
      return isoString ?? data
    }

    // Check if it's an Admin SDK Timestamp (has toDate method)
    if ('toDate' in obj && typeof (obj as { toDate?: () => Date }).toDate === 'function') {
      const isoString = toISOString(obj)
      return isoString ?? data
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(serializeFormData)
    }

    // Handle plain objects - recursively serialize all properties
    const serialized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeFormData(value)
    }
    return serialized
  }

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
    
    return {
      id: doc.id,
      formType: data.formType ?? '',
      serviceArea: data.serviceArea ?? serviceArea,
      formData: serializedFormData,
      submittedAt: toISOString(data.submittedAt) ?? new Date().toISOString(),
      submittedBy: data.submittedBy ?? '',
      submissionType: data.submissionType ?? 'anonymous',
      reviewed: data.reviewed ?? false,
      reviewedAt: toISOString(data.reviewedAt),
      reviewedBy: data.reviewedBy,
      status: (data.status as InquiryStatus) ?? 'submitted',
      calendlyScheduling: serializeFormData(data.calendlyScheduling) as Inquiry['calendlyScheduling'],
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
  
  return {
    id: doc.id,
    formType: data?.formType ?? '',
    serviceArea: data?.serviceArea ?? serviceArea,
    formData: serializedFormData,
    submittedAt: toISOString(data?.submittedAt) ?? new Date().toISOString(),
    submittedBy: data?.submittedBy ?? '',
    submissionType: data?.submissionType ?? 'anonymous',
    reviewed: data?.reviewed ?? false,
    reviewedAt: toISOString(data?.reviewedAt),
    reviewedBy: data?.reviewedBy,
    status: (data?.status as InquiryStatus) ?? 'submitted',
    calendlyScheduling: serializeFormData(data?.calendlyScheduling) as Inquiry['calendlyScheduling'],
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

