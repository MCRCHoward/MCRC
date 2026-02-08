import { describe, it, expect } from 'vitest'
import {
  REFERRAL_SOURCES,
  DISPUTE_TYPES,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  AGE_RANGES,
  INCOME_RANGES,
  EDUCATION_LEVELS,
  MILITARY_STATUSES,
  type PaperIntakeInput,
  type SyncStatus,
} from '@/types/paper-intake'

describe('Paper Intake Types', () => {
  describe('Constants', () => {
    it('should have expected referral sources', () => {
      expect(REFERRAL_SOURCES).toContain('District Court')
      expect(REFERRAL_SOURCES).toContain('Circuit Court')
      expect(REFERRAL_SOURCES).toContain('Law Enforcement')
      expect(REFERRAL_SOURCES.length).toBeGreaterThanOrEqual(10)
    })

    it('should have expected dispute types', () => {
      expect(DISPUTE_TYPES).toContain('Landlord/Tenant')
      expect(DISPUTE_TYPES).toContain('Neighbor')
      expect(DISPUTE_TYPES).toContain('Family')
      expect(DISPUTE_TYPES).toContain('Business/Contract')
      expect(DISPUTE_TYPES.length).toBeGreaterThanOrEqual(10)
    })

    it('should have demographic options', () => {
      expect(GENDER_OPTIONS.length).toBeGreaterThan(0)
      expect(RACE_OPTIONS.length).toBeGreaterThan(0)
      expect(AGE_RANGES.length).toBeGreaterThan(0)
      expect(INCOME_RANGES.length).toBeGreaterThan(0)
      expect(EDUCATION_LEVELS.length).toBeGreaterThan(0)
      expect(MILITARY_STATUSES.length).toBeGreaterThan(0)
    })
  })

  describe('PaperIntakeInput', () => {
    it('should accept minimal valid input', () => {
      const input: PaperIntakeInput = {
        intakeDate: '2026-02-08',
        dataEntryBy: 'user-123',
        participant1: {
          name: 'John Doe',
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
        isCourtOrdered: false,
        disputeDescription: 'Test dispute',
      }

      expect(input.participant1.name).toBe('John Doe')
    })
  })

  describe('SyncStatus', () => {
    it('should have valid status values', () => {
      const validStatuses: SyncStatus[] = ['pending', 'success', 'failed', 'linked', 'skipped']
      validStatuses.forEach((status) => {
        expect(['pending', 'success', 'failed', 'linked', 'skipped']).toContain(status)
      })
    })
  })
})
