/**
 * Firestore helper utilities
 * Provides better error messages and index validation
 */

/**
 * Extracts index creation URL from Firestore error message
 */
export function extractIndexUrl(errorMessage: string): string | null {
  // Firestore errors typically include a URL like:
  // "The query requires an index. You can create it here: https://console.firebase.google.com/..."
  const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
  return urlMatch ? urlMatch[0] : null
}

/**
 * Checks if error is a missing index error
 */
export function isMissingIndexError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return (
    error.message.includes('index') ||
    error.message.includes('requires an index') ||
    error.message.includes('The query requires an index')
  )
}

/**
 * Creates a user-friendly error message for missing index errors
 */
export function formatIndexError(error: unknown): string {
  if (!isMissingIndexError(error)) {
    return error instanceof Error ? error.message : 'An error occurred'
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const indexUrl = extractIndexUrl(errorMessage)

  if (indexUrl) {
    return `Database index required. Please create the index: ${indexUrl}`
  }

  return 'A database index is required for this query. Please contact support or check the Firebase console.'
}

