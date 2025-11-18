import Link from 'next/link'
import { Timestamp } from 'firebase-admin/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminDb } from '@/lib/firebase-admin'
import type { Event, Post } from '@/types'
import { toISOString, toDate } from './utils/timestamp-helpers'
import { getCurrentUser } from '@/lib/custom-auth'
import { getPendingTaskCount } from '@/lib/actions/task-actions'
import { isStaff } from '@/lib/user-roles'

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

async function getInquiryStats() {
  console.log('[getInquiryStats] Starting aggregation')
  try {
    const threshold = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    console.log('[getInquiryStats] Threshold calculated', {
      thresholdIso: threshold.toDate().toISOString(),
      timestampSeconds: threshold.seconds,
    })

    const query = adminDb.collectionGroup('inquiries').where('submittedAt', '>=', threshold)
    console.log('[getInquiryStats] Query definition', {
      collectionGroup: 'inquiries',
      filters: [{ field: 'submittedAt', op: '>=', value: threshold.toDate().toISOString() }],
    })

    const snapshot = await query.get()
    console.log('[getInquiryStats] Query completed', {
      documentCount: snapshot.size,
      readTime: snapshot.readTime.toDate().toISOString(),
    })

    const statusCounts = new Map<string, number>()
    let scheduled = 0
    snapshot.forEach((doc) => {
      const status = (doc.get('status') as string | undefined) ?? 'missing'
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
      if (status === 'intake-scheduled') {
        scheduled += 1
      }
    })
    console.log('[getInquiryStats] Aggregation complete', {
      scheduledIntakes: scheduled,
      statusCounts: Object.fromEntries(statusCounts.entries()),
    })

    return {
      newInquiries: snapshot.size,
      scheduledIntakes: scheduled,
    }
  } catch (error) {
    console.error('[getInquiryStats] Error captured', {
      message: (error as Error).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
      stack: (error as Error).stack,
    })
    return { newInquiries: 0, scheduledIntakes: 0 }
  }
}

export default async function DashboardPage() {
  const pageStartTime = performance.now()
  console.log('[DASHBOARD] Page rendering started')

  const user = await getCurrentUser()
  const isStaffUser = isStaff(user?.role)
  const [recentPosts, upcomingEvents, inquiryStats, pendingTaskCount] = await Promise.all([
    (async () => {
      console.log('[DashboardPage] Fetching recent posts')
      const posts = await getRecentPosts()
      console.log('[DashboardPage] Recent posts resolved', { count: posts.length })
      return posts
    })(),
    (async () => {
      console.log('[DashboardPage] Fetching upcoming events')
      const events = await getUpcomingEvents()
      console.log('[DashboardPage] Upcoming events resolved', { count: events.length })
      return events
    })(),
    (async () => {
      console.log('[DashboardPage] Fetching inquiry stats')
      const stats = await getInquiryStats()
      console.log('[DashboardPage] Inquiry stats resolved', stats)
      return stats
    })(),
    isStaffUser && user
      ? (async () => {
          console.log('[DashboardPage] Fetching pending task count', { userId: user.id })
          const count = await getPendingTaskCount(user.id)
          console.log('[DashboardPage] Pending task count resolved', { userId: user.id, count })
          return count
        })()
      : Promise.resolve(undefined),
  ])

  console.log(`[DASHBOARD] All data fetched: ${(performance.now() - pageStartTime).toFixed(2)}ms`)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {isStaffUser && typeof pendingTaskCount === 'number' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
              <CardDescription>Work items assigned to you</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-3xl font-semibold">{pendingTaskCount}</span>
              <Button asChild variant="outline">
                <Link href="/dashboard/tasks">View tasks</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>New Inquiries (7d)</CardTitle>
            <CardDescription>Submissions across all service areas</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{inquiryStats.newInquiries}</span>
            <Button asChild variant="outline">
              <Link href="/dashboard/mediation/inquiries">View inquiries</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intakes Scheduled (7d)</CardTitle>
            <CardDescription>Cases moved to intake-scheduled</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-semibold">{inquiryStats.scheduledIntakes}</span>
            <Button asChild variant="outline">
              <Link href="/dashboard/tasks">Jump to tasks</Link>
            </Button>
          </CardContent>
        </Card>
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
