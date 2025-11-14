import { adminDb } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/custom-auth'
import type { RoadmapItem } from '@/types'
import { toISOString } from '../../utils/timestamp-helpers'
import RoadmapTimeline from '@/components/Dashboard/RoadmapTimeline'
import { isAdmin } from '@/lib/user-roles'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'


/**
 * Fetches all completed roadmap items from Firestore, ordered by completedAt (descending).
 */
async function fetchCompletedRoadmapItems(): Promise<RoadmapItem[]> {
  try {
    // Get all items and filter in memory to avoid index requirements
    const snapshot = await adminDb
      .collection('roadmapItems')
      .orderBy('order', 'desc')
      .get()

    if (snapshot.empty) {
      return []
    }

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          version: data.version || '',
          type: data.type || 'Feature',
          title: data.title || '',
          description: data.description || '',
          date: toISOString(data.date) || new Date().toISOString(),
          createdAt: toISOString(data.createdAt) || new Date().toISOString(),
          createdBy: data.createdBy || '',
          order: data.order || 0,
          completed: data.completed || false,
          completedAt: toISOString(data.completedAt),
          completedBy: data.completedBy,
        } as RoadmapItem
      })
      .filter((item) => item.completed === true) // Filter for completed items
      .sort((a, b) => {
        // Sort by completedAt descending (most recent first)
        if (!a.completedAt && !b.completedAt) return 0
        if (!a.completedAt) return 1
        if (!b.completedAt) return -1
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      })

    return items
  } catch (error) {
    console.error('[fetchCompletedRoadmapItems] Error:', error)
    return []
  }
}

export default async function CompletedRoadmapPage() {
  const [completedItems, user] = await Promise.all([
    fetchCompletedRoadmapItems(),
    getCurrentUser(),
  ])

  const userIsAdmin = isAdmin(user?.role)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Completed Roadmap Items</h1>
        <p className="text-muted-foreground">
          View all completed roadmap items and features
        </p>
      </div>

      <section>
        {completedItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No completed roadmap items yet.</p>
          </div>
        ) : (
          <RoadmapTimeline items={completedItems} isAdmin={userIsAdmin} />
        )}
      </section>
    </div>
  )
}

