import { fetchFeaturedPost, fetchPosts, fetchCategories } from '@/lib/firebase-api-blog'
import type { Post, Category } from '@/types'
import { default as BlogPageClient } from '@/components/clients/BlogPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Use the same shape your client UI expects
export type CardPost = {
  category: string
  title: string
  summary: string
  link: string
  cta: string
  thumbnail: string
}

type UIHelperCategory = { label: string; value: string }
type UIBreadcrumbItem = { label: string; link: string }

const FALLBACK_THUMB = 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg'

// Get bucket name from environment variable
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

/**
 * Convert various image URL formats to Firebase Storage download URL.
 * Firebase download URLs honor Storage rules, unlike raw GCS URLs.
 *
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
 */
function normalizeToFirebaseDownloadURL(input?: unknown): string {
  if (!input) return FALLBACK_THUMB

  // Handle object with url property
  if (typeof input === 'object' && input && 'url' in input) {
    const u = (input as { url?: string }).url
    if (u) return normalizeToFirebaseDownloadURL(u)
  }

  if (typeof input !== 'string' || input.length < 4) return FALLBACK_THUMB

  // Already a Firebase download endpoint
  if (input.startsWith('https://firebasestorage.googleapis.com/')) {
    return input
  }

  try {
    // Raw GCS URL → storage.googleapis.com/<bucket>/<objectPath>
    if (input.startsWith('https://storage.googleapis.com/')) {
      const url = new URL(input)
      // pathname like "/<bucket>/<objectPath...>"
      const parts = url.pathname.split('/').filter(Boolean)
      const bucket = parts[0]
      const objectPath = parts.slice(1).join('/')
      if (bucket && objectPath) {
        const encodedPath = encodeURIComponent(objectPath)
        return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedPath}?alt=media`
      }
    }

    // If the string includes a known path prefix (e.g., ".../blog/media/..."),
    // rebuild using our configured bucket.
    const BLOG_PREFIX = '/blog/media/'
    const EVENTS_PREFIX = '/events/media/'
    const TRAININGS_PREFIX = '/trainings/media/'

    let objectPath: string | null = null
    if (input.includes(BLOG_PREFIX)) {
      const idx = input.indexOf(BLOG_PREFIX)
      objectPath = input.slice(idx + 1) // drop leading slash
    } else if (input.includes(EVENTS_PREFIX)) {
      const idx = input.indexOf(EVENTS_PREFIX)
      objectPath = input.slice(idx + 1)
    } else if (input.includes(TRAININGS_PREFIX)) {
      const idx = input.indexOf(TRAININGS_PREFIX)
      objectPath = input.slice(idx + 1)
    }

    if (objectPath && BUCKET) {
      const encodedPath = encodeURIComponent(objectPath)
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(BUCKET)}/o/${encodedPath}?alt=media`
    }

    // Otherwise, return the original URL (could be CloudFront, etc.)
    return input
  } catch {
    return FALLBACK_THUMB
  }
}

function toUICategories(docs: Category[]): UIHelperCategory[] {
  const cats = docs.map((c) => ({
    label: c.name || c.slug || 'Uncategorized',
    value: (c.name || c.slug || 'uncategorized').toLowerCase(), // client filter uses lower-cased values
  }))
  // Ensure "All" at the front
  return [{ label: 'All', value: 'all' }, ...cats]
}

export default async function BlogPage() {
  // Fetch everything on the server
  let featured = null,
    posts: Post[] = [],
    categories: Category[] = []

  const startTime = Date.now()

  try {
    // Verify Admin SDK initialization in development
    if (process.env.NODE_ENV !== 'production') {
      const { verifyAdminSDKInitialization } = await import('@/lib/firebase-admin')
      const initStatus = verifyAdminSDKInitialization()
      if (!initStatus.initialized) {
        console.error('[BlogPage] Admin SDK initialization failed:', initStatus.errors)
      }
    }

    ;[featured, posts, categories] = await Promise.all([
      fetchFeaturedPost(),
      fetchPosts(),
      fetchCategories(),
    ])

    const duration = Date.now() - startTime

    if (process.env.NODE_ENV !== 'production') {
      console.log('[BlogPage] Data fetched:', {
        featured: featured ? featured.title : 'none',
        postsCount: posts.length,
        categoriesCount: categories.length,
        duration: `${duration}ms`,
      })
    }

    // Log warnings for empty results
    if (posts.length === 0 && process.env.NODE_ENV !== 'production') {
      console.warn('[BlogPage] No posts fetched. Possible issues:')
      console.warn('  - No posts with _status="published" in Firestore')
      console.warn('  - Missing Firestore indexes (check firestore.indexes.json)')
      console.warn('  - Admin SDK connection issues')
      console.warn('  - Posts missing required fields (id, slug, _status, title)')
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[BlogPage] Error fetching blog data:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      postsFetched: posts.length,
      categoriesFetched: categories.length,
    })
  }

  // Create a category map for efficient lookups
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))

  // Update toCardPost to use category map
  const toCardPostWithCategories = (p: Post): CardPost | null => {
    // Validate required fields
    if (!p.slug || typeof p.slug !== 'string') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BlogPage] Post missing slug, filtering out:', {
          id: p.id,
          title: p.title,
        })
      }
      return null
    }

    const firstCategoryId =
      Array.isArray(p.categories) && p.categories[0] ? String(p.categories[0]) : null

    const categoryLabel =
      firstCategoryId && categoryMap.has(firstCategoryId)
        ? categoryMap.get(firstCategoryId)!.name ||
          categoryMap.get(firstCategoryId)!.slug ||
          'Uncategorized'
        : 'Uncategorized'

    // Normalize heroImage to Firebase download URL (honors Firebase Storage rules)
    const thumbnail = normalizeToFirebaseDownloadURL(p.heroImage) || FALLBACK_THUMB

    return {
      category: categoryLabel,
      title: p.title || 'Untitled',
      summary: p.excerpt || '',
      link: `/blog/${p.slug}`,
      cta: 'Read article',
      thumbnail,
    }
  }

  // Build the card lists
  const featuredCard = featured ? toCardPostWithCategories(featured) : null
  const postCards = (posts || []).map(toCardPostWithCategories).filter(Boolean) as CardPost[]

  // If there’s no explicit featured card, use the first post as a fallback for the hero
  const primaryCard = featuredCard ?? postCards[0] ?? null
  const restCards = featuredCard ? postCards : postCards.slice(1)

  const uiCategories = toUICategories(categories || [])

  const breadcrumb: UIBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Blog', link: '/blog' },
  ]

  return (
    <BlogPageClient
      featured={primaryCard}
      posts={restCards}
      categories={uiCategories}
      breadcrumb={breadcrumb}
    />
  )
}
