import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewsletterTable } from './NewsletterTable'
import type { NewsletterSubscriber } from '@/types/newsletter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Fetches all newsletter subscribers from Firestore, ordered by most recent subscription date
 */
async function fetchNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const snapshot = await adminDb
      .collection('newsletter')
      .orderBy('subscribedAt', 'desc')
      .get()

    if (snapshot.empty) {
      return []
    }

    const toISOString = (value: unknown): string | undefined => {
      if (!value) return undefined
      if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }
      if (typeof value === 'string') return value
      return undefined
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email || '',
        firstName: data.firstName || null,
        subscribedAt: toISOString(data.subscribedAt) || new Date().toISOString(),
        kitSubscriberId: data.kitSubscriberId || null,
        source: data.source || 'website',
      }
    })
  } catch (error) {
    console.error('[fetchNewsletterSubscribers] Error:', error)
    return []
  }
}

/**
 * Calculate subscribers count for a given time period
 */
function getSubscribersInPeriod(
  subscribers: NewsletterSubscriber[],
  days: number
): number {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return subscribers.filter((subscriber) => {
    const subscribedDate = new Date(subscriber.subscribedAt)
    return subscribedDate >= cutoffDate
  }).length
}

export default async function NewsletterPage() {
  const subscribers = await fetchNewsletterSubscribers()

  const totalSubscribers = subscribers.length
  const thisMonth = getSubscribersInPeriod(subscribers, 30)
  const thisWeek = getSubscribersInPeriod(subscribers, 7)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Newsletter</h1>
          <p className="text-muted-foreground">View and manage all newsletter subscribers</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">All time subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-xs text-muted-foreground">New subscribers this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeek}</div>
            <p className="text-xs text-muted-foreground">New subscribers this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscribers</CardTitle>
          <CardDescription>View and manage newsletter subscriber records</CardDescription>
        </CardHeader>
        <CardContent>
          <NewsletterTable subscribers={subscribers} />
        </CardContent>
      </Card>
    </div>
  )
}

