import type { Media } from './media'
import type { Post } from './post'

export interface Page {
  id: string
  title: string
  slug: string
  hero: PageHero
  layout: PageBlock[]
  meta: PageMeta
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PageHero {
  type: 'highImpact' | 'mediumImpact' | 'lowImpact' | 'none'
  title?: string
  subtitle?: string
  description?: string
  image?: string
  video?: string
  // Optional properties from previous Payload CMS structure
  links?: Array<{
    link: {
      type?: 'custom' | 'reference' | null
      url?: string | null
      label?: string | null
      newTab?: boolean | null
      reference?: {
        relationTo: 'pages' | 'posts'
        value: Page | Post | string | number
      } | null
    }
  }>
  media?: Media | string | null
  richText?: unknown // RichText component accepts unknown
}

export interface PageBlock {
  blockType: 'callToAction' | 'content' | 'mediaBlock' | 'archive' | 'form'
  [key: string]: unknown
}

export interface PageMeta {
  title?: string
  description?: string
  image?: string
}

export interface PageInput {
  title: string
  slug?: string
  hero: PageHero
  layout: PageBlock[]
  meta?: PageMeta
  publishedAt?: string
}
