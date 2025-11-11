'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { logError } from '@/utilities/error-logging'

/**
 * Mark a form submission as reviewed
 */
export async function markSubmissionAsReviewed(originalDocPath: string): Promise<void> {
  try {
    const docRef = adminDb.doc(originalDocPath)

    // Check if document exists
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new Error('Submission not found')
    }

    // Update with reviewed flag and timestamp
    await docRef.update({
      reviewed: true,
      reviewedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/dashboard/inquiry')
  } catch (error) {
    logError('Error marking submission as reviewed', error, { originalDocPath })
    throw new Error('Failed to mark submission as reviewed. Please try again.')
  }
}

/**
 * Mark a form submission as unreviewed
 */
export async function markSubmissionAsUnreviewed(originalDocPath: string): Promise<void> {
  try {
    const docRef = adminDb.doc(originalDocPath)

    // Check if document exists
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new Error('Submission not found')
    }

    // Remove reviewed flag
    await docRef.update({
      reviewed: false,
      reviewedAt: FieldValue.delete(),
    })

    revalidatePath('/dashboard/inquiry')
  } catch (error) {
    logError('Error marking submission as unreviewed', error, { originalDocPath })
    throw new Error('Failed to mark submission as unreviewed. Please try again.')
  }
}

