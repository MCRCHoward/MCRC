'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireRoleAny } from '@/lib/custom-auth'
import { eventInputToFirestore, slugify, type EventFormInput } from '@/lib/events/server'

type CreateEventInput = EventFormInput

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const existing = await adminDb
    .collection('events')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  const conflict = existing.docs.find((doc) => doc.id !== excludeId)
  if (conflict) {
    throw new Error('Slug is already in use. Please choose a different slug.')
  }
}

/**
 * Validates that endAt is after startAt (if endAt is provided)
 */
function assertValidDateRange(startAt: string, endAt?: string) {
  if (!endAt) return // endAt is optional

  const startDate = new Date(startAt)
  const endDate = new Date(endAt)

  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid start date format')
  }

  if (isNaN(endDate.getTime())) {
    throw new Error('Invalid end date format')
  }

  if (endDate < startDate) {
    throw new Error('End date/time must be after start date/time')
  }
}

export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  await requireRoleAny(['editor', 'coordinator'])
  if (!slug) return false
  const normalizedSlug = slugify(slug)
  if (!normalizedSlug) return false
  const snapshot = await adminDb
    .collection('events')
    .where('slug', '==', normalizedSlug)
    .limit(1)
    .get()
  const conflict = snapshot.docs.find((doc) => doc.id !== excludeId)
  return !conflict
}

export async function createEvent(data: CreateEventInput) {
  await requireRoleAny(['editor', 'coordinator'])

  // Validate date range (server-side enforcement)
  assertValidDateRange(data.startAt, data.endAt)

  const basePayload = eventInputToFirestore(data)
  await assertUniqueSlug(basePayload.slug)

  const now = FieldValue.serverTimestamp()
  const payload = {
    ...basePayload,
    createdAt: now,
    updatedAt: now,
    isArchived: false,
    archivedAt: null as ReturnType<typeof FieldValue.serverTimestamp> | null,
    archivedBy: null as string | null,
  }

  const docRef = await adminDb.collection('events').add(payload)

  revalidatePath('/dashboard/events')
  revalidatePath('/events')

  return { id: docRef.id }
}

export async function updateEvent(id: string, data: CreateEventInput) {
  await requireRoleAny(['editor', 'coordinator'])

  if (!id) {
    throw new Error('Event ID is required')
  }

  // Validate date range (server-side enforcement)
  assertValidDateRange(data.startAt, data.endAt)

  const eventRef = adminDb.doc(`events/${id}`)
  const eventDoc = await eventRef.get()

  if (!eventDoc.exists) {
    throw new Error('Event not found')
  }

  const existingData = eventDoc.data()
  const basePayload = eventInputToFirestore(data)
  const baseUpdatePayload: Record<string, unknown> = { ...basePayload }
  delete baseUpdatePayload.slug

  // Preserve createdAt, only update updatedAt
  const updatePayload: Record<string, unknown> & {
    updatedAt: ReturnType<typeof FieldValue.serverTimestamp>
    slug?: string
  } = {
    ...baseUpdatePayload,
    updatedAt: FieldValue.serverTimestamp(),
    status: (data.status ?? existingData?.status ?? 'draft') as 'draft' | 'published',
    listed: data.listed ?? existingData?.listed ?? true,
    isRegistrationRequired:
      data.isRegistrationRequired ?? existingData?.isRegistrationRequired ?? true,
  }

  // Only update slug if title changed
  if (data.title && existingData?.title !== data.title) {
    updatePayload.slug = data.slug ? slugify(data.slug) : slugify(data.title)
  } else if (data.slug && data.slug !== existingData?.slug) {
    updatePayload.slug = slugify(data.slug)
  }

  if (updatePayload.slug) {
    await assertUniqueSlug(updatePayload.slug, id)
  }

  await eventRef.update(updatePayload)

  revalidatePath('/dashboard/events')
  revalidatePath(`/dashboard/events/${updatePayload.slug || existingData?.slug || id}`)
  revalidatePath('/events')

  return { id }
}

export async function archiveEvent(id: string, archivedBy?: string) {
  const user = await requireRoleAny(['editor', 'coordinator'])
  if (!id) throw new Error('Event ID is required')
  const eventRef = adminDb.doc(`events/${id}`)
  await eventRef.update({
    isArchived: true,
    archivedAt: FieldValue.serverTimestamp(),
    archivedBy: user.id ?? archivedBy ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  revalidatePath('/dashboard/events')
  revalidatePath('/events')
  return { id }
}

export async function restoreEvent(id: string) {
  await requireRoleAny(['editor', 'coordinator'])
  if (!id) throw new Error('Event ID is required')
  const eventRef = adminDb.doc(`events/${id}`)
  await eventRef.update({
    isArchived: false,
    archivedAt: null,
    archivedBy: null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  revalidatePath('/dashboard/events')
  revalidatePath('/events')
  return { id }
}

export async function setEventStatus(id: string, status: 'draft' | 'published') {
  await requireRoleAny(['editor', 'coordinator'])
  if (!id) throw new Error('Event ID is required')
  const eventRef = adminDb.doc(`events/${id}`)
  await eventRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  })
  revalidatePath('/dashboard/events')
  revalidatePath('/events')
  return { id, status }
}

export async function setEventListed(id: string, listed: boolean) {
  await requireRoleAny(['editor', 'coordinator'])
  if (!id) throw new Error('Event ID is required')
  const eventRef = adminDb.doc(`events/${id}`)
  await eventRef.update({
    listed,
    updatedAt: FieldValue.serverTimestamp(),
  })
  revalidatePath('/dashboard/events')
  revalidatePath('/events')
  return { id, listed }
}
