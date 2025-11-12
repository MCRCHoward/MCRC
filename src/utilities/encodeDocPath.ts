/**
 * Convert a string to base64url encoding
 * Uses TextEncoder for proper UTF-8 handling
 */
function toBase64Url(str: string): string {
  if (typeof window !== 'undefined') {
    // Browser: Use TextEncoder + btoa for proper UTF-8 handling
    const bytes = new TextEncoder().encode(str)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      if (byte !== undefined) {
        binary += String.fromCharCode(byte)
      }
    }
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  // Node.js: Use Buffer
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(str, 'utf-8').toString('base64url')
    } catch {
      // Fallback if base64url encoding is not supported
      const base64 = Buffer.from(str, 'utf-8').toString('base64')
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }
  }
  // Final fallback (shouldn't happen in Next.js)
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]
    if (byte !== undefined) {
      binary += String.fromCharCode(byte)
    }
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Convert a base64url-encoded string back to original string
 * Uses TextDecoder for proper UTF-8 handling
 */
function fromBase64Url(encoded: string): string {
  // Convert base64url to base64
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64WithPadding = base64 + padding

  if (typeof window !== 'undefined') {
    // Browser: Use atob + TextDecoder for proper UTF-8 handling
    const binary = atob(base64WithPadding)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      const charCode = binary.charCodeAt(i)
      if (charCode !== undefined) {
        bytes[i] = charCode
      }
    }
    return new TextDecoder().decode(bytes)
  }
  // Node.js: Use Buffer
  if (typeof Buffer !== 'undefined') {
    try {
      return Buffer.from(encoded, 'base64url').toString('utf-8')
    } catch {
      // Fallback if base64url encoding is not supported
      return Buffer.from(base64WithPadding, 'base64').toString('utf-8')
    }
  }
  // Final fallback (shouldn't happen in Next.js)
  const binary = atob(base64WithPadding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    const charCode = binary.charCodeAt(i)
    if (charCode !== undefined) {
      bytes[i] = charCode
    }
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Encode a document path to base64url for use in URLs
 * Works in both server and client contexts
 */
export function encodeDocPath(path: string): string {
  if (!path || typeof path !== 'string') {
    throw new Error('encodeDocPath: path must be a non-empty string')
  }
  return toBase64Url(path)
}

/**
 * Decode a base64url-encoded document path
 * Works in both server and client contexts
 */
export function decodeDocPath(encoded: string): string {
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('decodeDocPath: encoded must be a non-empty string')
  }
  try {
    return fromBase64Url(encoded)
  } catch (error) {
    console.error('[decodeDocPath] Decoding error:', error)
    console.error('[decodeDocPath] Encoded value:', encoded)
    throw new Error(`Failed to decode document path: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

