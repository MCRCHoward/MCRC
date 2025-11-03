'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getStorageBucket, adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import { FieldValue } from 'firebase-admin/firestore'
import type { Post, PostInput, PostSection } from '@/types'

/* -------------------------------------------------------------------------- */
/* Utils & Auth                                                               */
/* -------------------------------------------------------------------------- */

type FileDebug = { name?: string; type?: string; size?: number } | null
function fileDebug(file: File | null): FileDebug {
  if (!file) return null
  return { name: file.name, type: file.type, size: file.size }
}

function defaultAltFromFile(file: File) {
  const base = (file.name || 'image').replace(/\.[^.]+$/, '')
  const cleaned = base.replace(/[-_]+/g, ' ').trim()
  return cleaned || 'Uploaded image'
}

function textFromHtml(html?: string): string {
  if (typeof html !== 'string') return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function coerceTitle(title: string | undefined, html: string | undefined, idx: number): string {
  const t = (title ?? '').trim()
  if (t) return t
  const fromBody = textFromHtml(html).slice(0, 80)
  return fromBody || `Section ${idx + 1}`
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/* -------------------------------------------------------------------------- */
/* Media upload                                                               */
/* -------------------------------------------------------------------------- */

type UploadedMedia = { id: string; url: string }

export async function uploadMedia(file: File, alt?: string): Promise<UploadedMedia> {
  await requireAuth() // Ensure user is authenticated

  const trimmedAlt = (alt ?? defaultAltFromFile(file)).toString().trim() || 'Uploaded image'

  console.log('[uploadMedia] INIT', { file: fileDebug(file), alt: trimmedAlt })

  try {
    // Convert File to Buffer for Admin SDK
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Firebase Storage using Admin SDK
    // Blog images go to blog/media/ directory (matches Storage rules)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const bucket = getStorageBucket()
    const objectPath = `blog/media/${fileName}`
    const storageRef = bucket.file(objectPath)

    await storageRef.save(buffer, {
      metadata: {
        contentType: file.type || 'image/jpeg',
        metadata: {
          alt: trimmedAlt,
        },
      },
    })

    // Return Firebase Storage download URL (honors Firebase Storage rules)
    // This URL format works with Firebase Storage rules, unlike raw GCS URLs
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
    const encodedPath = encodeURIComponent(objectPath)
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`

    console.log('[uploadMedia] OK (Firebase Admin):', { url: downloadURL })
    return { id: fileName, url: downloadURL }
  } catch (error) {
    console.error('[uploadMedia] FAILED:', error)
    throw new Error('There was a problem while uploading the file.')
  }
}

/* -------------------------------------------------------------------------- */
/* Post CRUD                                                                  */
/* -------------------------------------------------------------------------- */

export async function createPost(data: PostInput) {
  console.log('[createPost] START', { title: data?.title })

  try {
    const user = await requireAuth() // Get authenticated user

    const postData = {
      ...data,
      slug: data.slug || slugify(data.title ?? 'No title'),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Use Admin SDK to create post (bypasses Firestore rules)
    // Authentication is enforced via requireAuth() above
    const docRef = await adminDb.collection('posts').add(postData)
    console.log('[createPost] OK', { id: docRef.id })

    // Generate blog post URL
    const blogPostUrl = `/blog/${postData.slug}`
    const createdAtIso = new Date().toISOString()

    // Add blog post metadata to user's blogPosts array
    try {
      const userRef = adminDb.doc(`users/${user.id}`)
      const blogPostData: Record<string, unknown> = {
        id: docRef.id,
        title: data.title || 'Untitled',
        slug: postData.slug,
        createdAt: createdAtIso,
      }
      if (data.heroImage) {
        blogPostData.heroImage = data.heroImage
      }

      await userRef.update({
        blogPosts: FieldValue.arrayUnion(blogPostData),
        updatedAt: FieldValue.serverTimestamp(),
      })

      console.log('[createPost] Updated user blogPosts array', {
        userId: user.id,
        postId: docRef.id,
      })
    } catch (userUpdateError) {
      // Log error but don't fail the post creation
      console.error('[createPost] Failed to update user blogPosts:', userUpdateError)
    }

    // Add blog post reference to each associated category
    if (data.categories && data.categories.length > 0) {
      const categoryBlogPostData: Record<string, unknown> = {
        id: docRef.id,
        author: user.id,
        title: data.title || 'Untitled',
        url: blogPostUrl,
        createdAt: createdAtIso,
      }
      if (data.heroImage) {
        categoryBlogPostData.heroImage = data.heroImage
      }

      // Update each category document
      const categoryUpdatePromises = data.categories.map(async (categoryId) => {
        try {
          const categoryRef = adminDb.doc(`categories/${categoryId}`)
          await categoryRef.update({
            blogPosts: FieldValue.arrayUnion(categoryBlogPostData),
            updatedAt: FieldValue.serverTimestamp(),
          })
          console.log('[createPost] Updated category blogPosts', {
            categoryId,
            postId: docRef.id,
          })
        } catch (categoryError) {
          // Log error but don't fail the post creation
          console.error(
            `[createPost] Failed to update category ${categoryId} blogPosts:`,
            categoryError,
          )
        }
      })

      // Wait for all category updates to complete (but don't throw on errors)
      await Promise.allSettled(categoryUpdatePromises)
    }

    revalidatePath('/dashboard/blog')
    revalidatePath('/dashboard/blog/new')
    revalidateTag('blog')
    return { id: docRef.id }
  } catch (error) {
    console.error('[createPost] FAILED:', error)
    throw new Error(`Create failed: ${error}`)
  }
}

export async function updatePost(id: string, data: PostInput) {
  console.log('[updatePost] START', { id })

  try {
    await requireAuth() // Ensure user is authenticated

    // Use Admin SDK to update post (bypasses Firestore rules)
    // Authentication is enforced via requireAuth() above
    const postRef = adminDb.doc(`posts/${id}`)
    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    await postRef.update(updateData)
    console.log('[updatePost] OK')

    revalidatePath('/dashboard/blog')
    revalidatePath(`/dashboard/blog/${id}/edit`)
    revalidateTag('blog')
    return { id }
  } catch (error) {
    console.error('[updatePost] FAILED:', error)
    throw new Error(`Update failed: ${error}`)
  }
}

export async function deletePost(id: string) {
  console.log('[deletePost] START', { id })

  if (!id) throw new Error('Missing blog post id')

  try {
    await requireAuth() // Ensure user is authenticated

    // Use Admin SDK to delete post (bypasses Firestore rules)
    // Authentication is enforced via requireAuth() above
    await adminDb.doc(`posts/${id}`).delete()
    console.log('[deletePost] OK', { id })

    revalidatePath('/dashboard/blog')
    revalidateTag('blog')
  } catch (error) {
    console.error('[deletePost] FAILED:', error)
    throw new Error(`Failed to delete post ${id}: ${error}`)
  }
}

/* -------------------------------------------------------------------------- */
/* Form-based create / update                                                 */
/* -------------------------------------------------------------------------- */

type TinySection = { title?: string; content?: string }
type SectionsPayload = {
  sections?: TinySection[]
  section1?: TinySection
  section2?: TinySection
  section3?: TinySection
  conclusion?: string
}

function buildCombinedHTMLFromSections(data: SectionsPayload): string {
  const parts: string[] = []
  const pushSection = (sec?: TinySection) => {
    if (!sec) return
    const t = (sec.title || '').trim()
    const c = (sec.content || '').trim()
    if (!t && !c) return
    if (t) parts.push(`<h2>${escapeHtml(t)}</h2>`)
    if (c) parts.push(c)
  }

  if (Array.isArray(data.sections) && data.sections.length > 0) {
    for (const s of data.sections) pushSection(s)
  } else {
    pushSection(data.section1)
    pushSection(data.section2)
    pushSection(data.section3)
  }

  if (data.conclusion) {
    parts.push(`<h2>Conclusion</h2>`)
    parts.push(String(data.conclusion))
  }

  return parts.join('\n\n').trim()
}

type SectionOut = {
  title: string
  contentHtml: string
  image?: string
  anchor: string
}

export async function createPostFromForm(fd: FormData) {
  console.log('[createPostFromForm] START')

  try {
    await requireAuth() // Ensure user is authenticated

    const raw = fd.get('data')
    if (!raw || typeof raw !== 'string') throw new Error('Missing form data payload')
    const data = JSON.parse(raw) as SectionsPayload & {
      title?: string
      heroSubHeader?: string
      heroBriefSummary?: string
      excerpt?: string
      categoryIds?: Array<string>
    }
    console.log('[createPostFromForm] Parsed data keys:', Object.keys(data))

    // HERO IMAGE
    const hero = fd.get('heroImage') as File | null
    console.log('[createPostFromForm] Hero file present:', Boolean(hero))
    let heroUrl: string | undefined = undefined
    if (hero && typeof hero === 'object') {
      console.log('[createPostFromForm] Uploading hero (Firebase)…', fileDebug(hero))
      const uploaded = await uploadMedia(hero, data.title || hero.name)
      heroUrl = uploaded.url
    }

    // SECTION IMAGES
    const sectionsInput: TinySection[] = Array.isArray(data.sections) ? data.sections : []
    const sectionImageUrls: Array<string | undefined> = []

    for (let i = 0; i < 3; i++) {
      const f = fd.get(`sectionImage-${i}`) as File | null
      console.log(`[createPostFromForm] Section ${i + 1} file present:`, Boolean(f))
      if (f && typeof f === 'object') {
        const alt = sectionsInput[i]?.title || `Section ${i + 1} image`
        console.log(`[createPostFromForm] Uploading section ${i + 1} (Firebase)…`, fileDebug(f))
        const uploaded = await uploadMedia(f, alt)
        sectionImageUrls[i] = uploaded.url
      } else {
        sectionImageUrls[i] = undefined
      }
    }

    // COMBINED HTML
    const combinedHTML = buildCombinedHTMLFromSections(data)
    console.log('[createPostFromForm] combinedHTML length:', combinedHTML.length)

    const sections: SectionOut[] = sectionsInput.map((s, i) => {
      const title = coerceTitle(s?.title, s?.content, i)
      return {
        title,
        contentHtml: s?.content ?? '',
        image: sectionImageUrls[i],
        anchor: slugify(title),
      }
    })

    const postData: PostInput = {
      title: data.title || '',
      excerpt: data.excerpt,
      authors: [], // TODO: Add authors
      categories: data.categoryIds ?? [],
      contentHtml: combinedHTML || '',
      sections,
      heroImage: heroUrl,
      _status: 'published',
      slug: data.title ? slugify(data.title) : undefined,
    }

    console.log('[createPostFromForm] Creating post with data keys:', Object.keys(postData))

    const result = await createPost(postData)
    console.log('[createPostFromForm] OK')
    return result
  } catch (error) {
    console.error('[createPostFromForm] FAILED:', error)
    throw error
  }
}

export async function updatePostFromForm(id: string, fd: FormData) {
  console.log('[updatePostFromForm] START', { id })

  try {
    await requireAuth() // Ensure user is authenticated

    const raw = fd.get('data')
    if (!raw || typeof raw !== 'string') throw new Error('Missing form data payload')
    const data = JSON.parse(raw) as SectionsPayload & {
      title?: string
      excerpt?: string
      categoryIds?: Array<string>
    }
    console.log('[updatePostFromForm] Parsed data keys:', Object.keys(data))

    // Optional hero update
    const hero = fd.get('heroImage') as File | null
    let heroUrl: string | undefined
    console.log('[updatePostFromForm] Hero file present:', Boolean(hero))
    if (hero && typeof hero === 'object') {
      console.log('[updatePostFromForm] Uploading hero (Firebase)…', fileDebug(hero))
      const uploaded = await uploadMedia(hero, data.title || hero.name)
      heroUrl = uploaded.url
    }

    // Optional section images
    const sectionsInput: TinySection[] = Array.isArray(data.sections) ? data.sections : []
    const sectionImageUrls: Array<string | undefined> = []

    for (let i = 0; i < 3; i++) {
      const f = fd.get(`sectionImage-${i}`) as File | null
      console.log(`[updatePostFromForm] Section ${i + 1} file present:`, Boolean(f))
      if (f && typeof f === 'object') {
        const alt = sectionsInput[i]?.title || `Section ${i + 1} image`
        console.log(`[updatePostFromForm] Uploading section ${i + 1} (Firebase)…`, fileDebug(f))
        const uploaded = await uploadMedia(f, alt)
        sectionImageUrls[i] = uploaded.url
      } else {
        sectionImageUrls[i] = undefined
      }
    }

    const combinedHTML = buildCombinedHTMLFromSections(data)
    console.log('[updatePostFromForm] combinedHTML length:', combinedHTML.length)

    const sections: SectionOut[] = sectionsInput.map((s, i) => {
      const title = coerceTitle(s?.title, s?.content, i)
      return {
        title,
        contentHtml: s?.content ?? '',
        image: sectionImageUrls[i],
        anchor: slugify(title),
      }
    })

    const updateData: Partial<PostInput> = {
      title: data.title,
      excerpt: data.excerpt,
      categories: data.categoryIds ?? [],
      sections,
      _status: 'published',
    }

    if (combinedHTML) updateData.contentHtml = combinedHTML
    if (typeof heroUrl !== 'undefined') updateData.heroImage = heroUrl

    console.log('[updatePostFromForm] Updating post with data keys:', Object.keys(updateData))

    const result = await updatePost(id, updateData as PostInput)
    console.log('[updatePostFromForm] OK')
    return result
  } catch (error) {
    console.error('[updatePostFromForm] FAILED:', error)
    throw error
  }
}
