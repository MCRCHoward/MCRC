export interface CategoryBlogPost {
  id: string // Post ID
  author: string // User ID who created the post
  title: string // Post title
  url: string // URL to the blog post (/blog/{slug})
  heroImage?: string // URL to the hero image
  createdAt: string // ISO date string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent?: string // Parent category ID
  createdAt: string
  updatedAt: string
  blogPosts?: CategoryBlogPost[] // Array of blog posts in this category
}

export interface CategoryInput {
  name: string
  slug?: string
  description?: string
  parent?: string
}
