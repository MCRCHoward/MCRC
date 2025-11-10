/**
 * Input sanitization utilities
 * Removes potentially dangerous content from user inputs
 */

/**
 * Sanitizes a string by removing HTML tags and script content
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')

  // Remove script-like content
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitizes phone number - keeps only digits, spaces, dashes, parentheses, and plus
 */
export function sanitizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  // Keep only digits, spaces, dashes, parentheses, and plus sign
  return phone.replace(/[^\d\s\-()\+]/g, '')
}

/**
 * Sanitizes email - basic validation and cleaning
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  // Remove whitespace and convert to lowercase
  return email.trim().toLowerCase()
}

