'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'
import { revalidatePath } from 'next/cache'

import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import type { Task, TaskPriority, TaskStatus } from '@/types/task'

function assertTaskAccess(currentUserId: string, targetUserId: string, role: string) {
  if (currentUserId === targetUserId) {
    return
  }

  if (role !== 'admin') {
    throw new Error('Not authorized to manage tasks for this user')
  }
}

function serializeTask(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Task {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title ?? 'Task',
    type: data.type,
    status: data.status,
    priority: data.priority ?? 'medium',
    serviceArea: data.serviceArea,
    inquiryId: data.inquiryId,
    link: data.link,
    assignedTo: data.assignedTo,
    createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
    due: toISOString(data.due) ?? null,
    completedAt: toISOString(data.completedAt) ?? null,
  }
}

export async function fetchTasks(
  userId: string,
  options?: { status?: TaskStatus; limit?: number },
): Promise<Task[]> {
  const currentUser = await requireAuth()
  assertTaskAccess(currentUser.id, userId, currentUser.role)

  let query = adminDb
    .collection(`users/${userId}/tasks`)
    .orderBy('createdAt', 'desc')

  if (options?.status) {
    query = query.where('status', '==', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(serializeTask)
}

export async function markTaskComplete(userId: string, taskId: string): Promise<void> {
  const currentUser = await requireAuth()
  assertTaskAccess(currentUser.id, userId, currentUser.role)

  const taskRef = adminDb.doc(`users/${userId}/tasks/${taskId}`)
  await taskRef.update({
    status: 'done',
    completedAt: FieldValue.serverTimestamp(),
  })

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard')
}

export async function updateTaskPriority(
  userId: string,
  taskId: string,
  priority: TaskPriority,
): Promise<void> {
  const currentUser = await requireAuth()
  assertTaskAccess(currentUser.id, userId, currentUser.role)

  const taskRef = adminDb.doc(`users/${userId}/tasks/${taskId}`)
  await taskRef.update({ priority })

  revalidatePath('/dashboard/tasks')
}

export async function getPendingTaskCount(userId: string): Promise<number> {
  const currentUser = await requireAuth()
  assertTaskAccess(currentUser.id, userId, currentUser.role)

  const aggregate = await adminDb
    .collection(`users/${userId}/tasks`)
    .where('status', '==', 'pending')
    .count()
    .get()

  return Number(aggregate.data().count ?? 0)
}
