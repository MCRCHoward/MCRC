'use server'

import { adminDb } from '@/lib/firebase-admin'
import { requireAuth, requireRole } from '@/lib/custom-auth'
import { revalidatePath } from 'next/cache'
import type { EventRegistration, EventRegistrationInput } from '@/types/event-registration'
import { getEventName, timestampToISOString, getEventSlug } from '@/utilities/event-helpers'
import { sanitizeString, sanitizePhone, sanitizeEmail } from '@/utilities/sanitize'
import { checkRateLimit } from '@/utilities/rate-limit'
import { isMissingIndexError, formatIndexError } from '@/utilities/firestore-helpers'

/**
 * Registers a user for an event
 * Creates registration in root-level eventRegistrations collection
 */
export async function registerForEvent(
  eventId: string,
  registrationData: EventRegistrationInput,
): Promise<{ id: string }> {
  const user = await requireAuth()

  // Rate limiting: max 5 registrations per user per minute
  const rateLimitKey = `register:${user.id}`
  if (!checkRateLimit(rateLimitKey, 5, 60000)) {
    throw new Error('Too many registration attempts. Please wait a moment and try again.')
  }

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

  // Check user registration limit (max 10 active registrations per user)
  const MAX_USER_REGISTRATIONS = 10
  try {
    const userRegistrationsQuery = adminDb
      .collection('eventRegistrations')
      .where('userId', '==', user.id)
      .where('status', '==', 'registered')
      .limit(MAX_USER_REGISTRATIONS + 1)

    const userRegistrationsSnapshot = await userRegistrationsQuery.get()
    if (userRegistrationsSnapshot.size >= MAX_USER_REGISTRATIONS) {
      throw new Error(
        `You have reached the maximum limit of ${MAX_USER_REGISTRATIONS} active registrations. ` +
          'Please cancel an existing registration before registering for a new event.',
      )
    }
  } catch (error) {
    if (isMissingIndexError(error)) {
      throw new Error(formatIndexError(error))
    }
    // Re-throw if it's our custom error
    if (error instanceof Error && error.message.includes('maximum limit')) {
      throw error
    }
    throw error
  }

  // Check if event date is in the past (registration deadline)
  const eventStartAt = eventData.startAt
  if (eventStartAt) {
    const eventDate = timestampToISOString(eventStartAt)
    const eventDateTime = new Date(eventDate)
    const now = new Date()
    if (eventDateTime < now) {
      throw new Error('Registration is closed. This event has already started or passed.')
    }
  }

  // Check event capacity if set
  const eventCapacity = eventData.capacity
  if (typeof eventCapacity === 'number' && eventCapacity > 0) {
    try {
      const currentRegistrationsQuery = adminDb
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .where('status', '==', 'registered')

      const currentRegistrationsSnapshot = await currentRegistrationsQuery.get()
      const currentCount = currentRegistrationsSnapshot.size

      if (currentCount >= eventCapacity) {
        throw new Error('This event is full. Registration is no longer available.')
      }
    } catch (error) {
      if (isMissingIndexError(error)) {
        throw new Error(formatIndexError(error))
      }
      throw error
    }
  }

  // Denormalize event data using safe helpers
  const eventName = getEventName(eventData)
  const eventDate = timestampToISOString(eventData.startAt)
  const eventSlug = getEventSlug(eventData, eventId)

  // Sanitize user inputs before storing
  const sanitizedName = sanitizeString(registrationData.name)
  const sanitizedEmail = sanitizeEmail(registrationData.email)
  const sanitizedPhone = registrationData.phone ? sanitizePhone(registrationData.phone) : undefined
  const sanitizedNotes = registrationData.notes ? sanitizeString(registrationData.notes) : undefined

  // Create registration document
  const registrationPayload: EventRegistration = {
    eventId,
    userId: user.id,
    name: sanitizedName,
    email: sanitizedEmail,
    phone: sanitizedPhone,
    registrationDate: new Date().toISOString(),
    status: 'registered',
    emailMarketingConsent: registrationData.emailMarketingConsent,
    serviceInterest: registrationData.serviceInterest,
    eventName,
    eventDate,
    eventSlug,
    ...(sanitizedNotes && { notes: sanitizedNotes }),
  }

  const registrationRef = await adminDb.collection('eventRegistrations').add(registrationPayload)

  revalidatePath(`/events/${eventSlug}`)
  revalidatePath('/dashboard/my-events')

  return { id: registrationRef.id }
}

/**
 * Gets all registrations for a user
 * @param userId - The user ID to fetch registrations for
 * @param limit - Optional limit on number of registrations to return (default: 100)
 */
export async function getUserRegistrations(
  userId: string,
  limit: number = 100,
): Promise<(EventRegistration & { id: string })[]> {
  const user = await requireAuth()

  // Users can only view their own registrations (unless admin)
  if (user.id !== userId && user.role !== 'admin') {
    throw new Error('Unauthorized: You can only view your own registrations')
  }

  try {
    const registrationsQuery = adminDb
      .collection('eventRegistrations')
      .where('userId', '==', userId)
      .orderBy('registrationDate', 'desc')
      .limit(limit)

    const snapshot = await registrationsQuery.get()

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as EventRegistration),
      id: doc.id,
    }))
  } catch (error) {
    if (isMissingIndexError(error)) {
      throw new Error(formatIndexError(error))
    }
    throw error
  }
}

/**
 * Gets all registrations for an event (admin only)
 * @param eventId - The event ID to fetch registrations for
 * @param limit - Optional limit on number of registrations to return (default: 500)
 */
export async function getEventRegistrations(
  eventId: string,
  limit: number = 500,
): Promise<(EventRegistration & { id: string })[]> {
  await requireRole('admin')

  try {
    const registrationsQuery = adminDb
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .orderBy('registrationDate', 'desc')
      .limit(limit)

    const snapshot = await registrationsQuery.get()

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as EventRegistration),
      id: doc.id,
    }))
  } catch (error) {
    if (isMissingIndexError(error)) {
      throw new Error(formatIndexError(error))
    }
    throw error
  }
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

  // Verify event still exists and check if it's past
  const eventRef = adminDb.doc(`events/${registrationData.eventId}`)
  const eventDoc = await eventRef.get()

  if (eventDoc.exists) {
    const eventData = eventDoc.data()
    if (eventData?.startAt) {
      const eventDate = timestampToISOString(eventData.startAt)
      const eventDateTime = new Date(eventDate)
      const now = new Date()
      // Allow cancellation if event is more than 1 hour away (grace period)
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (eventDateTime < oneHourFromNow) {
        throw new Error(
          'Cancellation is no longer available. The event has started or is starting soon.',
        )
      }
    }
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

  try {
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
  } catch (error) {
    if (isMissingIndexError(error)) {
      throw new Error(formatIndexError(error))
    }
    throw error
  }
}

/**
 * Gets registration count for an event (admin only)
 */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  await requireRole('admin')

  try {
    const registrationsQuery = adminDb
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('status', '==', 'registered')

    const snapshot = await registrationsQuery.get()
    return snapshot.size
  } catch (error) {
    if (isMissingIndexError(error)) {
      throw new Error(formatIndexError(error))
    }
    throw error
  }
}
