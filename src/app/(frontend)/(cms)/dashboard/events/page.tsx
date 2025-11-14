import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminDb } from '@/lib/firebase-admin'
import type { Event } from '@/types'

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

      const toISOString = (value: unknown): string | undefined => {
        if (!value) return undefined
        if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          return value.toDate().toISOString()
        }
        if (typeof value === 'string') return value
        return undefined
      }

      const startAt =
        data.startAt?.toDate?.() ?? (data.startAt instanceof Date ? data.startAt : null)

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
    })
  } catch (error) {
    console.error('[fetchEvents] Error:', error)
    return []
  }
}

/**
 * Formats a date string for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'TBD'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Events Management Page
 */
export default async function EventsPage() {
  const events = await fetchEvents()

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Events</h1>
        <Button asChild>
          <Link href="/dashboard/events/new">New Event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No events found.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/events/new">Create Your First Event</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <Badge variant={event.meta?.status === 'published' ? 'default' : 'secondary'}>
                    {event.meta?.status ?? 'draft'}
                  </Badge>
                </div>
                <CardDescription>
                  {event.slug ? `/${event.slug}` : ''} &middot; {formatDate(event.eventStartTime)}
                  {event.meta?.eventType && ` &middot; ${event.meta.eventType}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/events/${event.slug}`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
