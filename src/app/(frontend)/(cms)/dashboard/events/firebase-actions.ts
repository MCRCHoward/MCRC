'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireRoleAny } from '@/lib/custom-auth'

interface CreateEventInput {
  title: string
  summary?: string
  descriptionHtml?: string
  imageUrl?: string
  secondaryImageUrl?: string
  externalRegistrationLink?: string
  slug?: string
  startAt: string // ISO
  endAt?: string // ISO
  timezone?: string
  isOnline: boolean
  onlineMeetingUrl?: string
  onlineMeetingDetails?: string
  venue?: {
    name?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  capacity?: number
  isFree: boolean
  price?: number
  currency?: string
  costDescription?: string
  cost?: {
    amount: number
    currency: string
    description?: string
  }
  listed?: boolean
  status?: 'draft' | 'published'
  isRegistrationRequired?: boolean
  category?: string
  subcategory?: string
  format?: string
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

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

/**
 * Converts an ISO string to a Firestore Timestamp
 */
function toFirestoreTimestamp(isoString: string): Timestamp {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${isoString}`)
  }
  return Timestamp.fromDate(date)
}

export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  await requireRoleAny(['editor', 'coordinator'])
  if (!slug) return false
  const snapshot = await adminDb
    .collection('events')
    .where('slug', '==', slug)
    .limit(1)
    .get()
  const conflict = snapshot.docs.find((doc) => doc.id !== excludeId)
  return !conflict
}

export async function createEvent(data: CreateEventInput) {
  const user = await requireRoleAny(['editor', 'coordinator'])

  // Validate date range (server-side enforcement)
  assertValidDateRange(data.startAt, data.endAt)

  const now = FieldValue.serverTimestamp()
  const cost =
    data.isFree || (!data.cost && !data.price)
      ? undefined
      : data.cost || {
          amount: data.price ?? 0,
          currency: data.currency || 'USD',
        }

  const slug = data.slug ? slugify(data.slug) : slugify(data.title)
  await assertUniqueSlug(slug)

  // Convert ISO strings to Firestore Timestamps for consistency
  const startAtTimestamp = toFirestoreTimestamp(data.startAt)
  const endAtTimestamp = data.endAt ? toFirestoreTimestamp(data.endAt) : null

  const payload = {
    ...data,
    slug,
    // Store as Firestore Timestamps (normalized format)
    startAt: startAtTimestamp,
    endAt: endAtTimestamp,
    isRegistrationRequired: data.isRegistrationRequired ?? true,
    createdAt: now,
    updatedAt: now,
    status: (data.status ?? 'published') as 'draft' | 'published',
    listed: data.listed ?? true,
    isArchived: false,
    archivedAt: null as ReturnType<typeof FieldValue.serverTimestamp> | null,
    archivedBy: null as string | null,
    cost,
    // Legacy fields for backward compatibility
    price: cost?.amount,
    currency: cost?.currency,
    costDescription: cost?.description,
  }

  const docRef = await adminDb.collection('events').add(payload)

  revalidatePath('/dashboard/events')
  revalidatePath('/events')

  return { id: docRef.id }
}

export async function updateEvent(id: string, data: CreateEventInput) {
  const user = await requireRoleAny(['editor', 'coordinator'])

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

  // Convert ISO strings to Firestore Timestamps for consistency
  const startAtTimestamp = toFirestoreTimestamp(data.startAt)
  const endAtTimestamp = data.endAt ? toFirestoreTimestamp(data.endAt) : null

  // Preserve createdAt, only update updatedAt
  // Use Record type to allow Timestamp values instead of string for startAt/endAt
  const updatePayload: Record<string, unknown> & {
    updatedAt: ReturnType<typeof FieldValue.serverTimestamp>
    slug?: string
  } = {
    ...data,
    // Store as Firestore Timestamps (normalized format)
    startAt: startAtTimestamp,
    endAt: endAtTimestamp,
    updatedAt: FieldValue.serverTimestamp(),
    status: (data.status ?? eventDoc.data()?.status ?? 'draft') as 'draft' | 'published',
    listed: data.listed ?? eventDoc.data()?.listed ?? true,
  }

  const cost =
    data.isFree || (!data.cost && !data.price)
      ? undefined
      : data.cost || {
          amount: data.price ?? 0,
          currency: data.currency || 'USD',
        }
  if (cost) {
    updatePayload.cost = cost
    updatePayload.price = cost.amount
    updatePayload.currency = cost.currency
    ;(updatePayload as Record<string, unknown>).costDescription = cost.description
  } else {
    updatePayload.cost = undefined
    updatePayload.price = undefined
    updatePayload.currency = undefined
    ;(updatePayload as Record<string, unknown>).costDescription = undefined
  }

  // Only update slug if title changed
  const existingData = eventDoc.data()
  if (data.title && existingData?.title !== data.title) {
    updatePayload.slug = data.slug ? slugify(data.slug) : slugify(data.title)
  } else if (data.slug && data.slug !== existingData?.slug) {
    updatePayload.slug = slugify(data.slug)
  }

  if (updatePayload.slug) {
    await assertUniqueSlug(updatePayload.slug, id)
  }

  updatePayload.isRegistrationRequired =
    data.isRegistrationRequired ?? existingData?.isRegistrationRequired ?? true

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
