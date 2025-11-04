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
  type: 'highImpact' | 'mediumImpact' | 'lowImpact'
  title?: string
  subtitle?: string
  description?: string
  image?: string
  video?: string
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
