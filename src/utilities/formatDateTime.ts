/**
 * Centralized date and time formatting utilities
 * Used across event registration system
 */

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  } catch {
    return dateString
  }
}

/**
 * Format date only for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'long',
    })
  } catch {
    return dateString
  }
}

/**
 * Format time only for display
 */
export function formatTime(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

/**
 * Format date and time in short format (for tables/lists)
 */
export function formatDateTimeShort(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return dateString
  }
}
