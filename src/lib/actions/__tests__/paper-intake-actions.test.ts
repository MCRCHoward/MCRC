import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({ get: vi.fn() })),
        })),
        limit: vi.fn(() => ({ get: vi.fn() })),
        get: vi.fn(),
      })),
      add: vi.fn(),
    })),
    doc: vi.fn(),
  },
}))

vi.mock('@/lib/custom-auth', () => ({
  getCurrentUser: vi.fn(),
  requireRoleAny: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/insightly/search', () => ({
  checkForDuplicates: vi.fn(),
  ensureLeadSourcesExist: vi.fn(),
  insightlyRequest: vi.fn(),
}))

vi.mock('@/lib/insightly/paper-intake-config', () => ({
  buildCaseUrl: vi.fn(),
  buildLeadUrl: vi.fn(),
  isInsightlyConfigured: vi.fn(() => true),
  INSIGHTLY_API_KEY: 'test-key',
  INSIGHTLY_API_URL: 'https://api.test-insightly.com/v3.1',
}))

import {
  searchForDuplicates,
  initializeLeadSources,
  fetchPaperIntakeHistory,
} from '../paper-intake-actions'
import { getCurrentUser, requireRoleAny } from '@/lib/custom-auth'
import { checkForDuplicates, ensureLeadSourcesExist } from '@/lib/insightly/search'
import type { LeadSearchResult } from '@/types/paper-intake'

describe('Paper Intake Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'staff@example.com',
    name: 'Staff Member',
    role: 'coordinator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(requireRoleAny).mockResolvedValue(mockUser)
  })

  describe('searchForDuplicates', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const result = await searchForDuplicates('John Doe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('should call checkForDuplicates with name and email', async () => {
      vi.mocked(checkForDuplicates).mockResolvedValue({
        hasPotentialDuplicates: true,
        matches: [
          {
            leadId: 1,
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            leadStatus: 'Unknown',
            leadUrl: 'https://example.com',
            createdAt: '2026-01-01T00:00:00Z',
          } as LeadSearchResult,
        ],
        searchedName: 'John Doe',
      })

      const result = await searchForDuplicates('John Doe', 'john@example.com')

      expect(result.success).toBe(true)
      expect(result.result?.hasPotentialDuplicates).toBe(true)
      expect(checkForDuplicates).toHaveBeenCalledWith('John Doe', 'john@example.com')
    })
  })

  describe('initializeLeadSources', () => {
    it('should call ensureLeadSourcesExist for admin', async () => {
      vi.mocked(ensureLeadSourcesExist).mockResolvedValue({
        success: true,
        leadSources: { 'Paper Intake': 99 },
        created: ['Paper Intake'],
        errors: [],
      })

      const result = await initializeLeadSources()

      expect(result.success).toBe(true)
      expect(result.created).toContain('Paper Intake')
    })
  })

  describe('fetchPaperIntakeHistory', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const result = await fetchPaperIntakeHistory()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })
  })
})
