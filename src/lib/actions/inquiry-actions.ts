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
    return {
      id: doc.id,
      formType: data.formType ?? '',
      serviceArea: data.serviceArea ?? serviceArea,
      formData: data.formData ?? {},
      submittedAt: toISOString(data.submittedAt) ?? new Date().toISOString(),
      submittedBy: data.submittedBy ?? '',
      submissionType: data.submissionType ?? 'anonymous',
      reviewed: data.reviewed ?? false,
      reviewedAt: toISOString(data.reviewedAt),
      reviewedBy: data.reviewedBy,
      status: (data.status as InquiryStatus) ?? 'submitted',
      calendlyScheduling: data.calendlyScheduling,
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
  return {
    id: doc.id,
    formType: data?.formType ?? '',
    serviceArea: data?.serviceArea ?? serviceArea,
    formData: data?.formData ?? {},
    submittedAt: toISOString(data?.submittedAt) ?? new Date().toISOString(),
    submittedBy: data?.submittedBy ?? '',
    submissionType: data?.submissionType ?? 'anonymous',
    reviewed: data?.reviewed ?? false,
    reviewedAt: toISOString(data?.reviewedAt),
    reviewedBy: data?.reviewedBy,
    status: (data?.status as InquiryStatus) ?? 'submitted',
    calendlyScheduling: data?.calendlyScheduling,
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

