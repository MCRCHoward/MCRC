import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'MCRC Howard'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'MCRC Howard County - Mediation, Facilitation, and Restorative Justice Services',
  images: [
    {
      url: `${getServerSideURL()}/website-template-OG.webp`,
    },
  ],
  siteName,
  title: siteName,
}

/**
 * Merges custom Open Graph metadata with default values.
 * Custom images will override default images if provided.
 *
 * @param og - Custom Open Graph metadata to merge
 * @returns Merged Open Graph metadata
 */
export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  // Check if custom images are provided (can be single object or array)
  const hasCustomImages = og?.images && (Array.isArray(og.images) ? og.images.length > 0 : true)

  return {
    ...defaultOpenGraph,
    ...og,
    images: hasCustomImages ? og.images : defaultOpenGraph.images,
  }
}
