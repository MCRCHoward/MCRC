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

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  } catch {
    return formatDateTimeShort(dateString)
  }
}
