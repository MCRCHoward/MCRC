import type { EventRegistration, EventRegistrationInput } from '@/types/event-registration'

/**
 * Mock user matching the User interface shape from src/types/user.ts.
 */
export interface MockUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'coordinator' | 'mediator' | 'participant' | 'volunteer'
  createdAt: string
  updatedAt: string
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'participant',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createMockAdminUser(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    ...overrides,
  })
}

/**
 * Firestore event document data as it would appear from `eventDoc.data()`.
 */
export function createMockEventData(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Event',
    slug: 'test-event',
    startAt: { toDate: () => new Date(Date.now() + 86400000) }, // Tomorrow
    isArchived: false,
    isRegistrationRequired: true,
    isFree: true,
    status: 'published',
    listed: true,
    capacity: 100,
    ...overrides,
  }
}

export function createMockRegistrationInput(
  overrides: Partial<EventRegistrationInput> = {},
): EventRegistrationInput {
  return {
    eventId: 'event-123',
    name: 'Test Registrant',
    email: 'registrant@example.com',
    emailMarketingConsent: true,
    serviceInterest: 'Mediation',
    ...overrides,
  }
}

export function createMockRegistration(
  overrides: Partial<EventRegistration> = {},
): EventRegistration {
  return {
    eventId: 'event-123',
    userId: 'user-123',
    name: 'Test Registrant',
    email: 'registrant@example.com',
    registrationDate: '2026-02-15T10:00:00.000Z',
    status: 'registered',
    emailMarketingConsent: false,
    serviceInterest: 'None',
    eventName: 'Test Event',
    eventDate: '2026-06-15T10:00:00.000Z',
    eventSlug: 'test-event',
    ...overrides,
  }
}
