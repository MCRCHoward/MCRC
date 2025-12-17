'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import type { Category, CategoryInput } from '@/types'
import slugify from 'slugify'

/* -------------------------------------------------------------------------- */
/* Category CRUD                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new category in Firestore
 */
export async function createCategory(data: CategoryInput) {
  try {
    await requireAuth() // Ensure user is authenticated

    // Generate slug from name if not provided
    const slug = data.slug || slugify(data.name, { lower: true, strict: true, trim: true })

    // Check if slug already exists using Admin SDK
    const existingSnapshot = await adminDb
      .collection('categories')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      throw new Error(`A category with the slug "${slug}" already exists`)
    }

    const categoryData = {
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || '',
      parent: data.parent || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = await adminDb.collection('categories').add(categoryData)

    revalidatePath('/dashboard/blog/categories')
    return { id: docRef.id }
  } catch (error) {
    console.error('[createCategory] FAILED:', error)
    throw error instanceof Error ? error : new Error(`Create failed: ${error}`)
  }
}

/**
 * Updates an existing category in Firestore
 */
export async function updateCategory(id: string, data: CategoryInput) {
  try {
    await requireAuth() // Ensure user is authenticated

    const categoryRef = adminDb.doc(`categories/${id}`)
    const currentDoc = await categoryRef.get()

    if (!currentDoc.exists) {
      throw new Error('Category not found')
    }

    // Generate slug from name if not provided
    const slug = data.slug || slugify(data.name, { lower: true, strict: true, trim: true })

    // Check if slug already exists (excluding current category) using Admin SDK
    const existingSnapshot = await adminDb
      .collection('categories')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    const existingCategory = existingSnapshot.docs.find((doc) => doc.id !== id)

    if (existingCategory) {
      throw new Error(`A category with the slug "${slug}" already exists`)
    }

    const updateData = {
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || '',
      parent: data.parent || null,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await categoryRef.update(updateData)

    revalidatePath('/dashboard/blog/categories')
    return { id }
  } catch (error) {
    console.error('[updateCategory] FAILED:', error)
    throw error instanceof Error ? error : new Error(`Update failed: ${error}`)
  }
}

/**
 * Deletes a category from Firestore
 */
export async function deleteCategory(id: string) {
  try {
    await requireAuth() // Ensure user is authenticated

    // Check if category is being used by any posts using Admin SDK
    const postsSnapshot = await adminDb.collection('posts').orderBy('createdAt', 'desc').get()

    const postsUsingCategory = postsSnapshot.docs.some((doc) => {
      const data = doc.data()
      const categoryIds = data.categoryIds || data.categories || []
      return Array.isArray(categoryIds) && categoryIds.includes(id)
    })

    if (postsUsingCategory) {
      throw new Error('Cannot delete category: It is being used by one or more blog posts')
    }

    const categoryRef = adminDb.doc(`categories/${id}`)
    await categoryRef.delete()

    revalidatePath('/dashboard/blog/categories')
    return { id }
  } catch (error) {
    console.error('[deleteCategory] FAILED:', error)
    throw error instanceof Error ? error : new Error(`Delete failed: ${error}`)
  }
}

/**
 * Fetches all categories from Firestore using Admin SDK
 * Note: This function is primarily for client-side use.
 * Server components should use the fetchCategories function in page.tsx
 */
export async function fetchCategories(): Promise<Category[]> {
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
    console.error('[fetchCategories] Error:', error)
    return []
  }
}
