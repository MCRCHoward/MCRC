/**
 * Encode a document path to base64url for use in URLs
 * Works in both server and client contexts
 */
export function encodeDocPath(path: string): string {
  // Use browser-compatible method in browser (Buffer polyfill may not support base64url)
  if (typeof window !== 'undefined') {
    const encoded = btoa(unescape(encodeURIComponent(path)))
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  // Use Buffer in Node.js server environment
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(path, 'utf-8').toString('base64url')
    } catch {
      // Fallback if base64url encoding is not supported
      const encoded = Buffer.from(path, 'utf-8').toString('base64')
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }
  }
  // Final fallback (shouldn't happen in Next.js)
  const encoded = btoa(unescape(encodeURIComponent(path)))
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode a base64url-encoded document path
 * Works in both server and client contexts
 */
export function decodeDocPath(encoded: string): string {
  // Use browser-compatible method in browser
  if (typeof window !== 'undefined') {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    return decodeURIComponent(escape(atob(base64 + padding)))
  }
  // Use Buffer in Node.js server environment
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(encoded, 'base64url').toString('utf-8')
    } catch {
      // Fallback if base64url encoding is not supported
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const padding = '='.repeat((4 - (base64.length % 4)) % 4)
      return Buffer.from(base64 + padding, 'base64').toString('utf-8')
    }
  }
  // Final fallback (shouldn't happen in Next.js)
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  return decodeURIComponent(escape(atob(base64 + padding)))
}

