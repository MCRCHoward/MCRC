import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DeletePostButton from '@/components/Dashboard/posts/DeletePostButton'
import { adminDb } from '@/lib/firebase-admin'
import { deletePost } from './firebase-actions'
import type { Post } from '@/types'
import { toISOString } from '../utils/timestamp-helpers'

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
    // Fetch all posts and filter out deleted ones in memory
    // (Firestore doesn't support != operator with orderBy)
    const snapshot = await postsRef.orderBy('updatedAt', 'desc').limit(50).get()

    if (snapshot.empty) {
      return []
    }

    // Filter out soft-deleted posts and limit to 20
    const posts = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data()


        return {
          id: docSnapshot.id,
          ...data,
          // Ensure timestamps are strings
          createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
          updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
          publishedAt: toISOString(data.publishedAt),
        } as Post
      })
      .filter((post) => post._status !== 'deleted')
      .slice(0, 20)

    return posts
  } catch (error) {
    console.error('[fetchBlogPosts] Error:', error)
    return []
  }
}

export default async function BlogPage() {
  const blogPosts = await fetchBlogPosts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground">View and manage all blog posts</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/new">New Blog Post</Link>
        </Button>
      </div>

      <div className="grid gap-3">
        {blogPosts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex-1">
              <div className="font-medium text-card-foreground">{post.title ?? '(untitled)'}</div>
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
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No blog posts yet.</p>
          </div>
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
