import { describe, expect, it } from 'vitest'
import { eventFormSchema } from '../eventFormSchema'

function buildValidInput() {
  return {
    title: 'Community Workshop',
    slug: 'community-workshop',
    summary: 'A short summary',
    descriptionHtml: '<p>Details</p>',
    externalRegistrationLink: '',
    startDate: '2026-03-10',
    startTime: '10:00',
    endDate: '2026-03-10',
    endTime: '12:00',
    timezone: 'America/New_York',
    isOnline: true,
    isRegistrationRequired: true,
    venueName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    onlineMeetingUrl: 'https://zoom.us/j/123456',
    onlineMeetingDetails: 'Use passcode 123',
    capacity: '50',
    isFree: false,
    price: '25.00',
    currency: 'USD',
    costDescription: 'Per attendee',
    listed: true,
    status: 'published',
    category: 'Business',
    subcategory: 'Mediation',
    format: 'Workshop',
    imageFile: undefined,
    secondaryImageFile: undefined,
  } as const
}

describe('eventFormSchema', () => {
  it('parses a valid form payload', () => {
    const result = eventFormSchema.safeParse(buildValidInput())
    expect(result.success).toBe(true)
  })

  it('rejects invalid slug format', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      slug: 'Invalid Slug',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.includes('slug'))).toBe(true)
  })

  it('requires a venue or address fields when not online', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      isOnline: false,
      venueName: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.includes('venueName'))).toBe(true)
  })

  it('requires price and currency when event is not free', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      isFree: false,
      price: undefined,
      currency: undefined,
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.includes('price'))).toBe(true)
  })

  it('validates end date/time after start date/time', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      startDate: '2026-03-10',
      startTime: '14:00',
      endDate: '2026-03-10',
      endTime: '12:00',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path.includes('endDate'))).toBe(true)
  })

  it('transforms numeric string capacity to number', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      capacity: '125',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.capacity).toBe(125)
  })

  it('transforms numeric string price to number', () => {
    const result = eventFormSchema.safeParse({
      ...buildValidInput(),
      price: '49.99',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.price).toBe(49.99)
  })
})
