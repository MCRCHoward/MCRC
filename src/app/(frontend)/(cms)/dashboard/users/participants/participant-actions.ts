'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/custom-auth'
import { isStaff } from '@/lib/user-roles'
import type { Participant, ParticipantInput } from '@/types/participant'
import { z } from 'zod'
import { toISOString } from '../../utils/timestamp-helpers'

/**
 * Schema for participant input validation
 */
const ParticipantInputSchema = z.object({
  age: z.number().int().min(0).max(150).optional(),
  gender: z.string().trim().max(100).optional(),
  race: z.string().trim().max(100).optional(),
  income: z.string().trim().max(100).optional(),
  education: z.string().trim().max(200).optional(),
  militaryStatus: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  source: z
    .object({
      formType: z.string().trim().max(100).optional(),
      inquiryPath: z.string().trim().max(500).optional(),
      submittedAt: z.string().trim().max(100).optional(),
    })
    .optional(),
})

/**
 * Fetches all participants from Firestore
 * Staff only (admin or coordinator)
 */
export async function fetchParticipants(): Promise<Participant[]> {
  try {
    const user = await getCurrentUser()
    if (!user || !isStaff(user.role)) {
      throw new Error('Access denied: Staff role required')
    }

    const snapshot = await adminDb
      .collection('participants')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get()

    if (snapshot.empty) {
      return []
    }

    const participants = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        age: data.age ?? undefined,
        gender: data.gender ?? undefined,
        race: data.race ?? undefined,
        income: data.income ?? undefined,
        education: data.education ?? undefined,
        militaryStatus: data.militaryStatus ?? undefined,
        notes: data.notes ?? undefined,
        source: data.source ?? undefined,
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
        createdBy: data.createdBy ?? '',
      } as Participant
    })

    return participants
  } catch (error) {
    console.error('[fetchParticipants] FAILED:', error)
    throw new Error(`Failed to fetch participants: ${error}`)
  }
}

/**
 * Creates a new participant
 * Staff only
 */
export async function createParticipant(input: ParticipantInput) {
  try {
    const user = await getCurrentUser()
    if (!user || !isStaff(user.role)) {
      throw new Error('Access denied: Staff role required')
    }

    // Validate input
    const validation = ParticipantInputSchema.safeParse(input)
    if (!validation.success) {
      throw new Error(
        `Invalid input: ${validation.error.errors.map((e) => e.message).join(', ')}`,
      )
    }

    const now = FieldValue.serverTimestamp()
    const payload = {
      ...validation.data,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
    }

    const docRef = await adminDb.collection('participants').add(payload)

    revalidatePath('/dashboard/users/participants')
    return { id: docRef.id, success: true }
  } catch (error) {
    console.error('[createParticipant] FAILED:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create participant')
  }
}

/**
 * Updates an existing participant
 * Staff only
 */
export async function updateParticipant(participantId: string, input: Partial<ParticipantInput>) {
  try {
    const user = await getCurrentUser()
    if (!user || !isStaff(user.role)) {
      throw new Error('Access denied: Staff role required')
    }

    // Validate input
    const validation = ParticipantInputSchema.partial().safeParse(input)
    if (!validation.success) {
      throw new Error(
        `Invalid input: ${validation.error.errors.map((e) => e.message).join(', ')}`,
      )
    }

    const participantRef = adminDb.doc(`participants/${participantId}`)
    const participantDoc = await participantRef.get()

    if (!participantDoc.exists) {
      throw new Error('Participant not found')
    }

    await participantRef.update({
      ...validation.data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/dashboard/users/participants')
    return { success: true }
  } catch (error) {
    console.error('[updateParticipant] FAILED:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update participant')
  }
}

/**
 * Deletes a participant
 * Staff only
 */
export async function deleteParticipant(participantId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !isStaff(user.role)) {
      throw new Error('Access denied: Staff role required')
    }

    const participantRef = adminDb.doc(`participants/${participantId}`)
    const participantDoc = await participantRef.get()

    if (!participantDoc.exists) {
      throw new Error('Participant not found')
    }

    await participantRef.delete()

    revalidatePath('/dashboard/users/participants')
    return { success: true }
  } catch (error) {
    console.error('[deleteParticipant] FAILED:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete participant')
  }
}
