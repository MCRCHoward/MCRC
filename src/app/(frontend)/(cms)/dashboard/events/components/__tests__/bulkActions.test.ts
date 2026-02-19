import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    batch: vi.fn(() => ({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    doc: vi.fn((path: string) => ({ path })),
  },
}))

vi.mock('@/lib/custom-auth', () => ({
  requireRoleAny: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/events/server', () => ({
  eventInputToFirestore: vi.fn(),
  slugify: vi.fn(),
}))

const {
  bulkArchiveEvents,
  bulkRestoreEvents,
  bulkSetEventStatus,
  bulkSetEventListed,
} = await import('../../firebase-actions')

const { adminDb } = await import('@/lib/firebase-admin')
const { revalidatePath } = await import('next/cache')

describe('Bulk Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('bulkArchiveEvents', () => {
    it('archives multiple events in a batch', async () => {
      const eventIds = ['event-1', 'event-2', 'event-3']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkArchiveEvents(eventIds)

      expect(adminDb.batch).toHaveBeenCalled()
      expect(mockBatch.update).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalled()
      expect(result.success).toBe(3)
      expect(result.failed).toBe(0)
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/events')
      expect(revalidatePath).toHaveBeenCalledWith('/events')
    })

    it('returns empty result for empty array', async () => {
      const result = await bulkArchiveEvents([])

      expect(result.success).toBe(0)
      expect(result.failed).toBe(0)
    })
  })

  describe('bulkRestoreEvents', () => {
    it('restores multiple events in a batch', async () => {
      const eventIds = ['event-1', 'event-2']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkRestoreEvents(eventIds)

      expect(result.success).toBe(2)
      expect(result.failed).toBe(0)
    })

    it('returns empty result for empty array', async () => {
      const result = await bulkRestoreEvents([])

      expect(result.success).toBe(0)
      expect(result.failed).toBe(0)
    })
  })

  describe('bulkSetEventStatus', () => {
    it('sets status to published for multiple events', async () => {
      const eventIds = ['event-1', 'event-2']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkSetEventStatus(eventIds, 'published')

      expect(result.success).toBe(2)
      expect(mockBatch.update).toHaveBeenCalledTimes(2)
    })

    it('sets status to draft for multiple events', async () => {
      const eventIds = ['event-1']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkSetEventStatus(eventIds, 'draft')

      expect(result.success).toBe(1)
    })
  })

  describe('bulkSetEventListed', () => {
    it('sets listed to true for multiple events', async () => {
      const eventIds = ['event-1', 'event-2', 'event-3']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkSetEventListed(eventIds, true)

      expect(result.success).toBe(3)
    })

    it('sets listed to false for multiple events', async () => {
      const eventIds = ['event-1']
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(adminDb.batch).mockReturnValue(
        mockBatch as unknown as ReturnType<typeof adminDb.batch>,
      )

      const result = await bulkSetEventListed(eventIds, false)

      expect(result.success).toBe(1)
    })
  })
})
