import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { fetchPostBySlug, fetchPosts, fetchCategories } from '@/lib/firebase-api-blog'
import { BlogPostPageClient } from '@/components/clients/BlogPostPageClient'
import { getServerSideURL } from '@/utilities/getURL'
import { normalizeImageUrl } from '@/utilities/image-helpers'
import { logError } from '@/utilities/error-logging'

type RouteParams = Promise<{ slug: string }>

// --- SEO ---
export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params

  const post = await fetchPostBySlug(slug)
  if (!post) return { title: 'Post Not Found', robots: { index: false } }

  const title = post.title || 'Blog Post'
  const description = post.excerpt || post.heroBriefSummary || 'Blog post'
  const image = normalizeImageUrl(post.heroImage || post.metaImage)
  const canonical = `${getServerSideURL()}/blog/${encodeURIComponent(slug)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: RouteParams }) {
  const { slug } = await params

  // Fetch post and categories in parallel
  const [post, categories] = await Promise.all([fetchPostBySlug(slug), fetchCategories()])

  if (!post) return notFound()

  return <BlogPostPageClient post={post} categories={categories} />
}

export const revalidate = 60

// --- Static params generation ---
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const posts = await fetchPosts()
    return posts
      .map((post) => post.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => ({ slug }))
  } catch (error) {
    logError('Error generating static params for blog posts', error)
    return []
  }
}
