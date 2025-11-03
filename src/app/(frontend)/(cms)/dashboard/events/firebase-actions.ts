'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'

interface CreateEventInput {
  title: string
  summary?: string
  descriptionHtml?: string
  imageUrl?: string
  slug?: string
  startAt: string // ISO
  endAt?: string // ISO
  timezone?: string
  isOnline: boolean
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
  listed?: boolean
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

export async function createEvent(data: CreateEventInput) {
  await requireAuth()

  const now = FieldValue.serverTimestamp()
  const payload = {
    ...data,
    slug: data.slug || slugify(data.title),
    createdAt: now,
    updatedAt: now,
    status: 'published' as const,
  }

  const docRef = await adminDb.collection('events').add(payload)

  revalidateTag('events')
  revalidatePath('/dashboard/events')
  revalidatePath('/events')

  return { id: docRef.id }
}
