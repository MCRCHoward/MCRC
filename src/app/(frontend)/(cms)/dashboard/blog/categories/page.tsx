import CategoriesPageClient from './CategoriesPageClient'
import { adminDb } from '@/lib/firebase-admin'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

/**
 * Fetches all categories from Firestore using Firebase Admin SDK.
 */
async function fetchCategories(): Promise<Category[]> {
  try {
    const categoriesRef = adminDb.collection('categories')
    const snapshot = await categoriesRef.orderBy('name', 'asc').get()

    if (snapshot.empty) {
      return []
    }

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
    console.error('[fetchCategories] Error:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  return <CategoriesPageClient categories={categories} />
}
