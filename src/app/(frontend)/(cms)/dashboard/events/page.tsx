import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types'
import type { FirestoreEventData } from '@/types/event-firestore'
import { firestoreToEvent } from '@/lib/events'
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

    return snapshot.docs.map((doc) =>
      firestoreToEvent(doc.id, doc.data() as FirestoreEventData),
    )
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
