import { getServerSideSitemap } from 'next-sitemap'
import { unstable_cache } from 'next/cache'
import { fetchPublishedEvents } from '@/lib/firebase-api-events'

const getEventsSitemap = unstable_cache(
  async () => {
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://example.com'

    // Fetch all published events from Firebase
    const events = await fetchPublishedEvents()

    const dateFallback = new Date().toISOString()

    // Map events to sitemap entries
    const sitemap = events
      .filter((event) => Boolean(event?.slug) && event.meta?.status === 'published')
      .map((event) => {
        const lastmod = event.updatedAt || event.createdAt || dateFallback

        return {
          loc: `${SITE_URL}/events/${event.slug}`,
          lastmod: typeof lastmod === 'string' ? lastmod : dateFallback,
        }
      })

    return sitemap
  },
  ['events-sitemap'],
  {
    tags: ['events-sitemap'],
    revalidate: 3600, // Revalidate every hour
  },
)

export async function GET() {
  const sitemap = await getEventsSitemap()
  return getServerSideSitemap(sitemap)
}
