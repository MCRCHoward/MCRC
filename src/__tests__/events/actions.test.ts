import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockUser,
  createMockAdminUser,
  createMockEventData,
  createMockRegistrationInput,
} from '../utils/test-factories'
import {
  createMockQueryChain,
  createMockDocRef,
  createMockSnapshot,
  createMockCountResult,
} from '../utils/firebase-mocks'

// ============================================================================
// Module Mocks — declared before any action imports
// ============================================================================

const mockAdd = vi.fn()
const eventDocRef = createMockDocRef()

// Query chains for different collection queries (duplicate check, user limit, capacity, etc.)
const registrationsQuery = createMockQueryChain()

const mockCollection = vi.fn().mockReturnValue({
  ...registrationsQuery.chain,
  add: mockAdd,
  doc: vi.fn(),
})

const mockDoc = vi.fn().mockReturnValue(eventDocRef)

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (...args: unknown[]) => mockCollection(...args),
    doc: (...args: unknown[]) => mockDoc(...args),
  },
}))

const mockRequireAuth = vi.fn()
const mockRequireRole = vi.fn()

vi.mock('@/lib/custom-auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/utilities/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue(true),
}))

// Use real implementations for these utilities since they are pure functions
vi.mock('@/utilities/sanitize', async () => {
  const actual = await vi.importActual<typeof import('@/utilities/sanitize')>('@/utilities/sanitize')
  return actual
})

vi.mock('@/utilities/firestore-helpers', async () => {
  const actual =
    await vi.importActual<typeof import('@/utilities/firestore-helpers')>(
      '@/utilities/firestore-helpers',
    )
  return actual
})

vi.mock('@/utilities/event-helpers', async () => {
  const actual =
    await vi.importActual<typeof import('@/utilities/event-helpers')>('@/utilities/event-helpers')
  return actual
})

// Import actions AFTER mocks are set up
import {
  registerForEvent,
  cancelRegistration,
  getUserRegistrationStatus,
  getEventRegistrationCount,
  getEventRegistrations,
  getUserRegistrations,
} from '@/app/(frontend)/(default)/events/[slug]/actions'
import { revalidatePath } from 'next/cache'
import { checkRateLimit } from '@/utilities/rate-limit'

// ============================================================================
// Helpers
// ============================================================================

const mockUser = createMockUser()
const mockAdmin = createMockAdminUser()

/**
 * Sets up the common happy-path mocks for registerForEvent:
 * - Auth returns mockUser
 * - Rate limit allows
 * - Event doc exists with given data
 * - No duplicate registration
 * - User under registration limit
 * - Capacity not reached
 * - Capacity count aggregation returns 0
 * - add() returns a doc ref
 */
function setupHappyPath(eventOverrides: Record<string, unknown> = {}) {
  const eventData = createMockEventData(eventOverrides)

  mockRequireAuth.mockResolvedValue(mockUser)
  vi.mocked(checkRateLimit).mockReturnValue(true)

  // Event doc exists
  eventDocRef.mockGet.mockResolvedValue({
    exists: true,
    data: () => eventData,
    id: 'event-123',
  })

  // Track which call to collection().where().get() we're on.
  // The action makes multiple sequential queries to the registrations collection.
  // Call order for get(): 1) duplicate check, 2) user limit check
  let queryCallCount = 0
  registrationsQuery.mockGet.mockImplementation(() => {
    queryCallCount++
    switch (queryCallCount) {
      case 1: // Duplicate check — no existing registration
        return Promise.resolve(createMockSnapshot())
      case 2: // User limit check — under limit
        return Promise.resolve(createMockSnapshot())
      default:
        return Promise.resolve(createMockSnapshot())
    }
  })
  registrationsQuery.mockCountGet.mockResolvedValue(createMockCountResult(0))

  mockAdd.mockResolvedValue({ id: 'new-registration-id' })

  return { eventData }
}

// ============================================================================
// registerForEvent
// ============================================================================

describe('registerForEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('rejects unauthenticated user', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Not authenticated'))

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow('Not authenticated')
    })

    it('allows authenticated user to register', async () => {
      setupHappyPath()

      const result = await registerForEvent('event-123', createMockRegistrationInput())

      expect(result).toHaveProperty('id')
      expect(result.id).toBe('new-registration-id')
    })
  })

  describe('rate limiting', () => {
    it('rejects when rate limit exceeded', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(false)

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/too many registration attempts/i)
    })

    it('calls checkRateLimit with correct key and params', async () => {
      setupHappyPath()

      await registerForEvent('event-123', createMockRegistrationInput())

      expect(checkRateLimit).toHaveBeenCalledWith(`register:${mockUser.id}`, 5, 60000)
    })
  })

  describe('event validation', () => {
    it('rejects when event not found', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({ exists: false, data: () => undefined })

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow('Event not found')
    })

    it('rejects when event data is null', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({ exists: true, data: () => undefined })

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow('Event data not available')
    })

    it('rejects when event is archived', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData({ isArchived: true }),
      })

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/archived/i)
    })

    it('rejects when registration not required', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData({ isRegistrationRequired: false }),
      })

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/no registration is required/i)
    })

    it('rejects when event date has passed', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)

      const pastEvent = createMockEventData({
        startAt: { toDate: () => new Date(Date.now() - 86400000) },
      })
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => pastEvent,
      })

      // Must pass duplicate + user limit checks before date check
      let queryCallCount = 0
      registrationsQuery.mockGet.mockImplementation(() => {
        queryCallCount++
        return Promise.resolve(createMockSnapshot())
      })

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/already started|passed/i)
    })
  })

  describe('duplicate registration', () => {
    it('rejects duplicate registration for same event', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData(),
      })

      // Duplicate check returns an existing registration
      registrationsQuery.mockGet.mockResolvedValueOnce(
        createMockSnapshot([{ id: 'existing-reg', data: { status: 'registered' } }]),
      )

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/already registered/i)
    })

    it('allows registration when no active duplicate exists', async () => {
      setupHappyPath()

      const result = await registerForEvent('event-123', createMockRegistrationInput())

      expect(result.id).toBe('new-registration-id')
    })
  })

  describe('user registration limit', () => {
    it('rejects when user has 10 active registrations', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData(),
      })

      // Duplicate check — no duplicate
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

      // User limit check — 10 active registrations
      const tenDocs = Array.from({ length: 10 }, (_, i) => ({
        id: `reg-${i}`,
        data: { status: 'registered' },
      }))
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot(tenDocs))

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/maximum limit of 10/i)
    })

    it('allows registration when user has fewer than 10', async () => {
      setupHappyPath()

      const result = await registerForEvent('event-123', createMockRegistrationInput())

      expect(result.id).toBeTruthy()
    })
  })

  describe('capacity check', () => {
    it('rejects when event is at capacity', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData({ capacity: 2 }),
      })

      // Duplicate check — no duplicate
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())
      // User limit check — under limit
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())
      // Capacity count aggregation — at capacity (2 registrations, capacity is 2)
      registrationsQuery.mockCountGet.mockResolvedValueOnce(createMockCountResult(2))

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/full/i)
    })

    it('allows registration when capacity not reached', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData({ capacity: 50 }),
      })

      // Duplicate — none
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())
      // User limit — ok
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())
      // Capacity count aggregation — 25 of 50
      registrationsQuery.mockCountGet.mockResolvedValueOnce(createMockCountResult(25))

      mockAdd.mockResolvedValue({ id: 'new-reg-id' })

      const result = await registerForEvent('event-123', createMockRegistrationInput())
      expect(result.id).toBe('new-reg-id')
    })

    it('skips capacity check when capacity not set', async () => {
      setupHappyPath({ capacity: undefined })

      const result = await registerForEvent('event-123', createMockRegistrationInput())

      expect(result.id).toBeTruthy()
    })
  })

  describe('data handling', () => {
    it('sanitizes input fields (strips HTML tags, lowercases email)', async () => {
      setupHappyPath()

      const dirtyInput = createMockRegistrationInput({
        name: '  John<script>alert("xss")</script>Doe  ',
        email: '  TEST@EXAMPLE.COM  ',
        phone: '  (555) 123-4567  ',
      })

      await registerForEvent('event-123', dirtyInput)

      const savedData = mockAdd.mock.calls[0]?.[0]
      expect(savedData.name).not.toContain('<script>')
      expect(savedData.name).toBe('Johnalert("xss")Doe')
      expect(savedData.email).toBe('test@example.com')
    })

    it('denormalizes event data into registration', async () => {
      setupHappyPath({ title: 'My Event', slug: 'my-event' })

      await registerForEvent('event-123', createMockRegistrationInput())

      const savedData = mockAdd.mock.calls[0]?.[0]
      expect(savedData.eventName).toBe('My Event')
      expect(savedData.eventSlug).toBe('my-event')
      expect(savedData.eventDate).toBeTruthy()
    })

    it('sets initial status to registered', async () => {
      setupHappyPath()

      await registerForEvent('event-123', createMockRegistrationInput())

      const savedData = mockAdd.mock.calls[0]?.[0]
      expect(savedData.status).toBe('registered')
    })

    it('stores userId from authenticated user', async () => {
      setupHappyPath()

      await registerForEvent('event-123', createMockRegistrationInput())

      const savedData = mockAdd.mock.calls[0]?.[0]
      expect(savedData.userId).toBe(mockUser.id)
    })

    it('stores emailMarketingConsent and serviceInterest', async () => {
      setupHappyPath()

      await registerForEvent(
        'event-123',
        createMockRegistrationInput({
          emailMarketingConsent: true,
          serviceInterest: 'Facilitation',
        }),
      )

      const savedData = mockAdd.mock.calls[0]?.[0]
      expect(savedData.emailMarketingConsent).toBe(true)
      expect(savedData.serviceInterest).toBe('Facilitation')
    })
  })

  describe('revalidation', () => {
    it('revalidates event page and my-events', async () => {
      setupHappyPath({ slug: 'test-event' })

      await registerForEvent('event-123', createMockRegistrationInput())

      expect(revalidatePath).toHaveBeenCalledWith('/events/test-event')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/my-events')
    })
  })

  describe('error handling', () => {
    it('surfaces missing index error with formatted message', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      vi.mocked(checkRateLimit).mockReturnValue(true)
      eventDocRef.mockGet.mockResolvedValue({
        exists: true,
        data: () => createMockEventData(),
      })

      // Duplicate check passes
      registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

      // User limit check throws index error
      const indexError = new Error('The query requires an index')
      registrationsQuery.mockGet.mockRejectedValueOnce(indexError)

      await expect(
        registerForEvent('event-123', createMockRegistrationInput()),
      ).rejects.toThrow(/index/i)
    })
  })
})

// ============================================================================
// cancelRegistration
// ============================================================================

describe('cancelRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupCancelMocks(
    registrationUserId: string,
    eventStartAt: { toDate: () => Date },
    authUser = mockUser,
  ) {
    mockRequireAuth.mockResolvedValue(authUser)

    const regDocRef = createMockDocRef()
    const eventDocRefLocal = createMockDocRef()

    regDocRef.mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: registrationUserId,
        eventId: 'event-456',
        eventSlug: 'test-event',
        status: 'registered',
      }),
      id: 'reg-123',
    })

    eventDocRefLocal.mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ startAt: eventStartAt }),
    })

    // First doc() call = registration, second = event
    let docCallCount = 0
    mockDoc.mockImplementation(() => {
      docCallCount++
      if (docCallCount === 1) return regDocRef
      return eventDocRefLocal
    })

    return { regDocRef, eventDocRefLocal }
  }

  describe('authorization', () => {
    it('allows user to cancel own registration', async () => {
      const futureDate = { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) }
      const { regDocRef } = setupCancelMocks(mockUser.id, futureDate)

      await cancelRegistration('reg-123')

      expect(regDocRef.mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
    })

    it('rejects cancellation of other user registration', async () => {
      const futureDate = { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) }
      setupCancelMocks('other-user-id', futureDate)

      await expect(cancelRegistration('reg-123')).rejects.toThrow(/unauthorized/i)
    })

    it('allows admin to cancel any registration', async () => {
      const futureDate = { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) }
      const { regDocRef } = setupCancelMocks('other-user-id', futureDate, mockAdmin)

      await cancelRegistration('reg-123')

      expect(regDocRef.mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
    })
  })

  describe('registration validation', () => {
    it('rejects when registration not found', async () => {
      mockRequireAuth.mockResolvedValue(mockUser)
      const notFoundRef = createMockDocRef(undefined, false)
      notFoundRef.mockGet.mockResolvedValue({ exists: false, data: () => undefined })
      mockDoc.mockReturnValue(notFoundRef)

      await expect(cancelRegistration('reg-123')).rejects.toThrow('Registration not found')
    })
  })

  describe('timing restrictions', () => {
    it('rejects cancellation within 1 hour of event start', async () => {
      const soonDate = { toDate: () => new Date(Date.now() + 30 * 60 * 1000) } // 30 min
      setupCancelMocks(mockUser.id, soonDate)

      await expect(cancelRegistration('reg-123')).rejects.toThrow(
        /no longer available|starting soon/i,
      )
    })

    it('allows cancellation more than 1 hour before event', async () => {
      const laterDate = { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) } // 2 hours
      const { regDocRef } = setupCancelMocks(mockUser.id, laterDate)

      await cancelRegistration('reg-123')

      expect(regDocRef.mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
    })
  })

  describe('revalidation', () => {
    it('revalidates event page and my-events', async () => {
      const futureDate = { toDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) }
      setupCancelMocks(mockUser.id, futureDate)

      await cancelRegistration('reg-123')

      expect(revalidatePath).toHaveBeenCalledWith('/events/test-event')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/my-events')
    })
  })
})

// ============================================================================
// getUserRegistrationStatus
// ============================================================================

describe('getUserRegistrationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns registrationId and status when registered', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(
      createMockSnapshot([{ id: 'reg-456', data: { status: 'registered' } }]),
    )

    const result = await getUserRegistrationStatus('event-123')

    expect(result).toEqual({
      registrationId: 'reg-456',
      status: 'registered',
    })
  })

  it('returns registrationId and status when cancelled', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(
      createMockSnapshot([{ id: 'reg-456', data: { status: 'cancelled' } }]),
    )

    const result = await getUserRegistrationStatus('event-123')

    expect(result).toEqual({
      registrationId: 'reg-456',
      status: 'cancelled',
    })
  })

  it('returns null when no registration exists', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    const result = await getUserRegistrationStatus('event-123')

    expect(result).toBeNull()
  })

  it('queries by userId and eventId without status filter', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getUserRegistrationStatus('event-123')

    // Verify where was called with userId and eventId
    const whereCalls = registrationsQuery.mockWhere.mock.calls
    expect(whereCalls).toContainEqual(['userId', '==', mockUser.id])
    expect(whereCalls).toContainEqual(['eventId', '==', 'event-123'])
    // Verify status was NOT in the where clauses for this action
    const statusCalls = whereCalls.filter(
      (call: unknown[]) => call[0] === 'status',
    )
    expect(statusCalls).toHaveLength(0)
  })

  it('handles missing index error', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockRejectedValueOnce(
      new Error('The query requires an index'),
    )

    await expect(getUserRegistrationStatus('event-123')).rejects.toThrow(/index/i)
  })
})

// ============================================================================
// getEventRegistrationCount
// ============================================================================

describe('getEventRegistrationCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires admin role', async () => {
    mockRequireRole.mockRejectedValue(new Error('Admin required'))

    await expect(getEventRegistrationCount('event-123')).rejects.toThrow('Admin required')
  })

  it('returns count of active registrations using count() aggregation', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockCountGet.mockResolvedValueOnce(createMockCountResult(3))

    const count = await getEventRegistrationCount('event-123')

    expect(count).toBe(3)
    expect(registrationsQuery.mockCount).toHaveBeenCalledTimes(1)
    expect(registrationsQuery.mockGet).not.toHaveBeenCalled()
  })

  it('queries with status == registered', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockCountGet.mockResolvedValueOnce(createMockCountResult(0))

    await getEventRegistrationCount('event-123')

    const whereCalls = registrationsQuery.mockWhere.mock.calls
    expect(whereCalls).toContainEqual(['eventId', '==', 'event-123'])
    expect(whereCalls).toContainEqual(['status', '==', 'registered'])
  })
})

// ============================================================================
// getEventRegistrations
// ============================================================================

describe('getEventRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires admin role', async () => {
    mockRequireRole.mockRejectedValue(new Error('Admin required'))

    await expect(getEventRegistrations('event-123')).rejects.toThrow('Admin required')
  })

  it('returns registrations with id included', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockGet.mockResolvedValueOnce(
      createMockSnapshot([
        { id: 'reg-1', data: { name: 'User 1', status: 'registered' } },
        { id: 'reg-2', data: { name: 'User 2', status: 'cancelled' } },
      ]),
    )

    const registrations = await getEventRegistrations('event-123')

    expect(registrations).toHaveLength(2)
    expect(registrations[0]).toHaveProperty('id', 'reg-1')
    expect(registrations[0]).toHaveProperty('name', 'User 1')
    expect(registrations[1]).toHaveProperty('id', 'reg-2')
  })

  it('orders by registrationDate descending', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getEventRegistrations('event-123')

    expect(registrationsQuery.mockOrderBy).toHaveBeenCalledWith('registrationDate', 'desc')
  })

  it('respects limit parameter', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getEventRegistrations('event-123', 100)

    expect(registrationsQuery.mockLimit).toHaveBeenCalledWith(100)
  })

  it('defaults limit to 500', async () => {
    mockRequireRole.mockResolvedValue(mockAdmin)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getEventRegistrations('event-123')

    expect(registrationsQuery.mockLimit).toHaveBeenCalledWith(500)
  })
})

// ============================================================================
// getUserRegistrations
// ============================================================================

describe('getUserRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows user to view own registrations', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(
      createMockSnapshot([
        { id: 'reg-1', data: { eventName: 'Event 1' } },
        { id: 'reg-2', data: { eventName: 'Event 2' } },
      ]),
    )

    const registrations = await getUserRegistrations(mockUser.id)

    expect(registrations).toHaveLength(2)
  })

  it('rejects viewing other user registrations', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)

    await expect(getUserRegistrations('other-user-id')).rejects.toThrow(/unauthorized/i)
  })

  it('allows admin to view any user registrations', async () => {
    mockRequireAuth.mockResolvedValue(mockAdmin)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    const result = await getUserRegistrations('other-user-id')

    expect(result).toEqual([])
  })

  it('respects limit parameter', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getUserRegistrations(mockUser.id, 50)

    expect(registrationsQuery.mockLimit).toHaveBeenCalledWith(50)
  })

  it('defaults limit to 100', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    registrationsQuery.mockGet.mockResolvedValueOnce(createMockSnapshot())

    await getUserRegistrations(mockUser.id)

    expect(registrationsQuery.mockLimit).toHaveBeenCalledWith(100)
  })
})
