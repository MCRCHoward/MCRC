import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

import { fetchPageBySlug, fetchAllPages } from '@/lib/firebase-api'
import { RenderHero } from '@/heros/RenderHero'
import { getServerSideURL } from '@/utilities/getURL'
import { Button } from '@/components/ui/button'
import { logError } from '@/utilities/error-logging'
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
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <svg
                className="h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Page Error</h1>
          <p className="mb-6 text-muted-foreground">
            This page is missing required content and cannot be displayed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="default">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
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
    logError('Error generating static params for pages', error)
    return []
  }
}
