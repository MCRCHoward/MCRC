import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import { firestoreToEventForEdit, type EventWithEditFields } from '@/lib/events'
import type { FirestoreEventData } from '@/types/event-firestore'
import EventForm from '../EventForm'

type RouteParams = Promise<{ slug: string }>

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches an event by slug from Firestore with all fields needed for editing
 */
async function fetchEventBySlug(slug: string): Promise<EventWithEditFields | null> {
  try {
    const snapshot = await adminDb
      .collection('events')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    if (!doc) {
      return null
    }

    return firestoreToEventForEdit(doc.id, doc.data() as FirestoreEventData)
  } catch (error) {
    console.error('[fetchEventBySlug] Error:', error)
    return null
  }
}

/**
 * Event Edit Page
 */
export default async function EventPage({ params }: { params: RouteParams }) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event) {
    notFound()
  }

  return <EventForm mode="edit" event={event} eventId={event.id} />
}
