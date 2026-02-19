import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types'
import type { FirestoreEventData } from '@/types/event-firestore'
import { firestoreToEvent } from '@/lib/events'
import { EventListClient } from './components/EventListClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export interface CmsEventInfo extends Event {
  capacity?: number
  registrationCount: number
}

const PAGE_SIZE = 20
const SEARCH_LIMIT = 100

async function getRegistrationCount(eventId: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection('eventRegistrations')
      .where('eventId', '==', eventId)
      .where('status', '==', 'registered')
      .count()
      .get()
    return snapshot.data().count
  } catch {
    return 0
  }
}

interface FetchEventsParams {
  isArchived: boolean
  cursor?: string
  limit: number
}

interface FetchEventsResult {
  events: CmsEventInfo[]
  nextCursor?: string
  hasMore: boolean
}

async function fetchEvents({
  isArchived,
  cursor,
  limit,
}: FetchEventsParams): Promise<FetchEventsResult> {
  try {
    let query = adminDb
      .collection('events')
      .where('isArchived', '==', isArchived)
      .orderBy('startAt', 'desc')
      .limit(limit + 1)

    if (cursor) {
      const cursorDoc = await adminDb.collection('events').doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const snapshot = await query.get()

    if (snapshot.empty) {
      return { events: [], hasMore: false }
    }

    const docs = snapshot.docs
    const hasMore = docs.length > limit
    const docsToReturn = hasMore ? docs.slice(0, limit) : docs

    const events = await Promise.all(
      docsToReturn.map(async (doc) => {
        const data = doc.data() as FirestoreEventData
        const event = firestoreToEvent(doc.id, data)
        const registrationCount = await getRegistrationCount(doc.id)
        return {
          ...event,
          capacity: data.capacity,
          registrationCount,
        }
      }),
    )

    const nextCursor = hasMore ? docsToReturn[docsToReturn.length - 1]?.id : undefined

    return { events, nextCursor, hasMore }
  } catch (error) {
    console.error('[fetchEvents] Error:', error)
    return { events: [], hasMore: false }
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; q?: string; cursor?: string }>
}) {
  const params = await searchParams
  const view = (params?.view === 'archived' ? 'archived' : 'active') as 'active' | 'archived'
  const query = params?.q ?? ''
  const cursor = params?.cursor

  const isSearching = Boolean(query.trim())
  const limit = isSearching ? SEARCH_LIMIT : PAGE_SIZE

  const { events, nextCursor, hasMore } = await fetchEvents({
    isArchived: view === 'archived',
    cursor: isSearching ? undefined : cursor,
    limit,
  })

  return (
    <div className="p-4">
      <EventListClient
        events={events}
        view={view}
        query={query}
        nextCursor={nextCursor}
        hasMore={hasMore}
      />
    </div>
  )
}
