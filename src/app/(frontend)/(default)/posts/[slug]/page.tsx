import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

import { fetchPostBySlug, fetchRelatedPosts, fetchPosts } from '@/lib/firebase-api-blog'
import { PostHero } from '@/heros/PostHero'
import { PostSectionsNav } from '@/components/Dashboard/posts/PostSectionsNav'
import { getServerSideURL } from '@/utilities/getURL'
import PageClient from './page.client'
import type { Post } from '@/types'

type Args = {
  params: Promise<{ slug?: string }>
}

/**
 * Simple RelatedPosts component
 */
function RelatedPosts({ posts }: { posts: Post[] }) {
  if (!posts || posts.length === 0) return null

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="mb-6 text-2xl font-bold">Related Posts</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border p-4 transition-colors hover:bg-muted"
          >
            <h3 className="mb-2 font-semibold group-hover:text-primary">{post.title}</h3>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function Post({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise

  if (!slug) return notFound()

  const post = await fetchPostBySlug(slug)

  if (!post) return notFound()

  // Fetch related posts if post has categories
  let relatedPosts: Post[] = []
  if (post.categories && post.categories.length > 0) {
    relatedPosts = await fetchRelatedPosts(post.id, post.categories)
  }

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      <PostHero post={post} />

      {/* Body with Sections sidebar */}
      <div className="container pt-8">
        <div className="relative mx-auto flex w-full max-w-5xl items-start gap-12">
          {/* Sections (sticky on large screens) */}
          {post.sections && post.sections.length > 0 && (
            <aside className="sticky top-24 hidden h-fit w-64 shrink-0 lg:block">
              <div className="text-xl font-medium leading-snug">Sections</div>
              <PostSectionsNav sections={post.sections} />
            </aside>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            {post.sections && post.sections.length > 0 ? (
              <div className="space-y-12">
                {post.sections.map((section, index) => (
                  <section
                    key={section.anchor || index}
                    id={section.anchor}
                    className="prose max-w-none dark:prose-invert scroll-mt-24"
                  >
                    {section.title && <h2>{section.title}</h2>}
                    {section.contentHtml && (
                      <div dangerouslySetInnerHTML={{ __html: section.contentHtml }} />
                    )}
                  </section>
                ))}
              </div>
            ) : post.contentHtml ? (
              <div
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            ) : null}

            {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise

  if (!slug) {
    return {
      title: 'Post Not Found',
      robots: { index: false },
    }
  }

  const post = await fetchPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false },
    }
  }

  const title = post.title || 'Post'
  const description = post.excerpt || post.heroBriefSummary || ''
  const image = post.heroImage || post.metaImage
  const canonical = `${getServerSideURL()}/blog/${encodeURIComponent(slug)}`

  return {
    title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Website'}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export const revalidate = 60

/**
 * Generates static params for all published posts
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const posts = await fetchPosts()
    return posts
      .map((post) => post.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => ({ slug }))
  } catch (error) {
    console.error('Error generating static params for posts:', error)
    return []
  }
}
