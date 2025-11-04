import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Clock, User as UserIcon } from 'lucide-react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Post } from '@/types'

/**
 * Calculate reading time from HTML content
 * Average reading speed: 200 words per minute
 */
function calculateReadingTime(html?: string): string {
  if (!html) return '1 min'
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min`
}

/**
 * Format date string to readable format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

interface BlogPostCardProps {
  post: Post
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const {
    slug,
    title,
    heroImage,
    contentHtml,
    readingTime,
    publishedAt,
    createdAt,
    excerpt,
    heroBriefSummary,
  } = post

  // Calculate reading time: use stored value or calculate from content
  const displayReadingTime = readingTime || calculateReadingTime(contentHtml)

  // Format date
  const displayDate = formatDate(publishedAt || createdAt)

  // Blog post URL
  const blogUrl = `/blog/${slug}`

  // Image alt text
  const imageAlt = title || 'Blog post image'

  // Description: use excerpt or hero brief summary
  const description = excerpt || heroBriefSummary

  return (
    <Card className="flex flex-col overflow-hidden border-0 shadow-none">
      <div className="overflow-hidden rounded-xl">
        <Link href={blogUrl} className="block">
          <div className="aspect-[16/9] w-full overflow-hidden">
            {heroImage && typeof heroImage === 'string' && (
              <Image
                src={heroImage}
                alt={imageAlt}
                width={600}
                height={340}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            )}
          </div>
        </Link>
      </div>
      <CardHeader className="px-0 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{displayReadingTime} read</span>
          </div>
        </div>
        <CardTitle className="mt-2 line-clamp-2">
          <Link href={blogUrl} className="hover:text-primary">
            {title}
          </Link>
        </CardTitle>
        {description && (
          <CardDescription className="line-clamp-2 mt-2 text-base">{description}</CardDescription>
        )}
      </CardHeader>
      <CardFooter className="mt-auto flex items-center justify-between px-0 pt-4">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm">MCRC Staff</span>
        </div>
        {displayDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>{displayDate}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
