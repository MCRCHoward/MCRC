import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import {
  initializeAdminForEmulator,
  clearFirestoreData,
  createTestUser,
} from '../utils/admin-emulator-setup'
import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'

let db: Firestore
let auth: Auth

beforeAll(() => {
  const admin = initializeAdminForEmulator()
  db = admin.db
  auth = admin.auth
})

beforeEach(async () => {
  await clearFirestoreData()
})

// ============================================================================
// Full Registration Flow
// ============================================================================

describe('Event Registration Flow (Integration)', () => {
  describe('complete registration lifecycle', () => {
    it('creates event, registers user, cancels registration', async () => {
      const { uid } = await createTestUser(auth, 'lifecycle@example.com', 'lifecycle-user')

      const eventRef = await db.collection('events').add({
        title: 'Integration Test Event',
        slug: 'integration-test-event',
        startAt: new Date(Date.now() + 86400000),
        isArchived: false,
        isRegistrationRequired: true,
        isFree: true,
        status: 'published',
        listed: true,
        capacity: 50,
      })

      const registrationRef = await db.collection('eventRegistrations').add({
        eventId: eventRef.id,
        userId: uid,
        name: 'Test User',
        email: 'lifecycle@example.com',
        registrationDate: new Date().toISOString(),
        status: 'registered',
        emailMarketingConsent: true,
        serviceInterest: 'None',
        eventName: 'Integration Test Event',
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        eventSlug: 'integration-test-event',
      })

      const registrationDoc = await registrationRef.get()
      expect(registrationDoc.exists).toBe(true)
      expect(registrationDoc.data()?.status).toBe('registered')

      await registrationRef.update({ status: 'cancelled' })

      const updatedDoc = await registrationRef.get()
      expect(updatedDoc.data()?.status).toBe('cancelled')
    })
  })

  describe('capacity enforcement', () => {
    it('correctly counts registrations at capacity', async () => {
      const eventRef = await db.collection('events').add({
        title: 'Limited Capacity Event',
        slug: 'limited-capacity',
        startAt: new Date(Date.now() + 86400000),
        isArchived: false,
        isRegistrationRequired: true,
        isFree: true,
        status: 'published',
        listed: true,
        capacity: 2,
      })

      for (let i = 0; i < 2; i++) {
        await db.collection('eventRegistrations').add({
          eventId: eventRef.id,
          userId: `user-${i}`,
          status: 'registered',
          registrationDate: new Date().toISOString(),
        })
      }

      const registrationsQuery = db
        .collection('eventRegistrations')
        .where('eventId', '==', eventRef.id)
        .where('status', '==', 'registered')

      const snapshot = await registrationsQuery.get()

      expect(snapshot.size).toBe(2)
    })
  })

  describe('cancelled registration exclusion', () => {
    it('excludes cancelled registrations from active count', async () => {
      const eventRef = await db.collection('events').add({
        title: 'Mixed Status Event',
        slug: 'mixed-status',
        startAt: new Date(Date.now() + 86400000),
        status: 'published',
      })

      await db.collection('eventRegistrations').add({
        eventId: eventRef.id,
        userId: 'user-1',
        status: 'registered',
      })
      await db.collection('eventRegistrations').add({
        eventId: eventRef.id,
        userId: 'user-2',
        status: 'cancelled',
      })
      await db.collection('eventRegistrations').add({
        eventId: eventRef.id,
        userId: 'user-3',
        status: 'registered',
      })

      const activeQuery = db
        .collection('eventRegistrations')
        .where('eventId', '==', eventRef.id)
        .where('status', '==', 'registered')

      const snapshot = await activeQuery.get()

      expect(snapshot.size).toBe(2)
    })
  })

  describe('duplicate registration prevention', () => {
    it('can query for existing registration by userId and eventId', async () => {
      const eventId = 'test-event-id'
      const userId = 'test-user-id'

      await db.collection('eventRegistrations').add({
        eventId,
        userId,
        status: 'registered',
        registrationDate: new Date().toISOString(),
      })

      const existingQuery = db
        .collection('eventRegistrations')
        .where('userId', '==', userId)
        .where('eventId', '==', eventId)
        .where('status', '==', 'registered')
        .limit(1)

      const snapshot = await existingQuery.get()

      expect(snapshot.empty).toBe(false)
      expect(snapshot.size).toBe(1)
    })
  })

  describe('user registration limit', () => {
    it('can count user active registrations excluding cancelled', async () => {
      const userId = 'prolific-user'

      for (let i = 0; i < 5; i++) {
        await db.collection('eventRegistrations').add({
          eventId: `event-${i}`,
          userId,
          status: 'registered',
          registrationDate: new Date().toISOString(),
        })
      }

      await db.collection('eventRegistrations').add({
        eventId: 'event-cancelled',
        userId,
        status: 'cancelled',
        registrationDate: new Date().toISOString(),
      })

      const userQuery = db
        .collection('eventRegistrations')
        .where('userId', '==', userId)
        .where('status', '==', 'registered')

      const snapshot = await userQuery.get()

      expect(snapshot.size).toBe(5)
    })
  })

  describe('denormalized data integrity', () => {
    it('stores event data snapshot in registration document', async () => {
      const eventRef = await db.collection('events').add({
        title: 'Snapshot Test Event',
        slug: 'snapshot-test',
        startAt: new Date('2026-06-15T10:00:00Z'),
      })

      const registrationRef = await db.collection('eventRegistrations').add({
        eventId: eventRef.id,
        userId: 'user-123',
        status: 'registered',
        eventName: 'Snapshot Test Event',
        eventSlug: 'snapshot-test',
        eventDate: '2026-06-15T10:00:00.000Z',
      })

      const registration = await registrationRef.get()
      const data = registration.data()

      expect(data?.eventName).toBe('Snapshot Test Event')
      expect(data?.eventSlug).toBe('snapshot-test')
      expect(data?.eventDate).toBe('2026-06-15T10:00:00.000Z')
    })
  })

  describe('query ordering', () => {
    it('orders registrations by date descending', async () => {
      const eventId = 'ordered-event'

      const dates = [
        '2026-02-01T10:00:00.000Z',
        '2026-02-03T10:00:00.000Z',
        '2026-02-02T10:00:00.000Z',
      ]

      for (const date of dates) {
        await db.collection('eventRegistrations').add({
          eventId,
          userId: `user-${date}`,
          status: 'registered',
          registrationDate: date,
        })
      }

      const query = db
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .orderBy('registrationDate', 'desc')

      const snapshot = await query.get()
      const registrations = snapshot.docs.map((doc) => doc.data())

      expect(registrations[0]?.registrationDate).toBe('2026-02-03T10:00:00.000Z')
      expect(registrations[1]?.registrationDate).toBe('2026-02-02T10:00:00.000Z')
      expect(registrations[2]?.registrationDate).toBe('2026-02-01T10:00:00.000Z')
    })
  })
})

// ============================================================================
// Index Verification Tests
// ============================================================================

describe('Firestore Index Requirements', () => {
  it('supports eventId + status query for registration count', async () => {
    const query = db
      .collection('eventRegistrations')
      .where('eventId', '==', 'test-event')
      .where('status', '==', 'registered')

    await expect(query.get()).resolves.toBeTruthy()
  })

  it('supports userId + eventId + status query for duplicate check', async () => {
    const query = db
      .collection('eventRegistrations')
      .where('userId', '==', 'test-user')
      .where('eventId', '==', 'test-event')
      .where('status', '==', 'registered')
      .limit(1)

    await expect(query.get()).resolves.toBeTruthy()
  })

  it('supports userId + status query for user limit check', async () => {
    const query = db
      .collection('eventRegistrations')
      .where('userId', '==', 'test-user')
      .where('status', '==', 'registered')

    await expect(query.get()).resolves.toBeTruthy()
  })

  it('supports eventId + orderBy registrationDate for admin view', async () => {
    const query = db
      .collection('eventRegistrations')
      .where('eventId', '==', 'test-event')
      .orderBy('registrationDate', 'desc')

    await expect(query.get()).resolves.toBeTruthy()
  })
})
