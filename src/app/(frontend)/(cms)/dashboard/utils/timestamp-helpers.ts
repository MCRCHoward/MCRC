/**
 * Utility functions for converting Firestore Timestamps to serializable formats.
 * These helpers handle both Admin SDK Timestamps (with toDate()) and raw Firestore Timestamps (with _seconds/_nanoseconds).
 * This is necessary for passing data from Server Components to Client Components in Next.js.
 */

/**
 * Converts a Firestore Timestamp to an ISO string.
 * Handles multiple timestamp formats:
 * - Firebase Admin SDK Timestamp (with toDate() method)
 * - Raw Firestore Timestamp ({_seconds, _nanoseconds})
 * - Date objects
 * - ISO strings (returns as-is)
 */
export function toISOString(value: unknown): string | undefined {
  if (!value) return undefined

  // Firebase Admin SDK Timestamp has toDate() method
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate
    if (typeof toDate === 'function') {
      try {
        return toDate().toISOString()
      } catch {
        return undefined
      }
    }
  }

  // Raw Firestore Timestamp format: {_seconds: number, _nanoseconds: number}
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const seconds = obj._seconds
    const nanoseconds = obj._nanoseconds

    // Both must be defined and be numbers
    if (
      typeof seconds === 'number' &&
      typeof nanoseconds === 'number' &&
      !Number.isNaN(seconds) &&
      !Number.isNaN(nanoseconds)
    ) {
      try {
        // Convert seconds + nanoseconds to milliseconds
        const milliseconds = seconds * 1000 + Math.floor(nanoseconds / 1000000)
        return new Date(milliseconds).toISOString()
      } catch {
        return undefined
      }
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    try {
      return value.toISOString()
    } catch {
      return undefined
    }
  }

  // Already a string
  if (typeof value === 'string') {
    return value
  }

  return undefined
}

/**
 * Converts a Firestore Timestamp to a Date object.
 * Handles multiple timestamp formats:
 * - Firebase Admin SDK Timestamp (with toDate() method)
 * - Raw Firestore Timestamp ({_seconds, _nanoseconds})
 * - Date objects (returns as-is)
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null

  // Firebase Admin SDK Timestamp has toDate() method
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDateMethod = (value as { toDate?: () => Date }).toDate
    if (typeof toDateMethod === 'function') {
      try {
        return toDateMethod()
      } catch {
        return null
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
        return new Date(milliseconds)
      } catch {
        return null
      }
    }
  }

  // Already a Date object
  if (value instanceof Date) {
    return value
  }

  return null
}

