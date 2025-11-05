import { getClientSideURL } from './getURL'

/**
 * Processes media resource URL to ensure proper formatting.
 * Handles both absolute URLs (http/https) and relative paths.
 *
 * @param url - The original URL from the resource
 * @param cacheTag - Optional cache tag to append as query parameter
 * @returns Properly formatted URL with cache tag if provided
 * @example
 * getMediaUrl('/images/photo.jpg') // 'http://localhost:3000/images/photo.jpg'
 * getMediaUrl('https://example.com/image.jpg', 'v1') // 'https://example.com/image.jpg?v1'
 * getMediaUrl('/images/photo.jpg', 'cache') // 'http://localhost:3000/images/photo.jpg?cache'
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url || typeof url !== 'string') {
    return ''
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise prepend client-side URL
  const baseUrl = getClientSideURL()
  const separator = url.startsWith('/') ? '' : '/'
  const fullUrl = `${baseUrl}${separator}${url}`

  return cacheTag ? `${fullUrl}?${cacheTag}` : fullUrl
}
