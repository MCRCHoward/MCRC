import type { Metadata } from 'next'

import type { Media, Page, Post } from '@/types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

/**
 * Extracts and normalizes image URL from various formats.
 * Handles Firebase Media objects, absolute URLs, and relative paths.
 *
 * @param image - Media object, string URL, or null
 * @returns Normalized image URL
 */
const getImageURL = (image?: Media | string | null): string => {
  const serverUrl = getServerSideURL()
  const defaultImage = `${serverUrl}/website-template-OG.webp`

  if (!image) {
    return defaultImage
  }

  if (typeof image === 'object' && 'url' in image && image.url) {
    // Firebase Media type has url property
    const imageUrl = image.url
    // Handle both absolute and relative URLs
    return imageUrl.startsWith('http')
      ? imageUrl
      : `${serverUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
  }

  if (typeof image === 'string') {
    // If image is a string URL, use it directly if absolute, otherwise prepend server URL
    return image.startsWith('http')
      ? image
      : `${serverUrl}${image.startsWith('/') ? '' : '/'}${image}`
  }

  return defaultImage
}

/**
 * Generates Next.js metadata for a Page or Post document.
 * Handles different meta structures between Page and Post types.
 *
 * @param args - Arguments object
 * @param args.doc - The Page or Post document (can be partial or null)
 * @returns Promise resolving to Next.js Metadata object
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'MCRC Howard'

  if (!doc) {
    return {
      title: siteName,
      description: '',
      openGraph: mergeOpenGraph({
        title: siteName,
        description: '',
      }),
    }
  }

  // Handle different meta structures for Page vs Post
  const isPage = 'meta' in doc && doc.meta
  const isPost = 'heroImage' in doc || 'metaImage' in doc

  // Determine the image to use for Open Graph
  let imageSource: Media | string | null = null

  if (isPage && doc.meta && 'image' in doc.meta) {
    imageSource = (doc.meta as { image?: Media | string | null }).image ?? null
  } else if (isPost && 'heroImage' in doc) {
    imageSource = (doc.heroImage as Media | string | null) ?? null
  } else if (isPost && 'metaImage' in doc) {
    imageSource = (doc.metaImage as Media | string | null) ?? null
  }

  const ogImage = getImageURL(imageSource)

  // Extract title and description based on document type
  const metaTitle = (isPage && doc.meta?.title ? doc.meta.title : doc.title) || ''
  const metaDescription = (isPage && doc.meta?.description) || (isPost && doc.excerpt) || ''
  const title = metaTitle ? `${metaTitle} | ${siteName}` : siteName

  // Handle slug - Page has slug as string, Post also has slug as string
  const slug = doc.slug || ''
  const url = slug && slug !== 'home' ? `/${slug}` : '/'

  return {
    description: metaDescription,
    openGraph: mergeOpenGraph({
      description: metaDescription,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url,
    }),
    title,
  }
}
