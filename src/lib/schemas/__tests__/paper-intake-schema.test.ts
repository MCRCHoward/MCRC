import { describe, it, expect } from 'vitest'
import {
  convertIntakeToFormValues,
  DEFAULT_FORM_VALUES,
  paperIntakeFormSchema,
} from '../paper-intake-schema'
import type { PaperIntake } from '@/types/paper-intake'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMinimalIntake = (overrides?: Partial<PaperIntake>): PaperIntake => ({
  id: 'test-id',
  intakeDate: '2026-03-01',
  disputeDescription: 'Test dispute',
  isCourtOrdered: false,
  dataEntryBy: 'test-user',
  dataEntryAt: '2026-03-01T00:00:00Z',
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
  overallSyncStatus: 'success',
  syncErrors: [],
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...overrides,
})

const createFullIntake = (): PaperIntake => ({
  ...createMinimalIntake(),
  caseNumber: 'CASE-001',
  intakePerson: 'Jane Staff',
  referralSource: 'Community Organization',
  magistrateJudge: 'Judge Smith',
  disputeType: 'Neighbor',
  participant1: {
    participantNumber: 'P1-001',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    homePhone: '555-5678',
    address: {
      street: '123 Main St',
      city: 'Baltimore',
      state: 'MD',
      zipCode: '21201',
    },
    canSendJointEmail: true,
    attorney: 'Bob Lawyer',
    bestCallTime: 'Morning',
    bestMeetTime: 'Afternoon',
    demographics: {
      gender: 'Male',
      race: 'White',
      ageRange: '35-44',
      income: '$50,000 - $74,999',
      education: "Bachelor's Degree",
      militaryStatus: 'Veteran',
    },
  },
  participant2: {
    participantNumber: 'P2-001',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '555-4321',
    address: {
      street: '456 Oak Ave',
      city: 'Columbia',
      state: 'MD',
      zipCode: '21044',
    },
  },
  staffNotes: 'Additional notes here',
})

// =============================================================================
// convertIntakeToFormValues Tests
// =============================================================================

describe('convertIntakeToFormValues', () => {
  describe('required fields', () => {
    it('maps required fields directly', () => {
      const intake = createMinimalIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.intakeDate).toBe('2026-03-01')
      expect(result.disputeDescription).toBe('Test dispute')
      expect(result.isCourtOrdered).toBe(false)
      expect(result.participant1.name).toBe('John Doe')
    })
  })

  describe('optional string fields', () => {
    it('converts undefined to empty string for text inputs', () => {
      const intake = createMinimalIntake({
        caseNumber: undefined,
        intakePerson: undefined,
        magistrateJudge: undefined,
      })
      const result = convertIntakeToFormValues(intake)

      expect(result.caseNumber).toBe('')
      expect(result.intakePerson).toBe('')
      expect(result.magistrateJudge).toBe('')
    })

    it('preserves existing values', () => {
      const intake = createFullIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.caseNumber).toBe('CASE-001')
      expect(result.intakePerson).toBe('Jane Staff')
      expect(result.magistrateJudge).toBe('Judge Smith')
    })
  })

  describe('optionalString schema fields (participantNumber, firstName, lastName)', () => {
    it('uses undefined (not empty string) for optionalString fields', () => {
      const intake = createMinimalIntake()
      const result = convertIntakeToFormValues(intake)

      // These use ?? undefined, not ?? ''
      expect(result.participant1.participantNumber).toBeUndefined()
      expect(result.participant1.firstName).toBeUndefined()
      expect(result.participant1.lastName).toBeUndefined()
    })

    it('preserves existing optionalString values', () => {
      const intake = createFullIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.participant1.participantNumber).toBe('P1-001')
      expect(result.participant1.firstName).toBe('John')
      expect(result.participant1.lastName).toBe('Doe')
    })
  })

  describe('hasParticipant2 derivation', () => {
    it('sets hasParticipant2 = true when P2 has name', () => {
      const intake = createFullIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.hasParticipant2).toBe(true)
    })

    it('sets hasParticipant2 = false when P2 is undefined', () => {
      const intake = createMinimalIntake({ participant2: undefined })
      const result = convertIntakeToFormValues(intake)

      expect(result.hasParticipant2).toBe(false)
    })

    it('sets hasParticipant2 = false when P2 name is empty', () => {
      const intake = createMinimalIntake({
        participant2: { name: '   ' }, // whitespace only
      })
      const result = convertIntakeToFormValues(intake)

      expect(result.hasParticipant2).toBe(false)
    })
  })

  describe('participant2 fallback', () => {
    it('returns undefined when P2 is undefined (for schema validation)', () => {
      const intake = createMinimalIntake({ participant2: undefined })
      const result = convertIntakeToFormValues(intake)

      expect(result.participant2).toBeUndefined()
    })

    it('maps existing P2 data correctly', () => {
      const intake = createFullIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.participant2?.name).toBe('Jane Smith')
      expect(result.participant2?.email).toBe('jane@example.com')
      expect(result.participant2?.address?.city).toBe('Columbia')
    })
  })

  describe('demographics', () => {
    it('maps all demographic fields', () => {
      const intake = createFullIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.participant1.demographics?.gender).toBe('Male')
      expect(result.participant1.demographics?.race).toBe('White')
      expect(result.participant1.demographics?.ageRange).toBe('35-44')
      expect(result.participant1.demographics?.income).toBe('$50,000 - $74,999')
      expect(result.participant1.demographics?.education).toBe(
        "Bachelor's Degree"
      )
      expect(result.participant1.demographics?.militaryStatus).toBe('Veteran')
    })

    it('handles missing demographics gracefully', () => {
      const intake = createMinimalIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.participant1.demographics).toEqual({})
    })
  })

  describe('checklist and assessment', () => {
    it('maps phoneChecklist fields', () => {
      const intake = createMinimalIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.phoneChecklist.explainedProcess).toBe(true)
      expect(result.phoneChecklist.policeInvolvement).toBe(false)
    })

    it('maps staffAssessment fields', () => {
      const intake = createMinimalIntake()
      const result = convertIntakeToFormValues(intake)

      expect(result.staffAssessment.canRepresentSelf).toBe(true)
      expect(result.staffAssessment.noDangerToCenter).toBe(true)
    })
  })

  describe('schema validation', () => {
    it('output passes paperIntakeFormSchema validation', () => {
      const intake = createFullIntake()
      const formValues = convertIntakeToFormValues(intake)

      const parseResult = paperIntakeFormSchema.safeParse(formValues)

      expect(parseResult.success).toBe(true)
    })

    it('minimal intake output passes validation', () => {
      const intake = createMinimalIntake()
      const formValues = convertIntakeToFormValues(intake)

      const parseResult = paperIntakeFormSchema.safeParse(formValues)

      expect(parseResult.success).toBe(true)
    })
  })

  describe('sync/timestamp field exclusion', () => {
    it('does not include sync status fields', () => {
      const intake = createMinimalIntake({
        overallSyncStatus: 'success',
        syncedAt: '2026-03-01T00:00:00Z',
        participant1Sync: { status: 'success', leadId: 123 },
      })
      const result = convertIntakeToFormValues(intake)

      expect(result).not.toHaveProperty('overallSyncStatus')
      expect(result).not.toHaveProperty('syncedAt')
      expect(result).not.toHaveProperty('participant1Sync')
    })

    it('does not include edit tracking fields', () => {
      const intake = createMinimalIntake({
        lastEditedAt: '2026-03-01T00:00:00Z',
        lastEditedBy: 'user-123',
        lastEditedByName: 'Test User',
        editCount: 5,
      })
      const result = convertIntakeToFormValues(intake)

      expect(result).not.toHaveProperty('lastEditedAt')
      expect(result).not.toHaveProperty('lastEditedBy')
      expect(result).not.toHaveProperty('lastEditedByName')
      expect(result).not.toHaveProperty('editCount')
    })
  })
})

// =============================================================================
// DEFAULT_FORM_VALUES Tests
// =============================================================================

describe('DEFAULT_FORM_VALUES', () => {
  it('passes schema validation when required fields are filled', () => {
    const validDefaults = {
      ...DEFAULT_FORM_VALUES,
      disputeDescription: 'Initial',
      participant1: { ...DEFAULT_FORM_VALUES.participant1, name: 'Initial' },
      participant2: DEFAULT_FORM_VALUES.participant2
        ? { ...DEFAULT_FORM_VALUES.participant2, name: 'Initial P2' }
        : undefined,
    }
    const parseResult = paperIntakeFormSchema.safeParse(validDefaults)
    expect(parseResult.success).toBe(true)
  })

  it('uses undefined for optional fields', () => {
    expect(DEFAULT_FORM_VALUES.caseNumber).toBeUndefined()
    expect(DEFAULT_FORM_VALUES.intakePerson).toBeUndefined()
    expect(DEFAULT_FORM_VALUES.staffNotes).toBeUndefined()
  })

  it('uses empty string for required text fields', () => {
    expect(DEFAULT_FORM_VALUES.disputeDescription).toBe('')
    expect(DEFAULT_FORM_VALUES.participant1.name).toBe('')
  })

  it('sets default state to MD', () => {
    expect(DEFAULT_FORM_VALUES.participant1.address?.state).toBe('MD')
    expect(DEFAULT_FORM_VALUES.participant2?.address?.state).toBe('MD')
  })
})
