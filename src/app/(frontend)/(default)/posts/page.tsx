import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { fetchPosts } from '@/lib/firebase-api-blog'
import { fetchCategories } from '@/lib/firebase-api-blog'
import PageClient from './page.client'
import type { CardPostData } from '@/components/Card'
import type { Post } from '@/types'

const POSTS_PER_PAGE = 12

/**
 * Convert Post to CardPostData format
 * Card component can handle categories as either string[] (IDs) or objects with title/slug
 */
function toCardPostData(
  posts: Post[],
  categories: Map<string, { name: string; slug: string }>,
): (CardPostData & { categories: Array<{ title: string; slug: string }> })[] {
  return posts.map((post) => {
    // Resolve category IDs to category objects for display
    const postCategories = post.categories
      ? post.categories
          .map((catId: string) => {
            const category = categories.get(String(catId))
            return category ? { title: category.name, slug: category.slug } : null
          })
          .filter((cat): cat is { title: string; slug: string } => cat !== null)
      : []

    return {
      slug: post.slug,
      title: post.title,
      heroImage: post.heroImage,
      categories: postCategories,
      meta: {
        title: post.title,
        description: post.excerpt || post.heroBriefSummary,
      },
    } as CardPostData & { categories: Array<{ title: string; slug: string }> }
  })
}

export const revalidate = 600

export default async function Page() {
  // Fetch all posts and categories
  const [allPosts, allCategories] = await Promise.all([fetchPosts(), fetchCategories()])

  // Create category map for efficient lookups
  const categoryMap = new Map(
    allCategories.map((cat) => [cat.id, { name: cat.name, slug: cat.slug }]),
  )

  // Paginate posts (client-side pagination)
  const totalDocs = allPosts.length
  const totalPages = Math.ceil(totalDocs / POSTS_PER_PAGE)
  const currentPage = 1
  const paginatedPosts = allPosts.slice(0, POSTS_PER_PAGE)

  const cardPosts = toCardPostData(paginatedPosts, categoryMap)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={currentPage}
          limit={POSTS_PER_PAGE}
          totalDocs={totalDocs}
        />
      </div>

      <CollectionArchive posts={cardPosts} />

      <div className="container">
        {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} />}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Posts | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Website'}`,
  }
}
