import { getServerSideSitemap } from 'next-sitemap'
import { unstable_cache } from 'next/cache'
import { fetchAllPages } from '@/lib/firebase-api'

const getPagesSitemap = unstable_cache(
  async () => {
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://example.com'

    // Fetch all pages from Firebase
    const pages = await fetchAllPages()

    const dateFallback = new Date().toISOString()

    // Default static pages
    const defaultSitemap = [
      {
        loc: `${SITE_URL}/`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/search`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/posts`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/blog`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/events`,
        lastmod: dateFallback,
      },
    ]

    // Map pages to sitemap entries
    const pagesSitemap = pages
      .filter((page) => Boolean(page?.slug))
      .map((page) => {
        const slug = page.slug === 'home' ? '' : page.slug
        const lastmod = page.updatedAt || page.publishedAt || dateFallback

        return {
          loc: `${SITE_URL}/${slug}`,
          lastmod: typeof lastmod === 'string' ? lastmod : dateFallback,
        }
      })

    return [...defaultSitemap, ...pagesSitemap]
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
    revalidate: 3600, // Revalidate every hour
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()
  return getServerSideSitemap(sitemap)
}
