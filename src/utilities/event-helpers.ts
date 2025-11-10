/**
 * Utility functions for working with event data
 * Handles inconsistencies in Firestore event data structure
 */

/**
 * Safely extracts event name from Firestore data
 * Handles both 'title' and 'name' fields for backward compatibility
 */
export function getEventName(eventData: Record<string, unknown>): string {
  return (eventData.title as string) || (eventData.name as string) || ''
}

/**
 * Converts Firestore timestamp to ISO string
 * Handles multiple timestamp formats:
 * - Firebase Admin SDK Timestamp (with toDate() method)
 * - Raw Firestore Timestamp ({_seconds, _nanoseconds})
 * - Date objects
 * - ISO strings
 */
export function timestampToISOString(value: unknown): string {
  if (!value) {
    return new Date().toISOString()
  }

  // Firebase Admin SDK Timestamp has toDate() method
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate
    if (typeof toDate === 'function') {
      try {
        return toDate().toISOString()
      } catch {
        return new Date().toISOString()
      }
    }
  }

  // Raw Firestore Timestamp format: {_seconds: number, _nanoseconds: number}
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const seconds = obj._seconds
    const nanoseconds = obj._nanoseconds

    if (
      typeof seconds === 'number' &&
      typeof nanoseconds === 'number' &&
      !Number.isNaN(seconds) &&
      !Number.isNaN(nanoseconds)
    ) {
      try {
        const milliseconds = seconds * 1000 + Math.floor(nanoseconds / 1000000)
        return new Date(milliseconds).toISOString()
      } catch {
        return new Date().toISOString()
      }
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    try {
      return value.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  // Already a string (ISO format)
  if (typeof value === 'string') {
    // Validate it's a valid ISO string
    if (!Number.isNaN(Date.parse(value))) {
      return value
    }
    return new Date().toISOString()
  }

  return new Date().toISOString()
}

/**
 * Safely extracts event slug from Firestore data
 * Falls back to eventId if slug is not available
 */
export function getEventSlug(eventData: Record<string, unknown>, eventId: string): string {
  return (eventData.slug as string) || eventId
}

