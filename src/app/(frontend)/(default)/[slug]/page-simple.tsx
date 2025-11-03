import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

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
  // Check if we're in draft mode (for CMS preview)
  const { isEnabled: draft } = await draftMode()
  // Get the slug from the URL, defaulting to 'home' if not provided
  const { slug: _slug = 'home' } = await paramsPromise

  // TODO: Fetch page data from Firebase instead of Payload
  let page = null

  // Temporary fallback for home page if CMS data isn't available
  if (!page && _slug === 'home') {
    page = homeStatic
  }

  // If no page is found, show a 404
  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="text-gray-600 mt-4">The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    )
  }

  // Destructure the page content
  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      {/* Client-side component for interactive features */}
      <PageClient />
      {/* Handles redirects for valid pages */}
      {/* <PayloadRedirects disableNotFound url={url} /> */}

      {/* Shows live preview UI when in draft mode */}
      {draft && <LivePreviewListener />}

      {/* Render the hero section and page content blocks */}
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

/**
 * Generates metadata for the page (title, description, etc.)
 * This is used by Next.js for SEO and social sharing
 */
export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug: _slug = 'home' } = await paramsPromise
  // TODO: Fetch page data from Firebase
  const page = null

  return generateMeta({ doc: page })
}

/**
 * This function generates static paths for all pages at build time
 * It fetches all published pages from the CMS and creates routes for them
 * This enables static site generation (SSG) for better performance
 */
export async function generateStaticParams() {
  // TODO: Fetch all pages from Firebase
  // For now, return empty array
  return []
}
