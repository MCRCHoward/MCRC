import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'
import { requireRole } from '@/lib/custom-auth'
import { getEventRegistrations, getEventRegistrationCount } from '@/app/(frontend)/(default)/events/[slug]/actions'
import { EventRegistrationsClient } from './EventRegistrationsClient'
import { getEventName } from '@/utilities/event-helpers'
import { logError } from '@/utilities/error-logging'

type RouteParams = Promise<{ slug: string }>

/**
 * Admin page to view and manage event registrations
 */
export default async function EventRegistrationsPage({ params }: { params: RouteParams }) {
  const { slug } = await params

  // Require admin role
  await requireRole('admin')

  // Fetch event by slug to get eventId
  const eventSnapshot = await adminDb.collection('events').where('slug', '==', slug).limit(1).get()

  if (eventSnapshot.empty) {
    notFound()
  }

  const eventDoc = eventSnapshot.docs[0]
  if (!eventDoc) {
    notFound()
  }

  const eventId = eventDoc.id
  const eventData = eventDoc.data() || {}
  const eventName = getEventName(eventData) || 'Event'

  // Fetch registrations and count
  let registrations: Awaited<ReturnType<typeof getEventRegistrations>> = []
  let registrationCount = 0

  try {
    registrations = await getEventRegistrations(eventId)
    registrationCount = await getEventRegistrationCount(eventId)
  } catch (error) {
    logError('Error fetching registrations', error, { eventId, eventSlug: slug })
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Event Registrations</h1>
        <p className="text-muted-foreground mt-2">
          Manage registrations for: <strong>{eventName}</strong>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Total registrations: <strong>{registrationCount}</strong>
        </p>
      </div>

      <EventRegistrationsClient
        eventId={eventId}
        eventSlug={slug}
        eventName={eventName}
        registrations={registrations}
        registrationCount={registrationCount}
      />
    </div>
  )
}

