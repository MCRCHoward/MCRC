import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminDb } from '@/lib/firebase-admin'
import type { Event, Post } from '@/types'
import { toISOString, toDate } from './utils/timestamp-helpers'

// Server-side rendering configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Fetches the 3 most recently updated blog posts
 */
async function getRecentPosts(): Promise<Post[]> {
  const startTime = performance.now()
  console.log('[DASHBOARD] Fetching recent posts')

  try {
    const snapshot = await adminDb.collection('posts').orderBy('updatedAt', 'desc').limit(3).get()
    console.log(
      `[DASHBOARD] Posts fetched: ${(performance.now() - startTime).toFixed(2)}ms (${snapshot.size} docs)`,
    )

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id,
        title: data.title ?? '',
        slug: data.slug ?? '',
        contentHtml: data.contentHtml ?? data.content ?? '',
        excerpt: data.excerpt ?? '',
        heroImage: data.heroImage ?? '',
        authors: Array.isArray(data.authors) ? data.authors : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        _status: data._status ?? 'draft',
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
        publishedAt: toISOString(data.publishedAt),
      } as Post
    })
  } catch (error) {
    console.error('[getRecentPosts] Error:', error)
    return []
  }
}

/**
 * Fetches the 3 upcoming events (events with startAt in the future)
 */
async function getUpcomingEvents(): Promise<Event[]> {
  const startTime = performance.now()
  console.log('[DASHBOARD] Fetching upcoming events')

  try {
    const now = new Date()
    const snapshot = await adminDb
      .collection('events')
      .where('status', '==', 'published')
      .where('listed', '==', true)
      .orderBy('startAt', 'asc')
      .limit(3)
      .get()
    console.log(
      `[DASHBOARD] Events fetched: ${(performance.now() - startTime).toFixed(2)}ms (${snapshot.size} docs)`,
    )

    if (snapshot.empty) {
      return []
    }

    const events: Event[] = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const startAt = toDate(data.startAt)

      // Only include future events
      if (startAt && startAt > now) {
        const endAt = toDate(data.endAt) || startAt
        events.push({
          id: doc.id,
          name: data.title || '',
          slug: data.slug || doc.id,
          eventStartTime: startAt.toISOString(),
          eventEndTime: endAt.toISOString(),
          modality: data.isOnline ? 'online' : 'in_person',
          meta: {
            slug: data.slug || doc.id,
            status: data.status === 'published' ? 'published' : 'draft',
            eventType: data.category || data.format,
          },
          createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
          updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
        } as Event)
      }
    }

    return events.slice(0, 3)
  } catch (error) {
    console.error('[getUpcomingEvents] Error:', error)
    return []
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const pageStartTime = performance.now()
  console.log('[DASHBOARD] Page rendering started')

  const [recentPosts, upcomingEvents] = await Promise.all([getRecentPosts(), getUpcomingEvents()])

  console.log(`[DASHBOARD] All data fetched: ${(performance.now() - pageStartTime).toFixed(2)}ms`)

  return (
    <>
      {/* Quick tiles */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* ... your quick cards (Manage Events, Manage Blog Posts, etc.) ... */}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Posts card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Blog Posts</CardTitle>
            <CardDescription>The last 3 posts created or updated.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.length ? (
                recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {formatDate(post.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      className={
                        post._status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {post._status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="ml-2">
                      <Link href={`/dashboard/blog/${post.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No posts found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events card */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>The next 3 events on the calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Starts: {formatDate(event.eventStartTime)}
                      </p>
                    </div>
                    <Badge
                      className={
                        event.meta?.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {event.meta?.status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="ml-2">
                      <Link href={`/dashboard/events/${event.slug}`}>Edit</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
