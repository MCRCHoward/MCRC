'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, requireRole } from '@/lib/custom-auth'
import type { RoadmapItemInput, RecommendationInput } from '@/types'
import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/* Roadmap Items (Admin Only)                                                */
/* -------------------------------------------------------------------------- */

export async function createRoadmapItem(data: RoadmapItemInput) {
  try {
    const user = await requireRole('admin') // Admin only

    // Get the highest order number to append new item at the end
    const existingItems = await adminDb
      .collection('roadmapItems')
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder =
      existingItems.empty || !existingItems.docs[0]
        ? 0
        : (existingItems.docs[0].data().order as number) || 0

    const roadmapData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: user.id,
      order: maxOrder + 1,
    }

    const docRef = await adminDb.collection('roadmapItems').add(roadmapData)

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
    return { id: docRef.id }
  } catch (error) {
    console.error('[createRoadmapItem] FAILED:', error)
    throw new Error(`Create failed: ${error}`)
  }
}

export async function updateRoadmapItem(id: string, data: Partial<RoadmapItemInput>) {
  try {
    await requireRole('admin') // Admin only

    const roadmapRef = adminDb.doc(`roadmapItems/${id}`)
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await roadmapRef.update(updateData)

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
    return { id }
  } catch (error) {
    console.error('[updateRoadmapItem] FAILED:', error)
    throw new Error(`Update failed: ${error}`)
  }
}

export async function deleteRoadmapItem(id: string) {
  if (!id) throw new Error('Missing roadmap item id')

  try {
    await requireRole('admin') // Admin only

    await adminDb.doc(`roadmapItems/${id}`).delete()

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
  } catch (error) {
    console.error('[deleteRoadmapItem] FAILED:', error)
    throw new Error(`Failed to delete roadmap item ${id}: ${error}`)
  }
}

export async function markRoadmapItemAsCompleted(id: string) {
  if (!id) throw new Error('Missing roadmap item id')

  try {
    const user = await requireRole('admin') // Admin only

    const roadmapRef = adminDb.doc(`roadmapItems/${id}`)
    await roadmapRef.update({
      completed: true,
      completedAt: FieldValue.serverTimestamp(),
      completedBy: user.id,
    })

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
  } catch (error) {
    console.error('[markRoadmapItemAsCompleted] FAILED:', error)
    throw new Error(`Failed to mark roadmap item as completed ${id}: ${error}`)
  }
}

/* -------------------------------------------------------------------------- */
/* Recommendations                                                            */
/* -------------------------------------------------------------------------- */

export async function submitRecommendation(data: RecommendationInput) {
  try {
    const user = await requireAuth() // All authenticated users can submit

    // Get the highest order number to append new item at the end
    const existingRecs = await adminDb
      .collection('recommendations')
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder =
      existingRecs.empty || !existingRecs.docs[0]
        ? 0
        : (existingRecs.docs[0].data().order as number) || 0

    const recommendationData = {
      ...data,
      submittedBy: user.id,
      submittedByName: user.name || user.email || 'Anonymous',
      submittedAt: FieldValue.serverTimestamp(),
      status: 'pending' as const,
      order: maxOrder + 1,
    }

    const docRef = await adminDb.collection('recommendations').add(recommendationData)

    revalidatePath('/dashboard/roadmap')
    return { id: docRef.id }
  } catch (error) {
    console.error('[submitRecommendation] FAILED:', error)
    throw new Error(`Submit failed: ${error}`)
  }
}

export async function acceptRecommendation(recommendationId: string) {
  try {
    const user = await requireRole('admin') // Admin only

    // Get the recommendation
    const recRef = adminDb.doc(`recommendations/${recommendationId}`)
    const recDoc = await recRef.get()

    if (!recDoc.exists) {
      throw new Error('Recommendation not found')
    }

    const recData = recDoc.data()
    if (!recData) {
      throw new Error('Recommendation data is empty')
    }

    // Get the highest order number for roadmap items
    const existingItems = await adminDb
      .collection('roadmapItems')
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder =
      existingItems.empty || !existingItems.docs[0]
        ? 0
        : (existingItems.docs[0].data().order as number) || 0

    // Create roadmap item from recommendation
    const roadmapData = {
      version: `v${new Date().getFullYear()}.${new Date().getMonth() + 1}.0`, // Auto-generate version
      type: 'Feature' as const,
      title: recData.title as string,
      description: recData.description as string,
      date: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: user.id,
      order: maxOrder + 1,
    }

    const roadmapRef = await adminDb.collection('roadmapItems').add(roadmapData)

    // Update recommendation status to accepted
    await recRef.update({
      status: 'accepted',
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: user.id,
      // Move to end of grid by updating order to be highest
      order: FieldValue.increment(10000), // Large increment to ensure it's last
    })

    revalidatePath('/dashboard/roadmap')
    return { recommendationId, roadmapItemId: roadmapRef.id }
  } catch (error) {
    console.error('[acceptRecommendation] FAILED:', error)
    throw new Error(`Failed to accept recommendation: ${error}`)
  }
}

export async function deleteRecommendation(recommendationId: string) {
  if (!recommendationId) throw new Error('Missing recommendation id')

  try {
    await requireRole('admin') // Admin only

    // Permanently delete the recommendation
    await adminDb.doc(`recommendations/${recommendationId}`).delete()

    revalidatePath('/dashboard/roadmap')
  } catch (error) {
    console.error('[deleteRecommendation] FAILED:', error)
    throw new Error(`Failed to delete recommendation ${recommendationId}: ${error}`)
  }
}

// Zod schema for updating recommendations
const UpdateRecommendationSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.'),
  description: z.string().min(1, 'Description cannot be empty.'),
})

/**
 * Allows a user to update their own pending recommendation.
 */
export async function updateRecommendation(id: string, data: Partial<RecommendationInput>) {
  // 1. Get the currently authenticated user
  const user = await requireAuth()

  // 2. Validate the incoming data
  const validation = UpdateRecommendationSchema.safeParse({
    title: data.title,
    description: data.description,
  })

  if (!validation.success) {
    throw new Error(
      `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`,
    )
  }
  const { title, description } = validation.data

  try {
    const recRef = adminDb.doc(`recommendations/${id}`)
    const recDoc = await recRef.get()

    if (!recDoc.exists) {
      throw new Error('Recommendation not found.')
    }

    const recData = recDoc.data()
    if (!recData) {
      throw new Error('Recommendation data is empty')
    }

    // 3. Security Check: Is the current user the owner?
    if (recData.submittedBy !== user.id) {
      throw new Error('You are not authorized to edit this recommendation.')
    }

    // 4. Security Check: Is the recommendation still pending?
    if (recData.status !== 'pending') {
      throw new Error('This recommendation has already been reviewed and cannot be edited.')
    }

    // 5. All checks passed. Update the document.
    await recRef.update({
      title: title,
      description: description,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/dashboard/roadmap')
    return { id }
  } catch (error) {
    console.error('[updateRecommendation] FAILED:', error)
    // Pass the specific error message to the client
    throw new Error(error instanceof Error ? error.message : 'Update failed')
  }
}
