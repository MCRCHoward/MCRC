import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types'

type RouteParams = Promise<{ slug: string }>

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches an event by slug from Firestore
 */
async function fetchEventBySlug(slug: string): Promise<Event | null> {
  try {
    const snapshot = await adminDb.collection('events').where('slug', '==', slug).limit(1).get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    if (!doc) {
      return null
    }

    const data = doc.data()

    const toISOString = (value: unknown): string | undefined => {
      if (!value) return undefined
      if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }
      if (typeof value === 'string') return value
      return undefined
    }

    const startAt = data.startAt?.toDate?.() ?? (data.startAt instanceof Date ? data.startAt : null)

    return {
      id: doc.id,
      name: data.title || '',
      slug: data.slug || doc.id,
      eventStartTime: startAt?.toISOString() || '',
      eventEndTime: data.endAt?.toDate?.()?.toISOString() || data.endAt || '',
      modality: data.isOnline ? 'online' : 'in_person',
      meta: {
        slug: data.slug || doc.id,
        status: data.status === 'published' ? 'published' : 'draft',
        eventType: data.category || data.format,
      },
      createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
      updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
    } as Event
  } catch (error) {
    console.error('[fetchEventBySlug] Error:', error)
    return null
  }
}

/**
 * Event Edit Page
 *
 * Note: This is a placeholder. You should implement an EventForm component
 * similar to PostForm for editing events.
 */
export default async function EventPage({ params }: { params: RouteParams }) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Edit Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Event: {event.name} ({event.slug})
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Event editing form coming soon. For now, you can create new events.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Event details: {event.name} - {event.eventStartTime}
        </p>
      </div>
    </div>
  )
}
