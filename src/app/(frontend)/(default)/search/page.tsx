import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

import { fetchPosts } from '@/lib/firebase-api-blog'
import { fetchCategories } from '@/lib/firebase-api-blog'
import { SearchInput } from '@/components/search/SearchInput'
import PageClient from './page.client'
import SearchClient from './search.client'
import type { CardPostData } from '@/components/Card'
import type { Post } from '@/types'

type Args = {
  searchParams: Promise<{
    q?: string
  }>
}

/**
 * Optimized search function that searches multiple fields
 * Uses word-based matching for better results
 */
function searchPosts(posts: Post[], query: string): Post[] {
  if (!query || query.trim().length === 0) return []

  const searchTerm = query.toLowerCase().trim()
  const searchWords = searchTerm.split(/\s+/).filter(Boolean)

  // If no words after splitting, return empty
  if (searchWords.length === 0) return []

  return posts.filter((post) => {
    // Build searchable text from all relevant fields
    const searchableFields = [
      post.title || '',
      post.excerpt || '',
      post.heroBriefSummary || '',
      post.slug || '',
      post.heroSubHeader || '',
    ]
      .map((field) => field.toLowerCase())
      .join(' ')

    // Check if all search words are found in the searchable text
    // This allows for multi-word queries where all words must be present
    return searchWords.every((word) => searchableFields.includes(word))
  })
}

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

/**
 * Cached data fetcher for posts and categories
 * Revalidates every hour to keep data fresh
 */
const getCachedPosts = unstable_cache(
  async () => {
    return fetchPosts()
  },
  ['search-posts'],
  {
    tags: ['posts', 'blog'],
    revalidate: 3600, // 1 hour
  },
)

const getCachedCategories = unstable_cache(
  async () => {
    return fetchCategories()
  },
  ['search-categories'],
  {
    tags: ['categories', 'blog'],
    revalidate: 3600, // 1 hour
  },
)

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise

  // Fetch posts and categories in parallel with caching
  const [allPosts, allCategories] = await Promise.all([getCachedPosts(), getCachedCategories()])

  // Create category map for efficient lookups
  const categoryMap = new Map(
    allCategories.map((cat) => [cat.id, { name: cat.name, slug: cat.slug }]),
  )

  // Search posts if query is provided
  const searchResults = query ? searchPosts(allPosts, query) : []
  const cardPosts = toCardPostData(searchResults, categoryMap)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <SearchInput defaultValue={query || ''} />
          </div>
        </div>
      </div>

      <SearchClient
        query={query}
        posts={cardPosts}
        totalResults={searchResults.length}
        totalPosts={allPosts.length}
      />
    </div>
  )
}

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: Args): Promise<Metadata> {
  const { q: query } = await searchParamsPromise
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Website'

  if (query) {
    return {
      title: `Search: "${query}" | ${siteName}`,
      description: `Search results for "${query}"`,
    }
  }

  return {
    title: `Search | ${siteName}`,
    description: 'Search for posts and articles',
  }
}

// Revalidate every hour to keep search results fresh
export const revalidate = 3600
