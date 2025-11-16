/**
 * Image URL Normalization Utilities
 *
 * Converts various image URL formats to Firebase Storage download URLs.
 * Firebase download URLs honor Storage rules, unlike raw GCS URLs.
 *
 * Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
 */

const FALLBACK_THUMB = 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg'

/**
 * Get bucket name from environment variable
 */
function getBucket(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''
}

/**
 * Convert various image URL formats to Firebase Storage download URL.
 * Supports:
 * - Firebase Storage URLs (returns as-is)
 * - Google Cloud Storage URLs (converts to Firebase format)
 * - Path-based URLs with known prefixes (blog/media/, events/media/, trainings/media/)
 * - CloudFront and other CDN URLs (returns as-is)
 *
 * @param input - Image URL (string, object with url property, or undefined)
 * @param fallback - Optional fallback URL (defaults to placeholder)
 * @returns Normalized Firebase Storage download URL or fallback
 */
export function normalizeToFirebaseDownloadURL(
  input?: unknown,
  fallback: string = FALLBACK_THUMB,
): string {
  if (!input) return fallback

  // Handle object with url property
  if (typeof input === 'object' && input !== null && 'url' in input) {
    const u = (input as { url?: string }).url
    if (u) return normalizeToFirebaseDownloadURL(u, fallback)
  }

  if (typeof input !== 'string' || input.length < 4) return fallback

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

    const bucket = getBucket()
    if (objectPath && bucket) {
      const encodedPath = encodeURIComponent(objectPath)
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedPath}?alt=media`
    }

    // Otherwise, return the original URL (could be CloudFront, etc.)
    return input
  } catch {
    return fallback
  }
}

/**
 * Normalize image URL for metadata/SEO purposes.
 * Returns undefined if no URL is provided (for optional image fields).
 *
 * @param url - Image URL string or undefined
 * @returns Normalized Firebase Storage URL or undefined
 */
export function normalizeImageUrl(url?: string): string | undefined {
  if (!url) return undefined
  const normalized = normalizeToFirebaseDownloadURL(url, url)
  return normalized === FALLBACK_THUMB ? undefined : normalized
}

