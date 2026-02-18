import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildRegistrationSyncPayload,
  timestampToISOString,
  type EventData,
} from '../registration-sync'

const FIXED_NOW = new Date('2026-02-18T12:00:00.000Z')

describe('timestampToISOString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('converts Firestore Timestamp-like values with toDate()', () => {
    const timestamp = { toDate: () => new Date('2026-06-15T10:00:00.000Z') }

    const result = timestampToISOString(timestamp)

    expect(result).toBe('2026-06-15T10:00:00.000Z')
  })

  it('falls back to now when toDate() throws', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const timestamp = {
      toDate: () => {
        throw new Error('Invalid timestamp')
      },
    }

    const result = timestampToISOString(timestamp)

    expect(result).toBe(FIXED_NOW.toISOString())
  })

  it('converts raw Firestore {_seconds, _nanoseconds} values', () => {
    const timestamp = { _seconds: 1781517600, _nanoseconds: 0 }

    const result = timestampToISOString(timestamp)

    expect(result).toBe(new Date(timestamp._seconds * 1000).toISOString())
  })

  it('falls back to now when raw Firestore timestamp is out of range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const timestamp = { _seconds: Number.MAX_SAFE_INTEGER, _nanoseconds: 0 }

    const result = timestampToISOString(timestamp)

    expect(result).toBe(FIXED_NOW.toISOString())
  })

  it('converts Date objects', () => {
    const date = new Date('2026-06-15T10:00:00.000Z')

    const result = timestampToISOString(date)

    expect(result).toBe('2026-06-15T10:00:00.000Z')
  })

  it('falls back to now for invalid Date objects', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    const invalidDate = new Date('invalid')

    const result = timestampToISOString(invalidDate)

    expect(result).toBe(FIXED_NOW.toISOString())
  })

  it('passes through valid date strings', () => {
    const dateString = '2026-06-15T10:00:00.000Z'

    const result = timestampToISOString(dateString)

    expect(result).toBe(dateString)
  })

  it('falls back to now for invalid strings', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    const result = timestampToISOString('not-a-date')

    expect(result).toBe(FIXED_NOW.toISOString())
  })

  it('falls back to now for null or undefined', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    expect(timestampToISOString(null)).toBe(FIXED_NOW.toISOString())
    expect(timestampToISOString(undefined)).toBe(FIXED_NOW.toISOString())
  })

  it('falls back to now for unsupported value types', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    const result = timestampToISOString(123 as unknown as never)

    expect(result).toBe(FIXED_NOW.toISOString())
  })
})

describe('buildRegistrationSyncPayload', () => {
  const baseEvent: EventData = {
    title: 'Original Title',
    startAt: '2026-06-15T10:00:00.000Z',
    slug: 'original-slug',
  }

  it('returns shouldSync false when only unrelated fields change', () => {
    const before = { ...baseEvent }
    const after = { ...baseEvent, description: 'Updated copy' }

    const result = buildRegistrationSyncPayload(before, after)

    expect(result).toEqual({ shouldSync: false })
  })

  it('returns updates when title changes', () => {
    const result = buildRegistrationSyncPayload(baseEvent, {
      ...baseEvent,
      title: 'Updated Title',
    })

    expect(result).toEqual({
      shouldSync: true,
      updates: {
        eventName: 'Updated Title',
        eventDate: '2026-06-15T10:00:00.000Z',
        eventSlug: 'original-slug',
      },
    })
  })

  it('returns updates when slug changes', () => {
    const result = buildRegistrationSyncPayload(baseEvent, {
      ...baseEvent,
      slug: 'updated-slug',
    })

    expect(result).toEqual({
      shouldSync: true,
      updates: {
        eventName: 'Original Title',
        eventDate: '2026-06-15T10:00:00.000Z',
        eventSlug: 'updated-slug',
      },
    })
  })

  it('returns updates when startAt changes', () => {
    const result = buildRegistrationSyncPayload(baseEvent, {
      ...baseEvent,
      startAt: '2026-06-16T10:00:00.000Z',
    })

    expect(result).toEqual({
      shouldSync: true,
      updates: {
        eventName: 'Original Title',
        eventDate: '2026-06-16T10:00:00.000Z',
        eventSlug: 'original-slug',
      },
    })
  })

  it('does not sync when startAt values are equivalent across formats', () => {
    const before: EventData = {
      ...baseEvent,
      startAt: '2026-06-15T10:00:00.000Z',
    }

    const after: EventData = {
      ...baseEvent,
      startAt: {
        toDate: () => new Date('2026-06-15T10:00:00.000Z'),
      },
    }

    const result = buildRegistrationSyncPayload(before, after)

    expect(result).toEqual({ shouldSync: false })
  })

  it('does not sync when both startAt values are missing', () => {
    const before: EventData = {
      title: 'No Date Event',
      slug: 'no-date-event',
    }

    const after: EventData = {
      title: 'No Date Event',
      slug: 'no-date-event',
    }

    const result = buildRegistrationSyncPayload(before, after)

    expect(result).toEqual({ shouldSync: false })
  })
})
