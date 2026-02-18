import { describe, expect, it } from 'vitest'
import { firestoreToEvent, firestoreToEventForEdit } from '../event-mapper'
import type { FirestoreEventData } from '@/types/event-firestore'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal valid Firestore event document */
function makeFirestoreEvent(overrides: Partial<FirestoreEventData> = {}): FirestoreEventData {
  return {
    title: 'Community Workshop',
    slug: 'community-workshop',
    startAt: { toDate: () => new Date('2026-03-15T10:00:00Z') },
    isOnline: false,
    isFree: true,
    status: 'published',
    listed: true,
    isArchived: false,
    createdAt: { toDate: () => new Date('2026-01-01T00:00:00Z') },
    updatedAt: { toDate: () => new Date('2026-02-01T00:00:00Z') },
    ...overrides,
  }
}

const DOC_ID = 'abc123'

// ===========================================================================
// firestoreToEvent
// ===========================================================================

describe('firestoreToEvent', () => {
  // -- Core field mapping ---------------------------------------------------

  it('maps title to name', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({ title: 'My Event' }))
    expect(event.name).toBe('My Event')
  })

  it('falls back to empty string when title is missing', () => {
    const event = firestoreToEvent(
      DOC_ID,
      makeFirestoreEvent({ title: '' }),
    )
    expect(event.name).toBe('')
  })

  it('maps slug directly', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({ slug: 'my-slug' }))
    expect(event.slug).toBe('my-slug')
  })

  it('falls back slug to docId when empty', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({ slug: '' }))
    expect(event.slug).toBe(DOC_ID)
  })

  it('sets id to docId', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent())
    expect(event.id).toBe(DOC_ID)
  })

  // -- Timestamp conversion -------------------------------------------------

  it('converts startAt Timestamp (toDate) to ISO string', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: { toDate: () => new Date('2026-06-01T14:00:00Z') },
    }))
    expect(event.eventStartTime).toBe('2026-06-01T14:00:00.000Z')
  })

  it('converts endAt Timestamp to ISO string', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: { toDate: () => new Date('2026-06-01T14:00:00Z') },
      endAt: { toDate: () => new Date('2026-06-01T16:00:00Z') },
    }))
    expect(event.eventEndTime).toBe('2026-06-01T16:00:00.000Z')
  })

  it('falls back eventEndTime to startAt when endAt is missing', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: { toDate: () => new Date('2026-06-01T14:00:00Z') },
      endAt: undefined,
    }))
    expect(event.eventEndTime).toBe('2026-06-01T14:00:00.000Z')
  })

  it('handles raw { _seconds, _nanoseconds } timestamp format', () => {
    const ts = { _seconds: 1780000000, _nanoseconds: 0 }
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: ts,
    }))
    expect(event.eventStartTime).toBe(new Date(1780000000 * 1000).toISOString())
  })

  it('handles ISO string timestamps', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: '2026-04-10T08:00:00.000Z',
    }))
    expect(event.eventStartTime).toBe('2026-04-10T08:00:00.000Z')
  })

  it('handles Date object timestamps', () => {
    const date = new Date('2026-05-20T12:00:00Z')
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      startAt: date,
    }))
    expect(event.eventStartTime).toBe('2026-05-20T12:00:00.000Z')
  })

  it('converts createdAt and updatedAt to ISO strings', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      createdAt: { toDate: () => new Date('2026-01-15T00:00:00Z') },
      updatedAt: { toDate: () => new Date('2026-02-10T00:00:00Z') },
    }))
    expect(event.createdAt).toBe('2026-01-15T00:00:00.000Z')
    expect(event.updatedAt).toBe('2026-02-10T00:00:00.000Z')
  })

  // -- Modality resolution --------------------------------------------------

  it('resolves modality as online when isOnline and no venue', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: true,
      venue: undefined,
    }))
    expect(event.modality).toBe('online')
  })

  it('resolves modality as in_person when not online', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: false,
      venue: { name: 'City Hall' },
    }))
    expect(event.modality).toBe('in_person')
  })

  it('resolves modality as hybrid when online AND has venue (regression test)', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: true,
      venue: { name: 'Community Center', addressLine1: '100 Main St' },
    }))
    expect(event.modality).toBe('hybrid')
  })

  it('resolves modality as in_person when isOnline is false and no venue', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: false,
      venue: undefined,
    }))
    expect(event.modality).toBe('in_person')
  })

  // -- Location building ----------------------------------------------------

  it('builds location from venue fields', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      venue: {
        name: 'City Hall',
        addressLine1: '123 Main St',
        city: 'Baltimore',
        state: 'MD',
        postalCode: '21201',
      },
    }))
    expect(event.location).toEqual({
      venueName: 'City Hall',
      address: '123 Main St, Baltimore, MD, 21201',
    })
  })

  it('returns undefined location when venue is empty', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      venue: undefined,
    }))
    expect(event.location).toBeUndefined()
  })

  it('returns undefined location when venue has no meaningful data', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      venue: { name: '', addressLine1: '' },
    }))
    expect(event.location).toBeUndefined()
  })

  // -- Online meeting -------------------------------------------------------

  it('builds onlineMeeting when isOnline and has URL', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: true,
      onlineMeetingUrl: 'https://zoom.us/j/123',
      onlineMeetingDetails: 'Passcode: abc',
    }))
    expect(event.onlineMeeting).toEqual({
      url: 'https://zoom.us/j/123',
      details: 'Passcode: abc',
    })
  })

  it('returns undefined onlineMeeting when not online', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: false,
      onlineMeetingUrl: 'https://zoom.us/j/123',
    }))
    expect(event.onlineMeeting).toBeUndefined()
  })

  it('returns undefined onlineMeeting when no URL provided', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isOnline: true,
      onlineMeetingUrl: undefined,
    }))
    expect(event.onlineMeeting).toBeUndefined()
  })

  // -- Cost building --------------------------------------------------------

  it('returns undefined cost when isFree is true', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({ isFree: true }))
    expect(event.cost).toBeUndefined()
  })

  it('handles normalized cost object', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: { amount: 25, currency: 'USD', description: 'Early bird' },
    }))
    expect(event.cost).toEqual({
      amount: 25,
      currency: 'USD',
      description: 'Early bird',
    })
  })

  it('handles legacy price/currency fields', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: undefined,
      price: 15,
      currency: 'EUR',
      costDescription: 'Standard',
    }))
    expect(event.cost).toEqual({
      amount: 15,
      currency: 'EUR',
      description: 'Standard',
    })
  })

  it('prefers normalized cost over legacy fields', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: { amount: 30, currency: 'GBP' },
      price: 10,
      currency: 'USD',
    }))
    expect(event.cost?.amount).toBe(30)
    expect(event.cost?.currency).toBe('GBP')
  })

  it('defaults currency to USD when not specified', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: undefined,
      price: 20,
      currency: undefined,
    }))
    expect(event.cost?.currency).toBe('USD')
  })

  // -- Images ---------------------------------------------------------------

  it('maps imageUrl to featuredImage object', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      imageUrl: 'https://img.example.com/photo.jpg',
      title: 'Art Show',
    }))
    expect(event.featuredImage).toEqual({
      url: 'https://img.example.com/photo.jpg',
      alt: 'Art Show',
    })
  })

  it('returns undefined featuredImage when no imageUrl', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      imageUrl: undefined,
    }))
    expect(event.featuredImage).toBeUndefined()
  })

  it('maps secondaryImageUrl to secondaryImage object', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      secondaryImageUrl: 'https://img.example.com/secondary.jpg',
      title: 'Workshop',
    }))
    expect(event.secondaryImage).toEqual({
      url: 'https://img.example.com/secondary.jpg',
      alt: 'Workshop - secondary image',
    })
  })

  // -- Meta -----------------------------------------------------------------

  it('builds meta with status and eventType from category', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      status: 'published',
      category: 'Community',
    }))
    expect(event.meta).toEqual({
      slug: 'community-workshop',
      status: 'published',
      eventType: 'Community',
    })
  })

  it('falls back eventType to format when no category', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      category: undefined,
      format: 'Workshop',
    }))
    expect(event.meta.eventType).toBe('Workshop')
  })

  it('defaults status to draft for non-published values', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      status: 'draft',
    }))
    expect(event.meta.status).toBe('draft')
  })

  // -- Defaults & flags -----------------------------------------------------

  it('defaults isFree to true', () => {
    const data = makeFirestoreEvent()
    // Force isFree to undefined to test the default
    const patched = { ...data, isFree: undefined } as unknown as FirestoreEventData
    const event = firestoreToEvent(DOC_ID, patched)
    expect(event.isFree).toBe(true)
  })

  it('defaults isRegistrationRequired to true', () => {
    const data = makeFirestoreEvent({ isRegistrationRequired: undefined })
    const event = firestoreToEvent(DOC_ID, data)
    expect(event.isRegistrationRequired).toBe(true)
  })

  it('defaults isArchived to false', () => {
    const data = makeFirestoreEvent()
    const patched = { ...data, isArchived: undefined } as unknown as FirestoreEventData
    const event = firestoreToEvent(DOC_ID, patched)
    expect(event.isArchived).toBe(false)
  })

  it('defaults listed to true', () => {
    const data = makeFirestoreEvent()
    const patched = { ...data, listed: undefined } as unknown as FirestoreEventData
    const event = firestoreToEvent(DOC_ID, patched)
    expect(event.listed).toBe(true)
  })

  it('passes through externalRegistrationLink', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent({
      externalRegistrationLink: 'https://register.example.com',
    }))
    expect(event.externalRegistrationLink).toBe('https://register.example.com')
  })

  it('sets content to empty array', () => {
    const event = firestoreToEvent(DOC_ID, makeFirestoreEvent())
    expect(event.content).toEqual([])
  })
})

// ===========================================================================
// firestoreToEventForEdit
// ===========================================================================

describe('firestoreToEventForEdit', () => {
  it('includes all base Event fields', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent())
    expect(event.id).toBe(DOC_ID)
    expect(event.name).toBe('Community Workshop')
    expect(event.slug).toBe('community-workshop')
  })

  it('includes descriptionHtml', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      descriptionHtml: '<p>Welcome to our workshop</p>',
    }))
    expect(event.descriptionHtml).toBe('<p>Welcome to our workshop</p>')
  })

  it('includes venueFields as individual fields', () => {
    const venue = {
      name: 'City Hall',
      addressLine1: '123 Main St',
      addressLine2: 'Suite 100',
      city: 'Baltimore',
      state: 'MD',
      postalCode: '21201',
      country: 'US',
    }
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({ venue }))
    expect(event.venueFields).toEqual(venue)
  })

  it('includes timezone and capacity', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      timezone: 'America/New_York',
      capacity: 50,
    }))
    expect(event.timezone).toBe('America/New_York')
    expect(event.capacity).toBe(50)
  })

  it('includes category, subcategory, format', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      category: 'Community',
      subcategory: 'Youth',
      format: 'Workshop',
    }))
    expect(event.category).toBe('Community')
    expect(event.subcategory).toBe('Youth')
    expect(event.format).toBe('Workshop')
  })

  it('includes top-level status for EventForm compatibility', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      status: 'draft',
    }))
    expect((event as { status?: 'draft' | 'published' }).status).toBe('draft')
  })

  it('includes onlineMeetingUrl and onlineMeetingDetails', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      onlineMeetingUrl: 'https://zoom.us/j/456',
      onlineMeetingDetails: 'Meeting ID: 456',
    }))
    expect(event.onlineMeetingUrl).toBe('https://zoom.us/j/456')
    expect(event.onlineMeetingDetails).toBe('Meeting ID: 456')
  })

  it('derives costDescription from cost.description', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: { amount: 10, currency: 'USD', description: 'Early bird discount' },
    }))
    expect(event.costDescription).toBe('Early bird discount')
  })

  it('uses top-level costDescription when no cost object', () => {
    const event = firestoreToEventForEdit(DOC_ID, makeFirestoreEvent({
      isFree: false,
      cost: undefined,
      costDescription: 'Legacy cost note',
    }))
    expect(event.costDescription).toBe('Legacy cost note')
  })
})
