import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { fetchPostById } from '@/lib/firebase-api-blog'
import { adminDb } from '@/lib/firebase-admin'
import { fetchAuthorUsers } from '@/lib/firebase-api-users'
import type { Post, Category, User } from '@/types'
import PostForm from './PostForm'

type RouteParams = Promise<{ id: string }>

type CategoryLike = { id: string | number; title?: string | null; slug?: string | null }
type PostSectionLike = { title?: string | null; contentHtml?: string | null }
type MediaLike = { url?: string | null } | string | number | null

type PostLike = {
  id?: string | number
  title?: string | null
  excerpt?: string | null
  categories?: Array<string | number | CategoryLike> | null
  sections?: PostSectionLike[]
  contentHtml?: string | null
  heroImage?: MediaLike
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const snapshot = await adminDb.collection('categories').orderBy('name', 'asc').get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name ?? '',
        slug: data.slug ?? '',
        description: data.description,
        parent: data.parent,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? new Date().toISOString(),
      } as Category
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export default async function EditPostPage({ params }: { params: RouteParams }) {
  const { id } = await params

  // Fetch post, categories, and authors data
  let post: Post | null = null
  let categories: Category[] = []
  let authors: User[] = []

  try {
    ;[post, categories, authors] = await Promise.all([
      fetchPostById(id),
      fetchCategories(),
      fetchAuthorUsers(),
    ])
  } catch (error) {
    console.error('Error fetching post data:', error)
  }

  if (!post) {
    notFound()
  }

  // Convert Firebase types to form-compatible types
  const postLike: PostLike & { authors?: string[] } = {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    categories: post.categories || [],
    authors: post.authors || [],
    sections: post.sections || undefined,
    contentHtml: post.contentHtml,
    heroImage: post.heroImage,
  }

  const categoryLikes: CategoryLike[] = categories.map((cat) => ({
    id: cat.id,
    title: cat.name, // Firebase uses 'name', not 'title'
    slug: cat.slug,
  }))

  const authorLikes: Array<{ id: string; name?: string | null; email?: string | null }> =
    authors.map((author) => ({
      id: author.id,
      name: author.name,
      email: author.email,
    }))

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostForm mode="edit" post={postLike} categories={categoryLikes} authors={authorLikes} />
    </Suspense>
  )
}
