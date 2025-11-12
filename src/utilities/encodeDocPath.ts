/**
 * Encode a document path to base64url for use in URLs
 * Works in both server and client contexts
 */
export function encodeDocPath(path: string): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js/Browser with Buffer polyfill
    return Buffer.from(path, 'utf-8').toString('base64url')
  }
  // Fallback for browsers without Buffer (shouldn't happen in Next.js, but just in case)
  const encoded = btoa(unescape(encodeURIComponent(path)))
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode a base64url-encoded document path
 * Works in both server and client contexts
 */
export function decodeDocPath(encoded: string): string {
  if (typeof Buffer !== 'undefined') {
    // Node.js/Browser with Buffer polyfill
    return Buffer.from(encoded, 'base64url').toString('utf-8')
  }
  // Fallback for browsers without Buffer
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return decodeURIComponent(escape(atob(base64 + padding)))
}

