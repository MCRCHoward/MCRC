import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types'
import { toISOString, toDate } from '../utils/timestamp-helpers'
import { EventListClient } from './components/EventListClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches all events from Firestore, ordered by most recent start date
 */
async function fetchEvents(): Promise<Event[]> {
  try {
    const snapshot = await adminDb.collection('events').orderBy('startAt', 'desc').limit(50).get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()

      const startAt = toDate(data.startAt)
      const endAt = toDate(data.endAt)

      const status = data.status === 'published' ? 'published' : 'draft'
      const listed = data.listed ?? true
      const isArchived = data.isArchived === true

      return {
        id: doc.id,
        name: data.title || '',
        slug: data.slug || doc.id,
        eventStartTime: startAt?.toISOString() || '',
        eventEndTime: endAt?.toISOString() || startAt?.toISOString() || '',
        modality: data.isOnline ? 'online' : 'in_person',
        meta: {
          slug: data.slug || doc.id,
          status,
          eventType: data.category || data.format,
        },
        listed,
        isArchived,
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
      } as Event
    })
  } catch (error) {
    console.error('[fetchEvents] Error:', error)
    return []
  }
}

/**
 * Events Management Page
 */
export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; q?: string }>
}) {
  const events = await fetchEvents()
  const params = await searchParams
  const view = (params?.view === 'archived' ? 'archived' : 'active') as 'active' | 'archived'
  const query = params?.q ?? ''

  return (
    <div className="p-4">
      <EventListClient events={events} view={view} query={query} />
    </div>
  )
}
