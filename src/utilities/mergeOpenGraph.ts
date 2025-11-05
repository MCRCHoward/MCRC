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

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
