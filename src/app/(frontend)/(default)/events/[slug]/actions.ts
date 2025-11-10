'use server'

import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, requireRole } from '@/lib/custom-auth'
import { revalidatePath } from 'next/cache'
import type { EventRegistration, EventRegistrationInput } from '@/types/event-registration'

/**
 * Registers a user for an event
 * Creates registration in root-level eventRegistrations collection
 */
export async function registerForEvent(
  eventId: string,
  registrationData: EventRegistrationInput,
): Promise<{ id: string }> {
  const user = await requireAuth()

  // Fetch event details for denormalization
  const eventRef = adminDb.doc(`events/${eventId}`)
  const eventDoc = await eventRef.get()

  if (!eventDoc.exists) {
    throw new Error('Event not found')
  }

  const eventData = eventDoc.data()
  if (!eventData) {
    throw new Error('Event data not available')
  }

  // Check for duplicate registration
  const existingRegistrationsQuery = adminDb
    .collection('eventRegistrations')
    .where('userId', '==', user.id)
    .where('eventId', '==', eventId)
    .where('status', '==', 'registered')
    .limit(1)

  const existingSnapshot = await existingRegistrationsQuery.get()
  if (!existingSnapshot.empty) {
    throw new Error('You are already registered for this event')
  }

  // Denormalize event data
  const eventName = eventData.title || ''
  const eventDate = eventData.startAt
    ? typeof eventData.startAt === 'string'
      ? eventData.startAt
      : eventData.startAt.toDate?.()?.toISOString() || new Date().toISOString()
    : new Date().toISOString()
  const eventSlug = eventData.slug || eventId

  // Create registration document
  const registrationPayload: EventRegistration = {
    eventId,
    userId: user.id,
    name: registrationData.name,
    email: registrationData.email,
    phone: registrationData.phone,
    registrationDate: new Date().toISOString(),
    status: 'registered',
    emailMarketingConsent: registrationData.emailMarketingConsent,
    serviceInterest: registrationData.serviceInterest,
    eventName,
    eventDate,
    eventSlug,
    ...(registrationData.notes && { notes: registrationData.notes }),
  }

  const registrationRef = await adminDb.collection('eventRegistrations').add(registrationPayload)

  revalidatePath(`/events/${eventSlug}`)
  revalidatePath('/dashboard/my-events')

  return { id: registrationRef.id }
}

/**
 * Gets all registrations for a user
 */
export async function getUserRegistrations(
  userId: string,
): Promise<(EventRegistration & { id: string })[]> {
  const user = await requireAuth()

  // Users can only view their own registrations (unless admin)
  if (user.id !== userId && user.role !== 'admin') {
    throw new Error('Unauthorized: You can only view your own registrations')
  }

  const registrationsQuery = adminDb
    .collection('eventRegistrations')
    .where('userId', '==', userId)
    .orderBy('registrationDate', 'desc')

  const snapshot = await registrationsQuery.get()

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as EventRegistration),
    id: doc.id,
  }))
}

/**
 * Gets all registrations for an event (admin only)
 */
export async function getEventRegistrations(
  eventId: string,
): Promise<(EventRegistration & { id: string })[]> {
  await requireRole('admin')

  const registrationsQuery = adminDb
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .orderBy('registrationDate', 'desc')

  const snapshot = await registrationsQuery.get()

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as EventRegistration),
    id: doc.id,
  }))
}

/**
 * Cancels a registration
 */
export async function cancelRegistration(registrationId: string): Promise<void> {
  const user = await requireAuth()

  const registrationRef = adminDb.doc(`eventRegistrations/${registrationId}`)
  const registrationDoc = await registrationRef.get()

  if (!registrationDoc.exists) {
    throw new Error('Registration not found')
  }

  const registrationData = registrationDoc.data() as EventRegistration

  // Users can only cancel their own registrations (unless admin)
  if (registrationData.userId !== user.id && user.role !== 'admin') {
    throw new Error('Unauthorized: You can only cancel your own registrations')
  }

  await registrationRef.update({
    status: 'cancelled',
  })

  revalidatePath(`/events/${registrationData.eventSlug}`)
  revalidatePath('/dashboard/my-events')
}

/**
 * Gets user's registration status for a specific event
 * Returns registration object if found, null otherwise
 */
export async function getUserRegistrationStatus(
  eventId: string,
): Promise<{ registrationId: string; status: EventRegistration['status'] } | null> {
  const user = await requireAuth()

  const registrationQuery = adminDb
    .collection('eventRegistrations')
    .where('userId', '==', user.id)
    .where('eventId', '==', eventId)
    .limit(1)

  const snapshot = await registrationQuery.get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  if (!doc) return null

  const registrationData = doc.data() as EventRegistration
  return {
    registrationId: doc.id,
    status: registrationData.status,
  }
}

/**
 * Gets registration count for an event (admin only)
 */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  await requireRole('admin')

  const registrationsQuery = adminDb
    .collection('eventRegistrations')
    .where('eventId', '==', eventId)
    .where('status', '==', 'registered')

  const snapshot = await registrationsQuery.get()
  return snapshot.size
}
