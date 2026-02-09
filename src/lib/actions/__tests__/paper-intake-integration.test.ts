/**
 * Paper Intake Integration Tests
 *
 * Tests the complete flow from form submission to Insightly sync.
 * Uses mocked Insightly API responses but exercises real validation logic.
 *
 * Run with: pnpm test:integration -- --run
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

// Mock the custom auth module
vi.mock('@/lib/custom-auth', () => ({
  getCurrentUser: vi.fn(),
  requireRoleAny: vi.fn(),
}))

// Mock Insightly search module
vi.mock('@/lib/insightly/search', () => ({
  checkForDuplicates: vi.fn(),
  searchLeadsByName: vi.fn(),
  searchLeadsByEmail: vi.fn(),
  getLeadSourceId: vi.fn(),
  ensureLeadSourcesExist: vi.fn(),
  insightlyRequest: vi.fn(),
  getLeadById: vi.fn(),
}))

// Mock next/cache to avoid "static generation store missing" in vitest
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock firebase-admin Firestore so tests don't hit real database
// Uses vi.hoisted() so the store is available inside hoisted vi.mock factories
const {
  firestoreStore,
  resetFirestoreStore,
  createMockDocRef,
  createMockDocSnapshot,
} = vi.hoisted(() => {
  const store: { data: Record<string, Record<string, unknown>>; counter: number } = {
    data: {},
    counter: 0,
  }

  function createSnapshot(docId: string, docData: Record<string, unknown> | undefined) {
    return {
      id: docId,
      exists: docData !== undefined,
      data: () => docData ?? {},
    }
  }

  function createDocRef(docId: string) {
    return {
      id: docId,
      get: async () => {
        const d = store.data[docId]
        return createSnapshot(docId, d)
      },
      update: async (updateData: Record<string, unknown>) => {
        if (store.data[docId]) {
          store.data[docId] = { ...store.data[docId], ...updateData }
        }
      },
      set: async (d: Record<string, unknown>) => {
        store.data[docId] = d
      },
      delete: async () => {
        delete store.data[docId]
      },
    }
  }

  return {
    firestoreStore: store,
    resetFirestoreStore: () => {
      store.data = {}
      store.counter = 0
    },
    createMockDocRef: createDocRef,
    createMockDocSnapshot: createSnapshot,
  }
})

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: () => ({
      add: async (data: Record<string, unknown>) => {
        firestoreStore.counter++
        const docId = `mock-doc-${firestoreStore.counter}`
        firestoreStore.data[docId] = {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return createMockDocRef(docId)
      },
      doc: (docId: string) => createMockDocRef(docId),
      orderBy: function () { return this },
      where: function () { return this },
      limit: function () { return this },
      get: async () => {
        const docs = Object.entries(firestoreStore.data).map(([id, d]) =>
          createMockDocSnapshot(id, d),
        )
        return { docs, empty: docs.length === 0, size: docs.length }
      },
    }),
    doc: (path: string) => {
      const docId = path.split('/').pop() || path
      return createMockDocRef(docId)
    },
  },
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue({ _methodName: 'serverTimestamp' }),
  },
  Timestamp: {
    now: vi.fn().mockReturnValue({ toDate: () => new Date() }),
  },
}))

// Mock paper-intake-config to provide Insightly config values in test environment
// Use plain functions (not vi.fn()) to prevent vi.resetAllMocks from clearing them
vi.mock('@/lib/insightly/paper-intake-config', () => ({
  INSIGHTLY_API_KEY: 'test-api-key',
  INSIGHTLY_API_URL: 'https://api.na1.insightly.com/v3.1',
  INSIGHTLY_WEB_BASE_URL: 'https://crm.na1.insightly.com',
  isInsightlyConfigured: () => true,
  buildLeadUrl: (id: number) => `https://crm.na1.insightly.com/details/Lead/${id}`,
  buildCaseUrl: (id: number) => `https://crm.na1.insightly.com/details/Opportunity/${id}`,
  parseCaseNumber: () => null,
}))

// Mock timestamp helpers - plain function to prevent reset clearing it
vi.mock('@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers', () => ({
  toISOString: (val: unknown) => {
    if (!val) return undefined
    if (typeof val === 'string') return val
    if (val && typeof val === 'object' && 'toDate' in val) {
      return (val as { toDate: () => Date }).toDate().toISOString()
    }
    return new Date().toISOString()
  },
}))

// Mock Insightly mapper - mock all exported functions to avoid config dependencies
vi.mock('@/lib/insightly/paper-intake-mapper', () => ({
  buildLeadPayload: vi.fn().mockResolvedValue({
    FIRST_NAME: 'Test',
    LAST_NAME: 'User',
    LEAD_DESCRIPTION: 'Test description',
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
  buildLinkingNote: vi.fn().mockReturnValue({
    TITLE: 'Paper Intake Form Linked',
    BODY: 'Test linking note',
  }),
  parseFullName: vi.fn().mockReturnValue({ firstName: 'Test', lastName: 'User' }),
}))

// =============================================================================
// Imports (after mocks)
// =============================================================================

import { getCurrentUser, requireRoleAny } from '@/lib/custom-auth'
import {
  checkForDuplicates,
  insightlyRequest,
  ensureLeadSourcesExist,
} from '@/lib/insightly/search'
import {
  searchForDuplicates,
  createPaperIntake,
  fetchPaperIntakeHistory,
  retrySyncPaperIntake,
  getPaperIntakeStats,
} from '@/lib/actions/paper-intake-actions'
import type { PaperIntakeInput } from '@/types/paper-intake'

// =============================================================================
// Test Fixtures
// =============================================================================

const mockCoordinatorUser = {
  id: 'test-coordinator-123',
  email: 'coordinator@mcrc.test',
  name: 'Test Coordinator',
  role: 'coordinator' as const,
}

const mockAdminUser = {
  id: 'test-admin-456',
  email: 'admin@mcrc.test',
  name: 'Test Admin',
  role: 'admin' as const,
}

const createValidIntakeInput = (overrides?: Partial<PaperIntakeInput>): PaperIntakeInput => ({
  caseNumber: '2026FM0001',
  intakeDate: '2026-02-09',
  intakePerson: 'Test Coordinator',
  referralSource: 'District Court',
  isCourtOrdered: true,
  magistrateJudge: 'Judge Smith',
  disputeType: 'Landlord/Tenant',
  disputeDescription: 'Dispute over security deposit return after lease termination.',
  participant1: {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(410) 555-1234',
    address: {
      street: '123 Main St',
      city: 'Columbia',
      state: 'MD',
      zipCode: '21044',
    },
    canSendJointEmail: true,
    demographics: {
      gender: 'Male',
      ageRange: '35-44',
    },
  },
  participant2: {
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(410) 555-5678',
    address: {
      street: '456 Oak Ave',
      city: 'Ellicott City',
      state: 'MD',
      zipCode: '21043',
    },
    canSendJointEmail: false,
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
  staffNotes: 'Paper form had some water damage, transcribed as best as possible.',
  dataEntryBy: 'test-coordinator-123',
  dataEntryByName: 'Test Coordinator',
  ...overrides,
})

const createMinimalIntakeInput = (): PaperIntakeInput => ({
  intakeDate: '2026-02-09',
  isCourtOrdered: false,
  disputeDescription: 'Minimal test dispute description.',
  participant1: {
    name: 'Minimal User',
  },
  phoneChecklist: {
    explainedProcess: false,
    explainedNeutrality: false,
    explainedConfidentiality: false,
    policeInvolvement: false,
    peaceProtectiveOrder: false,
    safetyScreeningComplete: false,
  },
  staffAssessment: {
    canRepresentSelf: true,
    noFearOfCoercion: true,
    noDangerToSelf: true,
    noDangerToCenter: true,
  },
  dataEntryBy: 'test-coordinator-123',
})

// =============================================================================
// Test Suites
// =============================================================================

describe('Paper Intake Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset Firestore store between tests
    resetFirestoreStore()

    // Default mock implementations
    vi.mocked(getCurrentUser).mockResolvedValue(mockCoordinatorUser)
    vi.mocked(requireRoleAny).mockResolvedValue(mockCoordinatorUser)
    vi.mocked(ensureLeadSourcesExist).mockResolvedValue(undefined)

    vi.mocked(checkForDuplicates).mockResolvedValue({
      hasPotentialDuplicates: false,
      matches: [],
      searchedName: 'Test User',
    })

    // Mock successful Insightly API responses
    vi.mocked(insightlyRequest).mockImplementation(async (endpoint, options) => {
      if (endpoint === '/Leads' && options?.method === 'POST') {
        return { LEAD_ID: Math.floor(Math.random() * 1000000) + 1 }
      }
      if (endpoint === '/Opportunities' && options?.method === 'POST') {
        return { OPPORTUNITY_ID: Math.floor(Math.random() * 1000000) + 1 }
      }
      if (endpoint.includes('/Links') && options?.method === 'POST') {
        return { success: true }
      }
      if (endpoint.includes('/Notes') && options?.method === 'POST') {
        return { NOTE_ID: Math.floor(Math.random() * 1000000) + 1 }
      }
      return {}
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Duplicate Search Tests
  // ===========================================================================

  describe('searchForDuplicates', () => {
    it('should return success with no duplicates for new participant', async () => {
      vi.mocked(checkForDuplicates).mockResolvedValue({
        hasPotentialDuplicates: false,
        matches: [],
        searchedName: 'New Person',
      })

      const result = await searchForDuplicates('New Person', 'new@example.com')

      expect(result.success).toBe(true)
      expect(result.result).toBeDefined()
      expect(result.result?.hasPotentialDuplicates).toBe(false)
      expect(result.result?.matches).toHaveLength(0)
    })

    it('should return matches when duplicates found', async () => {
      vi.mocked(checkForDuplicates).mockResolvedValue({
        hasPotentialDuplicates: true,
        matches: [
          {
            leadId: 12345,
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '(410) 555-1234',
            leadStatus: 'Not Contacted',
            leadUrl: 'https://crm.na1.insightly.com/details/Lead/12345',
            tags: ['Mediation', 'MCRC'],
          },
          {
            leadId: 67890,
            fullName: 'John D.',
            email: 'johnd@example.com',
            leadStatus: 'Contacted',
            leadUrl: 'https://crm.na1.insightly.com/details/Lead/67890',
            tags: ['Paper_Intake'],
          },
        ],
        searchedName: 'John Doe',
      })

      const result = await searchForDuplicates('John Doe', 'john@example.com')

      expect(result.success).toBe(true)
      expect(result.result?.hasPotentialDuplicates).toBe(true)
      expect(result.result?.matches).toHaveLength(2)
      expect(result.result?.matches[0].fullName).toBe('John Doe')
    })

    it('should search without email', async () => {
      const result = await searchForDuplicates('Name Only')

      expect(result.success).toBe(true)
      expect(checkForDuplicates).toHaveBeenCalledWith('Name Only', undefined)
    })

    it('should handle search API errors gracefully', async () => {
      vi.mocked(checkForDuplicates).mockRejectedValue(new Error('API connection failed'))

      const result = await searchForDuplicates('Test User')

      expect(result.success).toBe(false)
      expect(result.error).toContain('API connection failed')
    })
  })

  // ===========================================================================
  // Create Intake Tests
  // ===========================================================================

  describe('createPaperIntake', () => {
    it('should create intake with full data successfully', async () => {
      const input = createValidIntakeInput()

      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
      expect(result.intake).toBeDefined()
      expect(result.intake?.id).toBeDefined()
      expect(result.intake?.participant1.name).toBe('John Doe')
      expect(result.intake?.participant2?.name).toBe('Jane Smith')
    })

    it('should create intake with minimal required data', async () => {
      const input = createMinimalIntakeInput()

      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
      expect(result.intake).toBeDefined()
      expect(result.intake?.participant1.name).toBe('Minimal User')
      expect(result.intake?.participant2).toBeUndefined()
    })

    it('should handle single participant case', async () => {
      const input = createValidIntakeInput({ participant2: undefined })

      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
      expect(result.intake?.participant2).toBeUndefined()
    })

    it('should link to existing Lead when participant1LinkedLeadId provided', async () => {
      const input = createValidIntakeInput()

      const result = await createPaperIntake(input, {
        participant1LinkedLeadId: 12345,
      })

      expect(result.success).toBe(true)
      // The sync should mark P1 as linked rather than created
      expect(result.intake?.participant1Sync?.status).toBe('linked')
    })

    it('should link to existing Leads for both participants', async () => {
      const input = createValidIntakeInput()

      const result = await createPaperIntake(input, {
        participant1LinkedLeadId: 12345,
        participant2LinkedLeadId: 67890,
      })

      expect(result.success).toBe(true)
      expect(result.intake?.participant1Sync?.status).toBe('linked')
      expect(result.intake?.participant2Sync?.status).toBe('linked')
    })

    it('should handle Insightly Lead creation failure', async () => {
      vi.mocked(insightlyRequest).mockRejectedValue(
        new Error('Insightly API rate limit exceeded')
      )

      const input = createValidIntakeInput()
      const result = await createPaperIntake(input)

      // Should still succeed (Firestore save) but with failed sync
      expect(result.success).toBe(true)
      expect(result.intake?.overallSyncStatus).toBe('failed')
      expect(result.intake?.syncErrors).toBeDefined()
      expect(result.intake?.syncErrors?.length).toBeGreaterThan(0)
    })

    it('should handle partial sync failure (P1 succeeds, P2 fails)', async () => {
      let callCount = 0
      vi.mocked(insightlyRequest).mockImplementation(async (endpoint, options) => {
        callCount++
        // First Lead creation succeeds, second fails
        if (endpoint === '/Leads' && options?.method === 'POST') {
          if (callCount === 1) {
            return { LEAD_ID: 11111 }
          }
          throw new Error('Rate limit on second call')
        }
        return { OPPORTUNITY_ID: 99999 }
      })

      const input = createValidIntakeInput()
      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
      expect(result.intake?.overallSyncStatus).toBe('partial')
    })

    it('should reject intake with missing required fields', async () => {
      const input = createValidIntakeInput({
        intakeDate: '', // Required field empty
      })

      const result = await createPaperIntake(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject intake with invalid email format', async () => {
      const input = createValidIntakeInput({
        participant1: {
          name: 'Test User',
          email: 'not-valid-email',
        },
      })

      const result = await createPaperIntake(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('email')
    })

    it('should accept empty optional string fields', async () => {
      const input = createValidIntakeInput({
        caseNumber: undefined,
        intakePerson: undefined,
        magistrateJudge: undefined,
        staffNotes: undefined,
      })

      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // History & Stats Tests
  // ===========================================================================

  describe('fetchPaperIntakeHistory', () => {
    it('should return array of intakes', async () => {
      const result = await fetchPaperIntakeHistory()

      expect(result.success).toBe(true)
      expect(Array.isArray(result.intakes)).toBe(true)
    })

    it('should handle empty collection', async () => {
      const result = await fetchPaperIntakeHistory()

      expect(result.success).toBe(true)
      // May be empty or have entries from other tests
    })
  })

  describe('getPaperIntakeStats', () => {
    it('should return stats object with all required fields', async () => {
      const result = await getPaperIntakeStats()

      expect(result.success).toBe(true)
      expect(result.stats).toBeDefined()
      expect(typeof result.stats?.total).toBe('number')
      expect(typeof result.stats?.synced).toBe('number')
      expect(typeof result.stats?.failed).toBe('number')
      expect(typeof result.stats?.partial).toBe('number')
      expect(typeof result.stats?.pending).toBe('number')
    })

    it('should have non-negative counts', async () => {
      const result = await getPaperIntakeStats()

      expect(result.stats?.total).toBeGreaterThanOrEqual(0)
      expect(result.stats?.synced).toBeGreaterThanOrEqual(0)
      expect(result.stats?.failed).toBeGreaterThanOrEqual(0)
      expect(result.stats?.partial).toBeGreaterThanOrEqual(0)
      expect(result.stats?.pending).toBeGreaterThanOrEqual(0)
    })
  })

  // ===========================================================================
  // Retry Tests
  // ===========================================================================

  describe('retrySyncPaperIntake', () => {
    it('should fail with invalid intake ID', async () => {
      const result = await retrySyncPaperIntake('nonexistent-id-12345')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    // Note: Full retry test requires creating a failed intake first
    // This would be better tested in an E2E test with real Firestore
  })

  // ===========================================================================
  // Authorization Tests
  // ===========================================================================

  describe('Authorization', () => {
    it('should reject unauthenticated user', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)
      vi.mocked(requireRoleAny).mockRejectedValue(new Error('Unauthorized'))

      const result = await searchForDuplicates('Test User')

      // Behavior depends on implementation - might return error or throw
      expect(result.success === false || result.error).toBeTruthy()
    })

    it('should allow coordinator to create intake', async () => {
      vi.mocked(requireRoleAny).mockResolvedValue(mockCoordinatorUser)

      const input = createMinimalIntakeInput()
      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
    })

    it('should allow admin to create intake', async () => {
      vi.mocked(requireRoleAny).mockResolvedValue(mockAdminUser)

      const input = createMinimalIntakeInput()
      const result = await createPaperIntake(input)

      expect(result.success).toBe(true)
    })
  })
})

// =============================================================================
// Data Validation Edge Cases
// =============================================================================

describe('Data Validation Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFirestoreStore()
    vi.mocked(getCurrentUser).mockResolvedValue(mockCoordinatorUser)
    vi.mocked(requireRoleAny).mockResolvedValue(mockCoordinatorUser)
    vi.mocked(ensureLeadSourcesExist).mockResolvedValue(undefined)
    vi.mocked(insightlyRequest).mockResolvedValue({ LEAD_ID: 1, OPPORTUNITY_ID: 1 })
  })

  it('should handle participant name with special characters', async () => {
    const input = createMinimalIntakeInput()
    input.participant1.name = "O'Brien-Smith, Jr."

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
    expect(result.intake?.participant1.name).toBe("O'Brien-Smith, Jr.")
  })

  it('should handle very long dispute description', async () => {
    const input = createMinimalIntakeInput()
    input.disputeDescription = 'A'.repeat(5000)

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
  })

  it('should handle all demographics fields filled', async () => {
    const input = createValidIntakeInput({
      participant1: {
        name: 'Full Demographics User',
        demographics: {
          gender: 'Female',
          race: 'Asian',
          ageRange: '25-34',
          income: '$50,000 - $74,999',
          education: "Bachelor's Degree",
          militaryStatus: 'Veteran',
        },
      },
    })

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
    expect(result.intake?.participant1.demographics?.gender).toBe('Female')
    expect(result.intake?.participant1.demographics?.militaryStatus).toBe('Veteran')
  })

  it('should handle case number in expected format', async () => {
    const input = createValidIntakeInput({ caseNumber: '2026FM1234' })

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
    expect(result.intake?.caseNumber).toBe('2026FM1234')
  })

  it('should accept case number in non-standard format', async () => {
    const input = createValidIntakeInput({ caseNumber: 'LEGACY-2020-001' })

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
    expect(result.intake?.caseNumber).toBe('LEGACY-2020-001')
  })

  it('should handle phone numbers in various formats', async () => {
    const input = createValidIntakeInput({
      participant1: {
        name: 'Phone Test User',
        phone: '4105551234',
        homePhone: '(410) 555-5678',
      },
    })

    const result = await createPaperIntake(input)

    expect(result.success).toBe(true)
  })
})
