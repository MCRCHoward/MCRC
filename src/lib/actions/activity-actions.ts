'use server'

import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'
import type { ActivityItem } from '@/types/activity'

function assertActivityAccess(currentUserId: string, targetUserId: string, role: string) {
  if (currentUserId === targetUserId) {
    return
  }

  if (role !== 'admin') {
    throw new Error('Not authorized to manage activity for this user')
  }
}

function serializeActivity(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>,
): ActivityItem {
  const data = doc.data()
  return {
    id: doc.id,
    message: data.message ?? '',
    link: data.link ?? '#',
    inquiryId: data.inquiryId,
    read: Boolean(data.read),
    createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
  }
}

export async function fetchActivity(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<ActivityItem[]> {
  const currentUser = await requireAuth()
  assertActivityAccess(currentUser.id, userId, currentUser.role)

  let query = adminDb
    .collection(`users/${userId}/activity`)
    .orderBy('createdAt', 'desc')

  if (options?.unreadOnly) {
    query = query.where('read', '==', false)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(serializeActivity)
}

export async function markActivityRead(userId: string, activityId: string): Promise<void> {
  const currentUser = await requireAuth()
  assertActivityAccess(currentUser.id, userId, currentUser.role)

  const activityRef = adminDb.doc(`users/${userId}/activity/${activityId}`)
  await activityRef.update({ read: true })
}

export async function markAllActivityRead(userId: string): Promise<void> {
  const currentUser = await requireAuth()
  assertActivityAccess(currentUser.id, userId, currentUser.role)

  const snapshot = await adminDb
    .collection(`users/${userId}/activity`)
    .where('read', '==', false)
    .get()

  if (snapshot.empty) {
    return
  }

  const batch = adminDb.batch()
  snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }))
  await batch.commit()
}
