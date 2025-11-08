export interface Post {
  id: string
  slug: string
  excerpt?: string
  contentHtml: string
  sections?: PostSection[]
  heroImage?: string
  metaImage?: string
  authors: string[] // User IDs
  authorData?: Array<{ id: string; name: string; email: string }> // Populated author information
  categories: string[] // Category IDs
  _status: 'draft' | 'published' | 'deleted'
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
  _status: 'draft' | 'published' | 'deleted'
  publishedAt?: string
  title?: string
  heroSubHeader?: string
  heroBriefSummary?: string
  // Blog post outline metadata
  readingTime?: string
  publishedDateDisplay?: string // Month Year format
  featured?: boolean // Whether this post should be featured on the blog listing page
}
