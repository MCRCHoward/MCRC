import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import {
  eventInputToFirestore,
  slugify,
  type EventFormInput,
} from '../event-write-mapper'

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('normalizes unicode characters', () => {
    expect(slugify('Café Résumé')).toBe('cafe-re-sume')
  })

  it('removes special characters', () => {
    expect(slugify('Event! @2024 #Special')).toBe('event-2024-special')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('truncates to 80 characters', () => {
    const input = 'a'.repeat(120)
    expect(slugify(input).length).toBe(80)
  })
})

describe('eventInputToFirestore', () => {
  const baseInput: EventFormInput = {
    title: 'Community Workshop',
    startAt: '2026-08-10T13:00:00.000Z',
    isOnline: false,
    isFree: true,
  }

  it('maps title and generates slug from title when slug is not provided', () => {
    const payload = eventInputToFirestore(baseInput)
    expect(payload.title).toBe('Community Workshop')
    expect(payload.slug).toBe('community-workshop')
  })

  it('uses and slugifies provided slug', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      slug: ' Custom Slug! ',
    })
    expect(payload.slug).toBe('custom-slug')
  })

  it('converts startAt to Firestore Timestamp', () => {
    const payload = eventInputToFirestore(baseInput)
    expect(payload.startAt).toBeInstanceOf(Timestamp)
    expect(payload.startAt.toDate().toISOString()).toBe('2026-08-10T13:00:00.000Z')
  })

  it('converts endAt to Firestore Timestamp when provided', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      endAt: '2026-08-10T14:00:00.000Z',
    })
    expect(payload.endAt).toBeInstanceOf(Timestamp)
    expect(payload.endAt?.toDate().toISOString()).toBe('2026-08-10T14:00:00.000Z')
  })

  it('sets endAt to null when absent', () => {
    const payload = eventInputToFirestore(baseInput)
    expect(payload.endAt).toBeNull()
  })

  it('throws on invalid startAt', () => {
    expect(() =>
      eventInputToFirestore({
        ...baseInput,
        startAt: 'not-a-date',
      }),
    ).toThrow('Invalid date format')
  })

  it('defaults status/listed/isRegistrationRequired', () => {
    const payload = eventInputToFirestore(baseInput)
    expect(payload.status).toBe('published')
    expect(payload.listed).toBe(true)
    expect(payload.isRegistrationRequired).toBe(true)
  })

  it('uses provided status/listed/isRegistrationRequired values', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      status: 'draft',
      listed: false,
      isRegistrationRequired: false,
    })
    expect(payload.status).toBe('draft')
    expect(payload.listed).toBe(false)
    expect(payload.isRegistrationRequired).toBe(false)
  })

  it('clears cost fields when isFree is true', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      isFree: true,
      price: 10,
      currency: 'USD',
      costDescription: 'Ignored',
    })
    expect(payload.cost).toBeUndefined()
    expect(payload.price).toBeUndefined()
    expect(payload.currency).toBeUndefined()
    expect(payload.costDescription).toBeUndefined()
  })

  it('builds normalized cost from provided cost object', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      isFree: false,
      cost: {
        amount: 25,
        currency: 'EUR',
        description: 'Early bird',
      },
    })
    expect(payload.cost).toEqual({
      amount: 25,
      currency: 'EUR',
      description: 'Early bird',
    })
    expect(payload.price).toBe(25)
    expect(payload.currency).toBe('EUR')
    expect(payload.costDescription).toBe('Early bird')
  })

  it('builds cost from legacy price/currency fields', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      isFree: false,
      price: 40,
      currency: 'USD',
      costDescription: 'Standard',
    })
    expect(payload.cost).toEqual({
      amount: 40,
      currency: 'USD',
      description: 'Standard',
    })
    expect(payload.price).toBe(40)
    expect(payload.currency).toBe('USD')
    expect(payload.costDescription).toBe('Standard')
  })

  it('defaults legacy cost currency to USD when omitted', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      isFree: false,
      price: 30,
    })
    expect(payload.cost?.currency).toBe('USD')
  })

  it('includes venue when it has meaningful data', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      venue: {
        name: 'City Hall',
        city: 'Baltimore',
      },
    })
    expect(payload.venue).toEqual({
      name: 'City Hall',
      city: 'Baltimore',
    })
  })

  it('omits venue when provided but empty', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      venue: {
        name: '',
        addressLine1: '',
      },
    })
    expect(payload.venue).toBeUndefined()
  })

  it('passes optional fields through unchanged', () => {
    const payload = eventInputToFirestore({
      ...baseInput,
      summary: 'Event summary',
      descriptionHtml: '<p>Description</p>',
      timezone: 'America/New_York',
      onlineMeetingUrl: 'https://zoom.us/j/123',
      onlineMeetingDetails: 'Passcode: xyz',
      capacity: 100,
      externalRegistrationLink: 'https://register.example.com',
      imageUrl: 'https://example.com/a.jpg',
      secondaryImageUrl: 'https://example.com/b.jpg',
      category: 'Community',
      subcategory: 'Youth',
      format: 'Workshop',
    })
    expect(payload.summary).toBe('Event summary')
    expect(payload.descriptionHtml).toBe('<p>Description</p>')
    expect(payload.timezone).toBe('America/New_York')
    expect(payload.onlineMeetingUrl).toBe('https://zoom.us/j/123')
    expect(payload.onlineMeetingDetails).toBe('Passcode: xyz')
    expect(payload.capacity).toBe(100)
    expect(payload.externalRegistrationLink).toBe('https://register.example.com')
    expect(payload.imageUrl).toBe('https://example.com/a.jpg')
    expect(payload.secondaryImageUrl).toBe('https://example.com/b.jpg')
    expect(payload.category).toBe('Community')
    expect(payload.subcategory).toBe('Youth')
    expect(payload.format).toBe('Workshop')
  })
})
