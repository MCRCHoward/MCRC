'use client'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'

interface SearchClientProps {
  query?: string
  posts: (CardPostData & { categories: Array<{ title: string; slug: string }> })[]
  totalResults: number
  totalPosts: number
}

export default function SearchClient({
  query,
  posts,
  totalResults,
  totalPosts,
}: SearchClientProps) {
  if (!query) {
    return (
      <div className="container">
        <p className="text-center text-muted-foreground">
          Enter a search term to find posts. We have {totalPosts}{' '}
          {totalPosts === 1 ? 'post' : 'posts'} available.
        </p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="container">
        <p className="text-center text-muted-foreground">
          No results found for &quot;{query}&quot;. Try different keywords or check your spelling.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="container mb-8">
        <p className="text-center text-muted-foreground">
          Found {totalResults} {totalResults === 1 ? 'result' : 'results'} for &quot;{query}&quot;
        </p>
      </div>
      <CollectionArchive posts={posts} />
    </>
  )
}
