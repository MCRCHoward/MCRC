import { fetchFeaturedPost, fetchPosts, fetchCategories } from '@/lib/firebase-api-blog'
import type { Post, Category } from '@/types'
import { default as BlogPageClient } from '@/components/clients/BlogPageClient'
import { verifyAdminSDKInitialization, healthCheckAdminSDK } from '@/lib/firebase-admin'

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

/**
 * Validates post data structure before transformation
 */
function validatePostData(post: Post): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!post.id || typeof post.id !== 'string') {
    errors.push('Missing or invalid id')
  }
  if (!post.slug || typeof post.slug !== 'string') {
    errors.push('Missing or invalid slug')
  }
  if (!post.title || typeof post.title !== 'string') {
    errors.push('Missing or invalid title')
  }
  if (!post._status || typeof post._status !== 'string') {
    errors.push('Missing or invalid _status')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export default async function BlogPage() {
  // Fetch everything on the server
  let featured = null,
    posts: Post[] = [],
    categories: Category[] = []

  const startTime = Date.now()
  let initializationCheck: ReturnType<typeof verifyAdminSDKInitialization> | null = null

  try {
    // Verify Admin SDK initialization (both dev and production)
    initializationCheck = verifyAdminSDKInitialization()

    if (!initializationCheck.initialized) {
      const errorMessage = `Admin SDK initialization failed: ${initializationCheck.errors.join(', ')}`
      if (process.env.NODE_ENV !== 'production') {
        console.error('[BlogPage]', errorMessage)
      } else {
        // In production, log without exposing sensitive details
        console.error('[BlogPage] Admin SDK initialization failed. Check environment variables.')
      }
      // Continue execution - let individual fetch functions handle errors
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, run health check for diagnostics
      const healthCheck = await healthCheckAdminSDK()
      if (!healthCheck.healthy) {
        console.warn('[BlogPage] Admin SDK health check failed:', healthCheck.error)
      }
    }

    // Fetch data with individual error handling
    const fetchResults = await Promise.allSettled([
      fetchFeaturedPost(),
      fetchPosts(),
      fetchCategories(),
    ])

    // Process fetch results with detailed error logging
    if (fetchResults[0].status === 'fulfilled') {
      featured = fetchResults[0].value
    } else {
      const error = fetchResults[0].reason
      console.error('[BlogPage] Error fetching featured post:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    }

    if (fetchResults[1].status === 'fulfilled') {
      posts = fetchResults[1].value
    } else {
      const error = fetchResults[1].reason
      console.error('[BlogPage] Error fetching posts:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    }

    if (fetchResults[2].status === 'fulfilled') {
      categories = fetchResults[2].value
    } else {
      const error = fetchResults[2].reason
      console.error('[BlogPage] Error fetching categories:', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    }

    // Validate fetched data
    const invalidPosts = posts.filter((post) => !validatePostData(post).valid)
    if (invalidPosts.length > 0 && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[BlogPage] Found invalid posts:',
        invalidPosts.map((p) => ({
          id: p.id,
          errors: validatePostData(p).errors,
        })),
      )
    }

    // Log warnings for empty results with actionable guidance
    if (posts.length === 0) {
      const warningMessage = '[BlogPage] No posts fetched. Possible issues:'
      const possibleIssues = [
        'No posts with _status="published" in Firestore',
        'Missing Firestore indexes (check firestore.indexes.json)',
        'Admin SDK connection issues',
        'Posts missing required fields (id, slug, _status, title)',
      ]

      if (process.env.NODE_ENV !== 'production') {
        console.warn(warningMessage)
        possibleIssues.forEach((issue) => console.warn(`  - ${issue}`))
      } else {
        // Production: log a single concise warning
        console.warn('[BlogPage] No posts available. Check Firestore data and indexes.')
      }
    }

    // Log warnings for missing categories
    if (categories.length === 0 && process.env.NODE_ENV !== 'production') {
      console.warn('[BlogPage] No categories fetched. This may affect post categorization.')
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      errorStack:
        process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      postsFetched: posts.length,
      categoriesFetched: categories.length,
      adminSDKStatus: initializationCheck
        ? {
            initialized: initializationCheck.initialized,
            hasProjectId: initializationCheck.hasProjectId,
            hasClientEmail: initializationCheck.hasClientEmail,
            hasPrivateKey: initializationCheck.hasPrivateKey,
            errorCount: initializationCheck.errors.length,
          }
        : 'not checked',
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('[BlogPage] Fatal error fetching blog data:', errorDetails)
    } else {
      // Production: log without stack traces
      console.error('[BlogPage] Error fetching blog data:', {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`,
        postsFetched: posts.length,
        categoriesFetched: categories.length,
      })
    }
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
