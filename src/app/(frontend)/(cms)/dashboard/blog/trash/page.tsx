import { adminDb } from '@/lib/firebase-admin'
import type { Post } from '@/types'
import { TrashPageClient } from './TrashPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches deleted blog posts (posts with _status === 'deleted' or soft-deleted)
 */
async function fetchDeletedPosts(): Promise<Post[]> {
  try {
    // Note: This assumes you have a soft-delete mechanism
    // If you're using hard deletes, this query won't work
    // You may need to implement a separate 'deletedPosts' collection or use a _status field
    const snapshot = await adminDb
      .collection('posts')
      .where('_status', '==', 'deleted')
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get()

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

      return {
        id: doc.id,
        ...data,
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
        publishedAt: toISOString(data.publishedAt),
      } as Post
    })
  } catch (error) {
    console.error('[fetchDeletedPosts] Error:', error)
    return []
  }
}

/**
 * Trash Page - Shows deleted blog posts
 *
 * Allows restoration or permanent deletion of posts.
 */
export default async function BlogTrashPage() {
  const deletedPosts = await fetchDeletedPosts()

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Trash</h1>
        <p className="text-sm text-muted-foreground">
          {deletedPosts.length} {deletedPosts.length === 1 ? 'post' : 'posts'} in trash
        </p>
      </div>

      <TrashPageClient deletedPosts={deletedPosts} />
    </div>
  )
}
