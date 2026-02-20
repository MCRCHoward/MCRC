export function isoToDate(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return ''
    const dateStr = date.toISOString().split('T')[0]
    return dateStr || ''
  } catch {
    return ''
  }
}

export function isoToTime(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return ''
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

export function extractImageUrl(
  image?: string | { url: string; alt?: string } | null,
): string | undefined {
  if (!image) return undefined
  if (typeof image === 'string') return image
  if ('url' in image) return image.url
  return undefined
}

export async function uploadEventImage(file: File): Promise<string | undefined> {
  if (!file) return undefined

  const fd = new FormData()
  fd.set('file', file)
  fd.set('type', 'events')
  fd.set('alt', file.name)

  const res = await fetch('/api/media', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Image upload failed')
  }

  const data = await res.json()
  return data?.url as string
}

export { slugify } from '@/lib/utils/slugify'
