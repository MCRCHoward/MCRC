'use server'

import { adminDb } from '@/lib/firebase-admin'
import { requireRole } from '@/lib/custom-auth'
import { revalidatePath } from 'next/cache'

/**
 * Marks a registration as attended (admin only)
 */
export async function markAttendance(registrationId: string): Promise<void> {
  await requireRole('admin')

  const registrationRef = adminDb.doc(`eventRegistrations/${registrationId}`)
  const registrationDoc = await registrationRef.get()

  if (!registrationDoc.exists) {
    throw new Error('Registration not found')
  }

  const registrationData = registrationDoc.data()
  const eventSlug = registrationData?.eventSlug || ''

  await registrationRef.update({
    status: 'attended',
  })

  revalidatePath(`/dashboard/events/${eventSlug}/registrations`)
  revalidatePath(`/events/${eventSlug}`)
}

/**
 * Cancels a registration (admin override)
 */
export async function cancelRegistrationAdmin(registrationId: string): Promise<void> {
  await requireRole('admin')

  const registrationRef = adminDb.doc(`eventRegistrations/${registrationId}`)
  const registrationDoc = await registrationRef.get()

  if (!registrationDoc.exists) {
    throw new Error('Registration not found')
  }

  const registrationData = registrationDoc.data()
  const eventSlug = registrationData?.eventSlug || ''

  await registrationRef.update({
    status: 'cancelled',
  })

  revalidatePath(`/dashboard/events/${eventSlug}/registrations`)
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath('/dashboard/my-events')
}

