import { NextResponse } from 'next/server'
import { getStorageBucket } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'

function defaultAltFromFile(file: File) {
  const base = (file.name || 'image').replace(/\.[^.]+$/, '')
  const cleaned = base.replace(/[-_]+/g, ' ').trim()
  return cleaned || 'Uploaded image'
}

export async function POST(req: Request) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string | null) ?? undefined
    const type = (formData.get('type') as string | null) ?? 'blog' // 'blog' | 'events' | 'trainings'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    const validTypes = ['blog', 'events', 'trainings']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    const trimmedAlt = (alt ?? defaultAltFromFile(file)).trim() || 'Uploaded image'

    console.log('[api/media] INIT', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mediaType: type,
      alt: trimmedAlt,
    })

    // Convert File to Buffer for Admin SDK
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Firebase Storage using Admin SDK
    // Organize by type: blog/media/, events/media/, trainings/media/
    // This path matches our Storage rules: /blog/media/{fileName}
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${Date.now()}-${safeName}`
    const bucket = getStorageBucket()
    const objectPath = `${type}/media/${fileName}`

    console.log('[api/media] Bucket info:', {
      bucketName: bucket.name,
      filePath: objectPath,
    })

    const storageFile = bucket.file(objectPath)

    try {
      await storageFile.save(buffer, {
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
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`

      console.log('[api/media] OK', { id: fileName, url })

      return NextResponse.json({ id: fileName, url })
    } catch (saveError) {
      // Check if error is about bucket not existing
      if (
        saveError instanceof Error &&
        (saveError.message.includes('does not exist') ||
          saveError.message.includes('notFound') ||
          saveError.message.includes('404'))
      ) {
        console.error('[api/media] Bucket error:', {
          bucketName: bucket.name,
          error: saveError.message,
        })
        return NextResponse.json(
          {
            error: `Storage bucket "${bucket.name}" does not exist. Please verify your FIREBASE_ADMIN_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable matches your Firebase Storage bucket name.`,
          },
          { status: 500 },
        )
      }
      throw saveError // Re-throw other errors
    }
  } catch (err) {
    console.error('[api/media] FAILED:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
