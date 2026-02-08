import { describe, it, expect, vi } from 'vitest'
import {
  buildLeadPayload,
  buildCasePayload,
  buildLeadToCaseLink,
  buildLinkingNote,
} from '../paper-intake-mapper'
import type { PaperIntake, ParticipantData } from '@/types/paper-intake'

vi.mock('../search', () => ({
  getLeadSourceId: vi.fn().mockResolvedValue(12345),
}))

describe('Paper Intake Mapper', () => {
  const mockParticipant: ParticipantData = {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '410-555-1234',
    homePhone: '410-555-5678',
    address: {
      street: '123 Main St',
      city: 'Columbia',
      state: 'MD',
      zipCode: '21044',
    },
    canSendJointEmail: true,
    attorney: 'Bob Lawyer',
    bestCallTime: 'Mornings',
    bestMeetTime: 'Weekday evenings',
    demographics: {
      gender: 'Male',
      race: 'White',
      ageRange: '35-44',
      income: '$50,000 - $74,999',
      education: "Bachelor's Degree",
      militaryStatus: 'Veteran',
    },
  }

  const mockIntake: PaperIntake = {
    id: 'intake-123',
    caseNumber: '2026FM0001',
    intakeDate: '2026-02-08',
    intakePerson: 'Jane Staff',
    dataEntryBy: 'user-123',
    dataEntryAt: '2026-02-08T12:00:00Z',
    referralSource: 'District Court',
    disputeType: 'Neighbor',
    disputeDescription: 'Property line dispute',
    isCourtOrdered: true,
    magistrateJudge: 'Judge Smith',
    participant1: mockParticipant,
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
    staffNotes: 'Test notes',
    overallSyncStatus: 'pending',
    createdAt: '2026-02-08T12:00:00Z',
    updatedAt: '2026-02-08T12:00:00Z',
  }

  describe('buildLeadPayload', () => {
    it('should create valid lead payload with all fields', async () => {
      const payload = await buildLeadPayload(mockParticipant, mockIntake, 1)

      expect(payload.FIRST_NAME).toBe('John')
      expect(payload.LAST_NAME).toBe('Doe')
      expect(payload.EMAIL).toBe('john@example.com')
      expect(payload.PHONE).toBe('410-555-1234')
      expect(payload.MOBILE).toBe('410-555-5678')
      expect(payload.ADDRESS_STREET).toBe('123 Main St')
      expect(payload.ADDRESS_CITY).toBe('Columbia')
      expect(payload.ADDRESS_STATE).toBe('MD')
      expect(payload.ADDRESS_POSTCODE).toBe('21044')
    })

    it('should parse full name when first/last not provided', async () => {
      const participant: ParticipantData = {
        name: 'John Michael Doe',
      }

      const payload = await buildLeadPayload(participant, mockIntake, 1)

      expect(payload.FIRST_NAME).toBe('John')
      expect(payload.LAST_NAME).toBe('Michael Doe')
    })

    it('should include demographics in description', async () => {
      const payload = await buildLeadPayload(mockParticipant, mockIntake, 1)

      expect(payload.LEAD_DESCRIPTION).toContain('Demographics')
      expect(payload.LEAD_DESCRIPTION).toContain('Gender: Male')
      expect(payload.LEAD_DESCRIPTION).toContain('Age Range: 35-44')
    })

    it('should include tags', async () => {
      const payload = await buildLeadPayload(mockParticipant, mockIntake, 1)

      expect(payload.TAGS).toBeDefined()
      expect(payload.TAGS?.some((t) => t.TAG_NAME === 'Paper_Intake')).toBe(true)
    })

    it('should include lead source ID', async () => {
      const payload = await buildLeadPayload(mockParticipant, mockIntake, 1)

      expect(payload.LEAD_SOURCE_ID).toBe(12345)
    })
  })

  describe('buildCasePayload', () => {
    it('should create valid case payload', () => {
      const payload = buildCasePayload(mockIntake)

      expect(payload.OPPORTUNITY_NAME).toContain('2026FM0001')
      expect(payload.OPPORTUNITY_NAME).toContain('Doe')
      expect(payload.OPPORTUNITY_STATE).toBe('Open')
      expect(payload.PIPELINE_ID).toBe(989108)
      expect(payload.STAGE_ID).toBe(4075519)
    })

    it('should include custom fields', () => {
      const payload = buildCasePayload(mockIntake)

      const caseNumberField = payload.CUSTOMFIELDS.find(
        (f) => f.FIELD_NAME === 'Case_Number_NEW__c',
      )
      expect(caseNumberField).toBeDefined()

      const referralField = payload.CUSTOMFIELDS.find(
        (f) => f.FIELD_NAME === 'Referral_Source__c',
      )
      expect(referralField?.FIELD_VALUE).toBe('District Court')
    })

    it('should include dispute description in details', () => {
      const payload = buildCasePayload(mockIntake)

      expect(payload.OPPORTUNITY_DETAILS).toContain('Property line dispute')
      expect(payload.OPPORTUNITY_DETAILS).toContain('Phone Checklist')
      expect(payload.OPPORTUNITY_DETAILS).toContain('Staff Assessment')
    })

    it('should handle intake without case number', () => {
      const intakeNoCaseNum = { ...mockIntake, caseNumber: undefined }
      const payload = buildCasePayload(intakeNoCaseNum)

      expect(payload.OPPORTUNITY_NAME).not.toContain('undefined')
      expect(payload.OPPORTUNITY_NAME).toContain('Doe')
    })
  })

  describe('buildLeadToCaseLink', () => {
    it('should create valid link payload', () => {
      const link = buildLeadToCaseLink(12345, 1)

      expect(link.LINK_OBJECT_NAME).toBe('Lead')
      expect(link.LINK_OBJECT_ID).toBe(12345)
      expect(link.DETAILS).toContain('Participant 1')
    })
  })

  describe('buildLinkingNote', () => {
    it('should create note with intake ID', () => {
      const note = buildLinkingNote('intake-123')

      expect(note.TITLE).toBe('Paper Intake Form Linked')
      expect(note.BODY).toContain('intake-123')
    })

    it('should include case number when provided', () => {
      const note = buildLinkingNote('intake-123', '2026FM0001')

      expect(note.BODY).toContain('2026FM0001')
    })
  })
})
