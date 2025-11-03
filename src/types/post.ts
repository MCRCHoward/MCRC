export interface Post {
  id: string
  slug: string
  excerpt?: string
  contentHtml: string
  sections?: PostSection[]
  heroImage?: string
  metaImage?: string
  authors: string[] // User IDs
  categories: string[] // Category IDs
  _status: 'draft' | 'published'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  title?: string
  heroSubHeader?: string
  heroBriefSummary?: string
  // Blog post outline metadata
  readingTime?: string
  publishedDateDisplay?: string // Month Year format
  featured?: boolean // Whether this post should be featured on the blog listing page
}

export interface PostSection {
  title: string
  heroSubHeader?: string
  heroBriefSummary?: string
  contentHtml: string
  image?: string
  anchor: string
}

export interface PostInput {
  slug?: string
  excerpt?: string
  contentHtml?: string
  sections?: PostSection[]
  heroImage?: string
  metaImage?: string
  authors: string[]
  categories: string[]
  _status: 'draft' | 'published'
  publishedAt?: string
  title?: string
  heroSubHeader?: string
  heroBriefSummary?: string
  // Blog post outline metadata
  readingTime?: string
  publishedDateDisplay?: string // Month Year format
  featured?: boolean // Whether this post should be featured on the blog listing page
}
