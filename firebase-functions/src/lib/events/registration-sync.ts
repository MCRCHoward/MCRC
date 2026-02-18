import type { Timestamp } from 'firebase-admin/firestore'

interface RawFirestoreTimestamp {
  _seconds: number
  _nanoseconds: number
}

interface TimestampWithToDate {
  toDate: () => Date
}

type TimestampInput =
  | Timestamp
  | TimestampWithToDate
  | RawFirestoreTimestamp
  | Date
  | string
  | null
  | undefined

export interface EventData {
  title?: string
  startAt?: TimestampInput
  slug?: string
  [key: string]: unknown
}

export interface RegistrationSyncUpdates {
  [key: string]: string
  eventName: string
  eventDate: string
  eventSlug: string
}

export interface RegistrationSyncResult {
  shouldSync: boolean
  updates?: RegistrationSyncUpdates
}

function fallbackIsoNow(): string {
  return new Date().toISOString()
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function timestampToISOString(timestamp: TimestampInput): string {
  if (!timestamp) {
    return fallbackIsoNow()
  }

  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    const maybeToDate = (timestamp as { toDate?: unknown }).toDate
    if (typeof maybeToDate === 'function') {
      try {
        const date = maybeToDate.call(timestamp)
        return date.toISOString()
      } catch {
        return fallbackIsoNow()
      }
    }
  }

  if (typeof timestamp === 'object' && timestamp !== null) {
    const raw = timestamp as unknown as Record<string, unknown>
    if (typeof raw._seconds === 'number' && !Number.isNaN(raw._seconds)) {
      const nanoseconds =
        typeof raw._nanoseconds === 'number' && !Number.isNaN(raw._nanoseconds)
          ? raw._nanoseconds
          : 0
      try {
        const milliseconds = raw._seconds * 1000 + Math.floor(nanoseconds / 1000000)
        return new Date(milliseconds).toISOString()
      } catch {
        return fallbackIsoNow()
      }
    }
  }

  if (timestamp instanceof Date) {
    try {
      return timestamp.toISOString()
    } catch {
      return fallbackIsoNow()
    }
  }

  if (typeof timestamp === 'string') {
    if (!Number.isNaN(Date.parse(timestamp))) {
      return timestamp
    }
    return fallbackIsoNow()
  }

  return fallbackIsoNow()
}

export function buildRegistrationSyncPayload(
  before: EventData,
  after: EventData,
): RegistrationSyncResult {
  const beforeTitle = toSafeString(before.title)
  const afterTitle = toSafeString(after.title)
  const beforeSlug = toSafeString(before.slug)
  const afterSlug = toSafeString(after.slug)

  const beforeDateForComparison = before.startAt ? timestampToISOString(before.startAt) : ''
  const afterDateForComparison = after.startAt ? timestampToISOString(after.startAt) : ''

  const titleChanged = beforeTitle !== afterTitle
  const slugChanged = beforeSlug !== afterSlug
  const startAtChanged = beforeDateForComparison !== afterDateForComparison

  if (!titleChanged && !slugChanged && !startAtChanged) {
    return { shouldSync: false }
  }

  return {
    shouldSync: true,
    updates: {
      eventName: afterTitle,
      eventDate: timestampToISOString(after.startAt),
      eventSlug: afterSlug,
    },
  }
}
