'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireRole, getCurrentUser } from '@/lib/custom-auth'
import type { User } from '@/types'
import { z } from 'zod'
import { getRoleValues, isAdmin } from '@/lib/user-roles'
import { toISOString } from '../utils/timestamp-helpers'

/**
 * Fetches all users from Firestore
 * Admin and coordinator only
 */
export async function fetchAllUsers(): Promise<User[]> {
  try {
    // Allow both admin and coordinator to fetch users
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'coordinator')) {
      throw new Error('Access denied: Admin or coordinator role required')
    }

    const snapshot = await adminDb.collection('users').get()

    if (snapshot.empty) {
      return []
    }

    const users = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email ?? '',
        name: data.name ?? '',
        role: (data.role as User['role']) ?? 'participant',
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
      } as User
    })

    // Sort by name alphabetically
    users.sort((a, b) => a.name.localeCompare(b.name))

    return users
  } catch (error) {
    console.error('[fetchAllUsers] FAILED:', error)
    throw new Error(`Failed to fetch users: ${error}`)
  }
}

/**
 * Schema for updating user role
 * Uses getRoleValues() to ensure it stays in sync with the ROLES array
 */
const UpdateUserRoleSchema = z.object({
  role: z.enum(getRoleValues()),
})

/**
 * Updates a user's role
 * Admin only
 * Note: This updates the Firestore document. If you need to update Firebase Auth custom claims,
 * you'll need to call adminAuth.setCustomUserClaims() separately.
 */
export async function updateUserRole(userId: string, newRole: User['role']) {
  try {
    const currentUser = await requireRole('admin') // Admin only

    // Admins can change any user to any role, including creating other admins
    // Only prevent admins from changing their own role to non-admin (safety check)
    if (currentUser.id === userId && isAdmin(currentUser.role) && !isAdmin(newRole)) {
      throw new Error('You cannot change your own role from admin to another role')
    }

    // Validate the role
    const validation = UpdateUserRoleSchema.safeParse({ role: newRole })
    if (!validation.success) {
      throw new Error(`Invalid role: ${validation.error.errors.map((e) => e.message).join(', ')}`)
    }

    // Update Firestore document
    const userRef = adminDb.doc(`users/${userId}`)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      throw new Error('User not found')
    }

    await userRef.update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Update Firebase Auth custom claims if needed
    // Note: Custom claims are used for Firestore security rules
    try {
      if (isAdmin(newRole)) {
        await adminAuth.setCustomUserClaims(userId, { admin: true, coordinator: true })
      } else if (newRole === 'coordinator') {
        await adminAuth.setCustomUserClaims(userId, { coordinator: true, admin: false })
      } else {
        // Remove custom claims for non-admin/coordinator roles
        await adminAuth.setCustomUserClaims(userId, { admin: false, coordinator: false })
      }
    } catch (claimsError) {
      console.error('[updateUserRole] Failed to update custom claims:', claimsError)
      // Don't throw - Firestore update succeeded, claims can be fixed later
    }

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('[updateUserRole] FAILED:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update user role')
  }
}
