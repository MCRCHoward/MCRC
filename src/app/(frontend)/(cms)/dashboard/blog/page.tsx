import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DeletePostButton from '@/components/Dashboard/posts/DeletePostButton'
import { adminDb } from '@/lib/firebase-admin'
import { deletePost } from './firebase-actions'
import type { Post } from '@/types'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches all blog posts from Firestore, ordered by most recently updated.
 * Uses Firebase Admin SDK for server-side access.
 */
async function fetchBlogPosts(): Promise<Post[]> {
  try {
    const postsRef = adminDb.collection('posts')
    const snapshot = await postsRef.orderBy('updatedAt', 'desc').limit(20).get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data()

      // Helper to convert Firestore Timestamp to ISO string
      const toISOString = (value: unknown): string | undefined => {
        if (!value) return undefined
        // Firestore Timestamp has toDate() method
        if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          return value.toDate().toISOString()
        }
        // Already a string
        if (typeof value === 'string') return value
        return undefined
      }

      return {
        id: docSnapshot.id,
        ...data,
        // Ensure timestamps are strings
        createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
        updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
        publishedAt: toISOString(data.publishedAt),
      } as Post
    })
  } catch (error) {
    console.error('[fetchBlogPosts] Error:', error)
    return []
  }
}

export default async function BlogPage() {
  const blogPosts = await fetchBlogPosts()

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog</h1>
        <Button asChild>
          <Link href="/dashboard/blog/new">New Blog Post</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {blogPosts.map((post) => (
          <div key={post.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium">{post.title ?? '(untitled)'}</div>
              <div className="text-sm text-muted-foreground">
                {post.slug ? `/${post.slug}` : ''} &middot; <StatusBadge status={post._status} />{' '}
                &middot; {post.updatedAt?.slice(0, 10)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/blog/${post.id}/edit`}>Edit</Link>
              </Button>

              {/* Delete: bind the id so the server action receives it */}
              <DeletePostButton
                action={deletePost.bind(null, String(post.id))}
                title={post.title ?? post.slug ?? 'this blog post'}
              />
            </div>
          </div>
        ))}
        {blogPosts.length === 0 && (
          <div className="text-sm text-muted-foreground">No blog posts yet.</div>
        )}
      </div>
    </div>
  )
}

/**
 * Status badge component for post status
 */
function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge variant={status === 'published' ? 'default' : 'secondary'}>{status ?? 'draft'}</Badge>
  )
}
