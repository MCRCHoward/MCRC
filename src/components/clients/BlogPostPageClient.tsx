'use client'

import { Clock, User as UserIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { Post, Category } from '@/types'

interface BlogPostPageClientProps {
  post: Post
  categories: Category[]
}

/**
 * Helper to normalize image URLs to Firebase download URLs
 */
function normalizeImageUrl(url?: string): string | null {
  if (!url) return null
  if (url.startsWith('https://firebasestorage.googleapis.com/')) return url
  if (url.startsWith('https://storage.googleapis.com/')) {
    try {
      const urlObj = new URL(url)
      const parts = urlObj.pathname.split('/').filter(Boolean)
      const bucket = parts[0]
      const objectPath = parts.slice(1).join('/')
      if (bucket && objectPath) {
        const encodedPath = encodeURIComponent(objectPath)
        return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodedPath}?alt=media`
      }
    } catch {
      return url
    }
  }
  return url
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Calculate reading time from HTML content
 */
function calculateReadingTime(html?: string): string {
  if (!html) return '5 min'
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text.split(/\s+/).length
  const minutes = Math.ceil(words / 200) // Average reading speed: 200 words per minute
  return `${minutes} min`
}

export function BlogPostPageClient({ post, categories }: BlogPostPageClientProps) {
  const {
    title,
    heroSubHeader,
    heroBriefSummary,
    heroImage,
    contentHtml,
    sections,
    categories: categoryIds,
    publishedDateDisplay,
    readingTime,
    createdAt,
    publishedAt,
  } = post

  // Resolve category names
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))
  const postCategories = (categoryIds || [])
    .map((id) => categoryMap.get(id))
    .filter((cat): cat is Category => cat !== undefined)

  const heroImageUrl = normalizeImageUrl(heroImage)
  const displayDate = publishedDateDisplay || formatDate(publishedAt || createdAt)
  const displayReadingTime = readingTime || calculateReadingTime(contentHtml)

  return (
    <article>
      {/* Hero Section with Overlay */}
      {heroImageUrl && (
        <div className="relative mb-20">
          <div className="relative h-screen max-h-[80vh] overflow-hidden">
            <Image
              src={heroImageUrl}
              alt={title || 'Blog post hero image'}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <div className="max-w-4xl px-8">
                {heroSubHeader && (
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest opacity-90">
                    {heroSubHeader}
                  </p>
                )}
                <h1 className="mb-6 text-4xl font-bold md:text-6xl lg:text-7xl xl:text-8xl">
                  {title || 'Untitled'}
                </h1>
                {heroBriefSummary && (
                  <p className="mx-auto max-w-3xl text-lg leading-relaxed opacity-90 md:text-xl lg:text-2xl">
                    {heroBriefSummary}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Article */}
      <div className="container max-w-4xl">
        {/* Article Header */}
        <div className="mb-16 border-b pb-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="space-y-6">
              {postCategories.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {postCategories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/blog?category=${category.slug}`}
                        className="hover:underline"
                      >
                        <Badge variant="secondary">{category.name}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {displayDate && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Published Date
                  </p>
                  <p className="text-lg font-medium">{displayDate}</p>
                </div>
              )}
              {post.authorData && post.authorData.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Author{post.authorData.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <UserIcon className="h-4 w-4" />
                    <span>
                      {post.authorData.map((author) => author.name || author.email || 'Unknown').join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {displayReadingTime && (
              <div className="text-right">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reading Time
                </p>
                <div className="flex items-center justify-end gap-2 text-lg font-medium">
                  <Clock className="h-4 w-4" />
                  {displayReadingTime}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {sections && sections.length > 0 ? (
          <div className="space-y-16">
            {sections.map((section, index) => {
              const sectionImageUrl = normalizeImageUrl(section.image)
              return (
                <section
                  key={section.anchor || index}
                  id={section.anchor}
                  className="prose prose-lg dark:prose-invert max-w-none"
                >
                  {section.title && (
                    <h2 className="scroll-mt-24 text-3xl font-bold">{section.title}</h2>
                  )}
                  {sectionImageUrl && (
                    <figure className="not-prose -mx-8 my-8 sm:-mx-16">
                      <Image
                        src={sectionImageUrl}
                        alt={section.title || `Section ${index + 1} image`}
                        width={1200}
                        height={675}
                        className="w-full rounded-lg"
                      />
                      {section.title && (
                        <figcaption className="mt-4 px-8 text-center text-sm italic text-muted-foreground sm:px-16">
                          {section.title}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {section.contentHtml && (
                    <div
                      className="prose prose-lg dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: section.contentHtml }}
                    />
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <article className="prose prose-lg dark:prose-invert max-w-none">
            {contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : (
              <p className="text-muted-foreground">No content available.</p>
            )}
          </article>
        )}
      </div>
    </article>
  )
}
