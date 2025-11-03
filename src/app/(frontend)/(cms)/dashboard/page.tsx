// app/(frontend)/(cms)/dashboard/page.tsx
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Event, Post } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getRecentPosts(): Promise<Post[]> {
  // TODO: Implement Firebase query for recent posts
  // For now, return empty array
  return []
}

async function getUpcomingEvents(): Promise<Event[]> {
  // TODO: Implement Firebase query for upcoming events
  // For now, return empty array
  return []
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
  const [recentPosts, upcomingEvents] = await Promise.all([getRecentPosts(), getUpcomingEvents()])

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
                      <Link href={`/dashboard/posts/${post.id}`}>Edit</Link>
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
                      <Link href={`/dashboard/events/${event.id}`}>Edit</Link>
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
