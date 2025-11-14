'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import { z } from 'zod'

/**
 * Schema for updating user account information
 * Users can update their name and email, but not their role
 */
const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100, 'Name must be less than 100 characters.'),
  email: z.string().email('Invalid email address.').min(1, 'Email is required.'),
})

/**
 * Updates the current user's account information (name and email)
 * Users can only update their own account
 */
export async function updateAccount(data: { name: string; email: string }) {
  console.log('[updateAccount] START')

  try {
    const user = await requireAuth()

    // Validate the incoming data
    const validation = UpdateAccountSchema.safeParse(data)
    if (!validation.success) {
      throw new Error(
        `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`,
      )
    }

    const { name, email } = validation.data

    // Update Firestore document
    const userRef = adminDb.doc(`users/${user.id}`)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      throw new Error('User not found')
    }

    // Update Firestore
    await userRef.update({
      name,
      email,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Update Firebase Auth email if it changed
    try {
      const currentUser = await adminAuth.getUser(user.id)
      if (currentUser.email !== email) {
        await adminAuth.updateUser(user.id, {
          email,
          displayName: name,
        })
        console.log('[updateAccount] Firebase Auth email updated', { userId: user.id })
      } else if (currentUser.displayName !== name) {
        // Only update display name if email didn't change
        await adminAuth.updateUser(user.id, {
          displayName: name,
        })
        console.log('[updateAccount] Firebase Auth display name updated', { userId: user.id })
      }
    } catch (authError) {
      console.error('[updateAccount] Failed to update Firebase Auth:', authError)
      // Don't throw - Firestore update succeeded, auth update can be fixed later
    }

    console.log('[updateAccount] OK', { userId: user.id })
    revalidatePath('/dashboard/account')
    return { success: true }
  } catch (error) {
    console.error('[updateAccount] FAILED:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update account')
  }
}

