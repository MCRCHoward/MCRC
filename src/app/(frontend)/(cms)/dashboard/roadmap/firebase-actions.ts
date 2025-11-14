'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, requireRole } from '@/lib/custom-auth'
import type { RoadmapItemInput, RecommendationInput } from '@/types'

/* -------------------------------------------------------------------------- */
/* Roadmap Items (Admin Only)                                                */
/* -------------------------------------------------------------------------- */

export async function createRoadmapItem(data: RoadmapItemInput) {
  console.log('[createRoadmapItem] START', { version: data?.version })

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
    console.log('[createRoadmapItem] OK', { id: docRef.id })

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
    return { id: docRef.id }
  } catch (error) {
    console.error('[createRoadmapItem] FAILED:', error)
    throw new Error(`Create failed: ${error}`)
  }
}

export async function updateRoadmapItem(id: string, data: Partial<RoadmapItemInput>) {
  console.log('[updateRoadmapItem] START', { id })

  try {
    await requireRole('admin') // Admin only

    const roadmapRef = adminDb.doc(`roadmapItems/${id}`)
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await roadmapRef.update(updateData)
    console.log('[updateRoadmapItem] OK')

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
    return { id }
  } catch (error) {
    console.error('[updateRoadmapItem] FAILED:', error)
    throw new Error(`Update failed: ${error}`)
  }
}

export async function deleteRoadmapItem(id: string) {
  console.log('[deleteRoadmapItem] START', { id })

  if (!id) throw new Error('Missing roadmap item id')

  try {
    await requireRole('admin') // Admin only

    await adminDb.doc(`roadmapItems/${id}`).delete()
    console.log('[deleteRoadmapItem] OK', { id })

    revalidatePath('/dashboard/roadmap')
    revalidatePath('/dashboard/roadmap/completed')
  } catch (error) {
    console.error('[deleteRoadmapItem] FAILED:', error)
    throw new Error(`Failed to delete roadmap item ${id}: ${error}`)
  }
}

export async function markRoadmapItemAsCompleted(id: string) {
  console.log('[markRoadmapItemAsCompleted] START', { id })

  if (!id) throw new Error('Missing roadmap item id')

  try {
    const user = await requireRole('admin') // Admin only

    const roadmapRef = adminDb.doc(`roadmapItems/${id}`)
    await roadmapRef.update({
      completed: true,
      completedAt: FieldValue.serverTimestamp(),
      completedBy: user.id,
    })
    console.log('[markRoadmapItemAsCompleted] OK', { id })

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
  console.log('[submitRecommendation] START', { title: data?.title })

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
    console.log('[submitRecommendation] OK', { id: docRef.id })

    revalidatePath('/dashboard/roadmap')
    return { id: docRef.id }
  } catch (error) {
    console.error('[submitRecommendation] FAILED:', error)
    throw new Error(`Submit failed: ${error}`)
  }
}

export async function acceptRecommendation(recommendationId: string) {
  console.log('[acceptRecommendation] START', { recommendationId })

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

    console.log('[acceptRecommendation] OK', {
      recommendationId,
      roadmapItemId: roadmapRef.id,
    })

    revalidatePath('/dashboard/roadmap')
    return { recommendationId, roadmapItemId: roadmapRef.id }
  } catch (error) {
    console.error('[acceptRecommendation] FAILED:', error)
    throw new Error(`Failed to accept recommendation: ${error}`)
  }
}

export async function deleteRecommendation(recommendationId: string) {
  console.log('[deleteRecommendation] START', { recommendationId })

  if (!recommendationId) throw new Error('Missing recommendation id')

  try {
    await requireRole('admin') // Admin only

    // Permanently delete the recommendation
    await adminDb.doc(`recommendations/${recommendationId}`).delete()
    console.log('[deleteRecommendation] OK', { recommendationId })

    revalidatePath('/dashboard/roadmap')
  } catch (error) {
    console.error('[deleteRecommendation] FAILED:', error)
    throw new Error(`Failed to delete recommendation ${recommendationId}: ${error}`)
  }
}

