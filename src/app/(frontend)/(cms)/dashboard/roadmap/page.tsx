import { adminDb } from '@/lib/firebase-admin'
import { getCurrentUser } from '@/lib/custom-auth'
import type { RoadmapItem, Recommendation } from '@/types'
import RoadmapClient from './RoadmapClient'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Helper to convert Firestore Timestamp to ISO string
 */
function toISOString(value: unknown): string | undefined {
  if (!value) return undefined
  // Firestore Timestamp has toDate() method
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString()
  }
  // Already a string
  if (typeof value === 'string') return value
  return undefined
}

/**
 * Fetches all roadmap items from Firestore, ordered by order (descending).
 * Filters out completed items.
 */
async function fetchRoadmapItems(): Promise<RoadmapItem[]> {
  try {
    const snapshot = await adminDb
      .collection('roadmapItems')
      .orderBy('order', 'desc')
      .get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs
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
      .filter((item) => !item.completed) // Filter out completed items
  } catch (error) {
    console.error('[fetchRoadmapItems] Error:', error)
    return []
  }
}

/**
 * Fetches all recommendations from Firestore, ordered by submittedAt (descending).
 * Filters out deleted recommendations.
 */
async function fetchRecommendations(): Promise<Recommendation[]> {
  try {
    const snapshot = await adminDb
      .collection('recommendations')
      .orderBy('submittedAt', 'desc')
      .get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          submittedBy: data.submittedBy || '',
          submittedByName: data.submittedByName || 'Anonymous',
          submittedAt: toISOString(data.submittedAt) || new Date().toISOString(),
          status: data.status || 'pending',
          acceptedAt: toISOString(data.acceptedAt),
          acceptedBy: data.acceptedBy,
          order: data.order || 0,
        } as Recommendation
      })
      .filter((rec) => rec.status !== 'deleted')
      .sort((a, b) => {
        // Accepted items go to the end (highest order)
        if (a.status === 'accepted' && b.status !== 'accepted') return 1
        if (a.status !== 'accepted' && b.status === 'accepted') return -1
        // Within same status, sort by order
        return b.order - a.order
      })
  } catch (error) {
    console.error('[fetchRecommendations] Error:', error)
    return []
  }
}

export default async function RoadmapPage() {
  const [roadmapItems, recommendations, user] = await Promise.all([
    fetchRoadmapItems(),
    fetchRecommendations(),
    getCurrentUser(),
  ])

  const isAdmin = user?.role === 'admin'

  return (
    <RoadmapClient
      roadmapItems={roadmapItems}
      recommendations={recommendations}
      isAdmin={isAdmin}
      currentUserId={user?.id}
    />
  )
}

