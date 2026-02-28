/**
 * Paper Intake Updater Tests
 *
 * Tests for Insightly update functions used by the edit flow.
 * Uses TDD approach: tests written before implementation.
 *
 * Run: pnpm vitest run src/lib/insightly/__tests__/paper-intake-updater.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// Mocks - Must be before imports
// =============================================================================

vi.mock('../search', () => ({
  insightlyRequest: vi.fn(),
}))

vi.mock('../paper-intake-mapper', () => ({
  buildLeadPayload: vi.fn(),
  buildCasePayload: vi.fn(),
}))

vi.mock('../paper-intake-config', () => ({
  buildLeadUrl: vi.fn((id: number) => `https://crm.na1.insightly.com/details/Lead/${id}`),
  buildCaseUrl: vi.fn((id: number) => `https://crm.na1.insightly.com/details/Opportunity/${id}`),
}))

// =============================================================================
// Imports (after mocks)
// =============================================================================

import {
  updateLeadInInsightly,
  updateOpportunityInInsightly,
  linkParticipantToCase,
} from '../paper-intake-updater'
import { insightlyRequest } from '../search'
import { buildLeadPayload, buildCasePayload } from '../paper-intake-mapper'
import type { PaperIntake } from '@/types/paper-intake'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockIntake = (overrides?: Partial<PaperIntake>): PaperIntake => ({
  id: 'test-intake-123',
  intakeDate: '2026-02-28',
  dataEntryBy: 'user-123',
  dataEntryAt: '2026-02-28T12:00:00Z',
  disputeDescription: 'Test dispute',
  isCourtOrdered: false,
  participant1: {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '410-555-1234',
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
})

const mockLeadPayload = {
  FIRST_NAME: 'John',
  LAST_NAME: 'Doe',
  EMAIL: 'john@example.com',
  PHONE: '410-555-1234',
  LEAD_DESCRIPTION: 'Test description',
  TAGS: [{ TAG_NAME: 'Paper_Intake' }],
}

const mockCasePayload = {
  OPPORTUNITY_NAME: 'Test Case - Doe',
  OPPORTUNITY_STATE: 'Open',
  PIPELINE_ID: 989108,
  STAGE_ID: 4075519,
  CUSTOMFIELDS: [],
}

// =============================================================================
// Tests: updateLeadInInsightly
// =============================================================================

describe('updateLeadInInsightly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildLeadPayload).mockResolvedValue(mockLeadPayload)
  })

  describe('successful updates', () => {
    it('should PUT to /Leads/{id} with LEAD_ID in body', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 12345 })

      const result = await updateLeadInInsightly({
        leadId: 12345,
        intake: createMockIntake(),
        participantNumber: 1,
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Leads/12345',
        expect.objectContaining({
          method: 'PUT',
          body: expect.objectContaining({
            LEAD_ID: 12345,
            FIRST_NAME: 'John',
            LAST_NAME: 'Doe',
          }),
        }),
      )
      expect(result.status).toBe('success')
      expect(result.leadId).toBe(12345)
      expect(result.leadUrl).toContain('/Lead/12345')
    })

    it('should preserve OWNER_USER_ID when provided', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 12345 })

      await updateLeadInInsightly({
        leadId: 12345,
        intake: createMockIntake(),
        participantNumber: 1,
        existingLeadData: {
          ownerUserId: 2221466,
          responsibleUserId: 2221466,
        },
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Leads/12345',
        expect.objectContaining({
          body: expect.objectContaining({
            OWNER_USER_ID: 2221466,
            RESPONSIBLE_USER_ID: 2221466,
          }),
        }),
      )
    })

    it('should build payload for participant 2 when participantNumber is 2', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 67890 })
      const intake = createMockIntake({
        participant2: {
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      })

      await updateLeadInInsightly({
        leadId: 67890,
        intake,
        participantNumber: 2,
      })

      expect(buildLeadPayload).toHaveBeenCalledWith(
        intake.participant2,
        intake,
        2,
      )
    })
  })

  describe('error handling', () => {
    it('should return failed status with error message on API error', async () => {
      vi.mocked(insightlyRequest).mockRejectedValue(
        new Error('Insightly API error (400): Invalid field value'),
      )

      const result = await updateLeadInInsightly({
        leadId: 12345,
        intake: createMockIntake(),
        participantNumber: 1,
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Invalid field value')
      expect(result.leadId).toBe(12345) // Should still include leadId for reference
    })

    it('should handle network errors gracefully', async () => {
      vi.mocked(insightlyRequest).mockRejectedValue(new Error('Network error'))

      const result = await updateLeadInInsightly({
        leadId: 12345,
        intake: createMockIntake(),
        participantNumber: 1,
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Network error')
    })

    it('should return skipped status when participant is missing', async () => {
      const intake = createMockIntake()
      // participant2 is undefined

      const result = await updateLeadInInsightly({
        leadId: 67890,
        intake,
        participantNumber: 2, // But participant2 doesn't exist
      })

      expect(result.status).toBe('skipped')
      expect(insightlyRequest).not.toHaveBeenCalled()
    })
  })
})

// =============================================================================
// Tests: updateOpportunityInInsightly
// =============================================================================

describe('updateOpportunityInInsightly', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildCasePayload).mockReturnValue(mockCasePayload)
  })

  describe('successful updates', () => {
    it('should PUT to /Opportunities/{id} with OPPORTUNITY_ID in body', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({ OPPORTUNITY_ID: 99999 })

      const result = await updateOpportunityInInsightly({
        opportunityId: 99999,
        intake: createMockIntake(),
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Opportunities/99999',
        expect.objectContaining({
          method: 'PUT',
          body: expect.objectContaining({
            OPPORTUNITY_ID: 99999,
            OPPORTUNITY_NAME: 'Test Case - Doe',
          }),
        }),
      )
      expect(result.status).toBe('success')
      expect(result.caseId).toBe(99999)
      expect(result.caseUrl).toContain('/Opportunity/99999')
    })

    it('should include CUSTOMFIELDS in payload', async () => {
      const payloadWithCustomFields = {
        ...mockCasePayload,
        CUSTOMFIELDS: [
          {
            FIELD_NAME: 'Referral_Source__c',
            FIELD_VALUE: 'District Court ADR Pre-Trial',
          },
        ],
      }
      vi.mocked(buildCasePayload).mockReturnValue(payloadWithCustomFields)
      vi.mocked(insightlyRequest).mockResolvedValue({ OPPORTUNITY_ID: 99999 })

      await updateOpportunityInInsightly({
        opportunityId: 99999,
        intake: createMockIntake(),
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Opportunities/99999',
        expect.objectContaining({
          body: expect.objectContaining({
            CUSTOMFIELDS: expect.arrayContaining([
              expect.objectContaining({ FIELD_NAME: 'Referral_Source__c' }),
            ]),
          }),
        }),
      )
    })
  })

  describe('error handling', () => {
    it('should return failed status with error message on API error', async () => {
      vi.mocked(insightlyRequest).mockRejectedValue(
        new Error('Insightly API error (400): Referral Source is invalid'),
      )

      const result = await updateOpportunityInInsightly({
        opportunityId: 99999,
        intake: createMockIntake(),
      })

      expect(result.status).toBe('failed')
      expect(result.error).toContain('Referral Source is invalid')
      expect(result.caseId).toBe(99999)
    })
  })
})

// =============================================================================
// Tests: linkParticipantToCase
// =============================================================================

describe('linkParticipantToCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful linking', () => {
    it('should POST to /Opportunities/{id}/Links with correct body', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({})

      const result = await linkParticipantToCase({
        opportunityId: 99999,
        leadId: 12345,
        participantNumber: 2,
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Opportunities/99999/Links',
        expect.objectContaining({
          method: 'POST',
          body: {
            LINK_OBJECT_NAME: 'Lead',
            LINK_OBJECT_ID: 12345,
            DETAILS: 'Participant 2',
          },
        }),
      )
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle participant 1 linking', async () => {
      vi.mocked(insightlyRequest).mockResolvedValue({})

      await linkParticipantToCase({
        opportunityId: 99999,
        leadId: 11111,
        participantNumber: 1,
      })

      expect(insightlyRequest).toHaveBeenCalledWith(
        '/Opportunities/99999/Links',
        expect.objectContaining({
          body: expect.objectContaining({
            DETAILS: 'Participant 1',
          }),
        }),
      )
    })
  })

  describe('error handling', () => {
    it('should return error on API failure', async () => {
      vi.mocked(insightlyRequest).mockRejectedValue(new Error('Link already exists'))

      const result = await linkParticipantToCase({
        opportunityId: 99999,
        leadId: 12345,
        participantNumber: 2,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Link already exists')
    })
  })
})
