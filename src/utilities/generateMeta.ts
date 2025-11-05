import type { Metadata } from 'next'

import type { Media, Page, Post } from '@/types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | string | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    // Firebase Media type has url property
    url = serverUrl + image.url
  } else if (typeof image === 'string') {
    // If image is a string URL, use it directly
    url = image.startsWith('http') ? image : serverUrl + image
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  if (!doc) {
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'MCRC Howard'
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

  const ogImage = getImageURL(
    isPage && doc.meta && 'image' in doc.meta
      ? (doc.meta as { image?: Media | string | null }).image
      : isPost && 'heroImage' in doc
        ? (doc.heroImage as Media | string | null)
        : isPost && 'metaImage' in doc
          ? (doc.metaImage as Media | string | null)
          : null,
  )

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'MCRC Howard'
  const metaTitle = isPage && doc.meta?.title ? doc.meta.title : doc.title || ''
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
