import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { fetchPageBySlug, fetchAllPages } from '@/lib/firebase-api'
import { RenderHero } from '@/heros/RenderHero'
import { getServerSideURL } from '@/utilities/getURL'
import PageClient from './page.client'
import type { Page } from '@/types'

// Type definition for the page component props
type Args = {
  params: Promise<{
    slug?: string
  }>
}

/**
 * Main page component that renders dynamic pages based on the URL slug
 * This is a Server Component that handles data fetching and rendering
 */
export default async function Page({ params: paramsPromise }: Args) {
  // Get the slug from the URL, defaulting to 'home' if not provided
  const { slug = 'home' } = await paramsPromise

  // Fetch page data from Firebase
  const page = await fetchPageBySlug(slug)

  // If no page is found, show a 404
  if (!page) {
    return notFound()
  }

  // Ensure page has required fields
  if (!page.hero || !page.layout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">Page Error</h1>
        <p className="text-gray-600 mt-4">This page is missing required content.</p>
      </div>
    )
  }

  // Destructure the page content
  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      {/* Client-side component for interactive features */}
      <PageClient />

      {/* Render the hero section */}
      <RenderHero {...hero} />

      {/* Render page content blocks */}
      {layout && layout.length > 0 && (
        <div className="container max-w-7xl">
          {layout.map((block, index) => {
            // TODO: Implement block rendering based on blockType
            // For now, render a placeholder
            return (
              <div key={index} className="my-8">
                <pre className="text-xs bg-muted p-4 rounded">
                  Block type: {block.blockType || 'unknown'}
                </pre>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

/**
 * Generates metadata for the page (title, description, etc.)
 * This is used by Next.js for SEO and social sharing
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  const page = await fetchPageBySlug(slug)

  if (!page) {
    return {
      title: 'Page Not Found',
      robots: { index: false },
    }
  }

  const title = page.meta?.title || page.title || 'Page'
  const description = page.meta?.description || ''
  const image = page.meta?.image || page.hero?.image
  const canonical = `${getServerSideURL()}/${slug === 'home' ? '' : slug}`

  return {
    title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Website'}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export const revalidate = 60

/**
 * This function generates static paths for all pages at build time
 * It fetches all published pages from Firebase and creates routes for them
 * This enables static site generation (SSG) for better performance
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const pages = await fetchAllPages()
    return pages
      .map((page) => page.slug)
      .filter(
        (slug): slug is string => typeof slug === 'string' && slug.length > 0 && slug !== 'home',
      )
      .map((slug) => ({ slug }))
  } catch (error) {
    console.error('Error generating static params for pages:', error)
    return []
  }
}
