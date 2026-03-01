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

vi.mock('@/lib/insightly/paper-intake-updater', () => ({
  updateLeadInInsightly: vi.fn(),
  updateOpportunityInInsightly: vi.fn(),
  linkParticipantToCase: vi.fn(),
}))

vi.mock('@/lib/insightly/paper-intake-mapper', () => ({
  buildLeadPayload: vi.fn().mockResolvedValue({
    FIRST_NAME: 'Test',
    LAST_NAME: 'User',
    LEAD_DESCRIPTION: 'Test',
    TAGS: [{ TAG_NAME: 'Paper_Intake' }],
  }),
  buildCasePayload: vi.fn().mockReturnValue({
    OPPORTUNITY_NAME: 'Test Case',
    CUSTOMFIELDS: [],
  }),
  buildLeadToCaseLink: vi.fn().mockReturnValue({
    LINK_OBJECT_NAME: 'Lead',
    LINK_OBJECT_ID: 12345,
    DETAILS: 'Participant 1',
  }),
  buildLinkingNote: vi.fn().mockReturnValue({ TITLE: '', BODY: '' }),
  parseFullName: vi.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
}))

import { adminDb } from '@/lib/firebase-admin'
import {
  searchForDuplicates,
  initializeLeadSources,
  fetchPaperIntakeHistory,
  updatePaperIntake,
} from '../paper-intake-actions'
import { getCurrentUser, requireRoleAny } from '@/lib/custom-auth'
import {
  checkForDuplicates,
  ensureLeadSourcesExist,
  insightlyRequest,
} from '@/lib/insightly/search'
import {
  updateLeadInInsightly,
  updateOpportunityInInsightly,
  linkParticipantToCase,
} from '@/lib/insightly/paper-intake-updater'
import type {
  LeadSearchResult,
  PaperIntake,
} from '@/types/paper-intake'

// =============================================================================
// Test Helpers (Bug 4)
// =============================================================================

function createMockDocRef(options: {
  exists: boolean
  id: string
  data?: Record<string, unknown>
  onUpdate?: (data: Record<string, unknown>) => void
}) {
  const { exists, id, data = {}, onUpdate } = options
  let currentData = { ...data }

  return {
    id,
    get: vi.fn().mockImplementation(async () => ({
      exists,
      id,
      data: () => currentData,
    })),
    update: vi.fn().mockImplementation(async (updateData: Record<string, unknown>) => {
      currentData = { ...currentData, ...updateData }
      onUpdate?.(updateData)
    }),
    set: vi.fn(),
    delete: vi.fn(),
  }
}

function createTestIntake(overrides?: Partial<PaperIntake>): PaperIntake {
  return {
    id: 'test-intake-123',
    intakeDate: '2026-02-28',
    dataEntryBy: 'user-123',
    dataEntryByName: 'Test User',
    dataEntryAt: '2026-02-28T12:00:00Z',
    disputeDescription: 'Test dispute',
    isCourtOrdered: false,
    participant1: {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    phoneChecklist: {
      explainedProcess: true,
      explainedNeutrality: true,
      explainedConfidentiality: true,
      policeInvolvement: false,
      peaceProtectiveOrder: false,
      safetyScreeningComplete: true,
    },
    staffAssessment: {
      canRepresentSelf: true,
      noFearOfCoercion: true,
      noDangerToSelf: true,
      noDangerToCenter: true,
    },
    overallSyncStatus: 'success',
    createdAt: '2026-02-28T12:00:00Z',
    updatedAt: '2026-02-28T12:00:00Z',
    ...overrides,
  }
}

describe('Paper Intake Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'staff@example.com',
    name: 'Staff Member',
    role: 'coordinator' as const,
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

  describe('updatePaperIntake', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
      vi.mocked(requireRoleAny).mockResolvedValue(mockUser)
    })

    it('should return error when not authenticated', async () => {
      vi.mocked(requireRoleAny).mockRejectedValue(new Error('Unauthorized'))

      const result = await updatePaperIntake('intake-123', {
        disputeDescription: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should return error when intake not found', async () => {
      const mockDoc = createMockDocRef({
        exists: false,
        id: 'nonexistent-id',
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      const result = await updatePaperIntake('nonexistent-id', {
        disputeDescription: 'Updated',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should update existing Lead via PUT when leadId exists', async () => {
      const existingIntake = createTestIntake({
        participant1Sync: { leadId: 12345, status: 'success' },
        caseSync: { caseId: 99999, status: 'success' },
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly).mockResolvedValue({
        leadId: 12345,
        leadUrl: 'https://crm.example.com/Lead/12345',
        status: 'success',
      })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        caseUrl: 'https://crm.example.com/Opportunity/99999',
        status: 'success',
      })

      const result = await updatePaperIntake('intake-123', {
        disputeDescription: 'Updated dispute description',
      })

      expect(result.success).toBe(true)
      expect(updateLeadInInsightly).toHaveBeenCalledWith(
        expect.objectContaining({
          leadId: 12345,
          participantNumber: 1,
        }),
      )
    })

    it('should create Lead via POST when previous sync failed', async () => {
      const existingIntake = createTestIntake({
        participant1Sync: { status: 'failed', error: 'API Error' },
        caseSync: { caseId: 99999, status: 'success' },
        overallSyncStatus: 'partial',
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 11111 })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })

      const result = await updatePaperIntake('intake-123', {
        disputeDescription: 'Fixed data',
      })

      expect(result.success).toBe(true)
      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Leads',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(updateLeadInInsightly).not.toHaveBeenCalled()
    })

    it('should create and link P2 Lead when newly added', async () => {
      const existingIntake = createTestIntake({
        participant1Sync: { leadId: 12345, status: 'success' },
        participant2: undefined,
        participant2Sync: undefined,
        caseSync: { caseId: 99999, status: 'success' },
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly).mockResolvedValue({
        leadId: 12345,
        status: 'success',
      })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })
      vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 67890 })
      vi.mocked(linkParticipantToCase).mockResolvedValue({ success: true })

      const result = await updatePaperIntake('intake-123', {
        participant2: { name: 'Jane Smith', email: 'jane@example.com' },
      })

      expect(result.success).toBe(true)
      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Leads',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(linkParticipantToCase).toHaveBeenCalledWith({
        opportunityId: 99999,
        leadId: 67890,
        participantNumber: 2,
      })
    })

    it('should allow partial participant updates', async () => {
      const existingIntake = createTestIntake({
        participant1: {
          name: 'John Doe',
          email: 'old@example.com',
        },
        participant1Sync: { leadId: 12345, status: 'success' },
        caseSync: { caseId: 99999, status: 'success' },
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly).mockResolvedValue({
        leadId: 12345,
        status: 'success',
      })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })

      const result = await updatePaperIntake('intake-123', {
        participant1: { email: 'new@example.com' },
      })

      expect(result.success).toBe(true)
      expect(result.intake?.participant1.name).toBe('John Doe')
      expect(result.intake?.participant1.email).toBe('new@example.com')
    })

    it('should preserve undefined participant2 when not in input', async () => {
      const existingIntake = createTestIntake({
        participant2: undefined,
        participant2Sync: { status: 'skipped' },
        participant1Sync: { leadId: 12345, status: 'success' },
        caseSync: { caseId: 99999, status: 'success' },
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly).mockResolvedValue({
        leadId: 12345,
        status: 'success',
      })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })

      const result = await updatePaperIntake('intake-123', {
        staffNotes: 'Updated notes',
      })

      expect(result.success).toBe(true)
      expect(result.intake?.participant2).toBeUndefined()
    })

    it('should increment editCount on each update', async () => {
      const existingIntake = createTestIntake({
        participant1Sync: { leadId: 12345, status: 'success' },
        caseSync: { caseId: 99999, status: 'success' },
        editCount: 2,
      })

      let savedData: Record<string, unknown> = {}
      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
        onUpdate: (data) => {
          savedData = data
        },
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly).mockResolvedValue({
        leadId: 12345,
        status: 'success',
      })
      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })

      await updatePaperIntake('intake-123', { staffNotes: 'Updated notes' })

      expect(savedData.editCount).toBe(3)
      expect(savedData.lastEditedBy).toBe(mockUser.id)
    })

    it('should handle partial sync failure gracefully', async () => {
      const existingIntake = createTestIntake({
        participant1: { name: 'John Doe' },
        participant2: { name: 'Jane Smith' },
        participant1Sync: { leadId: 12345, status: 'success' },
        participant2Sync: { leadId: 67890, status: 'success' },
        caseSync: { caseId: 99999, status: 'success' },
      })

      const mockDoc = createMockDocRef({
        exists: true,
        id: 'intake-123',
        data: existingIntake,
      })
      vi.mocked(adminDb.doc).mockReturnValue(mockDoc as never)

      vi.mocked(updateLeadInInsightly)
        .mockResolvedValueOnce({ leadId: 12345, status: 'success' })
        .mockResolvedValueOnce({
          leadId: 67890,
          status: 'failed',
          error: 'API Error',
        })

      vi.mocked(updateOpportunityInInsightly).mockResolvedValue({
        caseId: 99999,
        status: 'success',
      })

      const result = await updatePaperIntake('intake-123', {
        disputeDescription: 'Updated',
      })

      expect(result.success).toBe(true)
      expect(result.intake?.overallSyncStatus).toBe('partial')
      expect(result.intake?.syncErrors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Participant 2'),
        ]),
      )
    })
  })
})
