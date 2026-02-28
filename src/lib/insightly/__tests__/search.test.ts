import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { LeadSearchResult } from '@/types/paper-intake'

function buildResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(payload),
  }
}

describe('Insightly Search', () => {
  const mockFetch = vi.fn()
  let searchModule: typeof import('../search')

  beforeEach(async () => {
    vi.stubEnv('INSIGHTLY_API_KEY', 'test-api-key')
    vi.stubEnv('INSIGHTLY_API_URL', 'https://api.test-insightly.com/v3.1')
    vi.stubEnv('INSIGHTLY_WEB_BASE_URL', 'https://crm.test-insightly.com')
    vi.clearAllMocks()

    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)

    vi.resetModules()
    searchModule = await import('../search')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('fetchLeadSources', () => {
    it('should fetch all lead sources', async () => {
      const mockSources = [
        { LEAD_SOURCE_ID: 1, LEAD_SOURCE: 'Web', DEFAULT_VALUE: true, FIELD_ORDER: 1 },
        { LEAD_SOURCE_ID: 2, LEAD_SOURCE: 'Phone', DEFAULT_VALUE: false, FIELD_ORDER: 2 },
      ]

      mockFetch.mockResolvedValueOnce(buildResponse(mockSources))

      const result = await searchModule.fetchLeadSources()

      expect(result).toHaveLength(2)
      expect(result[0]!.LEAD_SOURCE).toBe('Web')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/LeadSources'),
        expect.any(Object),
      )
    })
  })

  describe('createLeadSource', () => {
    it('should create a new lead source', async () => {
      const mockResponse = {
        LEAD_SOURCE_ID: 99,
        LEAD_SOURCE: 'Paper Intake',
        DEFAULT_VALUE: false,
        FIELD_ORDER: 10,
      }

      mockFetch.mockResolvedValueOnce(buildResponse(mockResponse))

      const result = await searchModule.createLeadSource('Paper Intake')

      expect(result.LEAD_SOURCE_ID).toBe(99)
      expect(result.LEAD_SOURCE).toBe('Paper Intake')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/LeadSources'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Paper Intake'),
        }),
      )
    })
  })

  describe('ensureLeadSourcesExist', () => {
    it('should create missing lead sources', async () => {
      mockFetch
        .mockResolvedValueOnce(
          buildResponse([{ LEAD_SOURCE_ID: 1, LEAD_SOURCE: 'Web' }]),
        )
        .mockResolvedValue(buildResponse({ LEAD_SOURCE_ID: 99, LEAD_SOURCE: 'Paper Intake' }))

      const result = await searchModule.ensureLeadSourcesExist()

      expect(result.success).toBe(true)
      expect(result.created.length).toBeGreaterThan(0)
    })
  })

  describe('searchLeadsByName', () => {
    it('should search with first and last name', async () => {
      const mockLeads = [
        {
          LEAD_ID: 123,
          FIRST_NAME: 'John',
          LAST_NAME: 'Doe',
          EMAIL: 'john@example.com',
          PHONE: '410-555-1234',
          LEAD_STATUS_ID: 1,
          DATE_CREATED_UTC: '2026-01-01T00:00:00Z',
        },
      ]

      // New impl: 2 separate calls (first_name, last_name) + LeadStatuses when processing first lead
      mockFetch
        .mockResolvedValueOnce(buildResponse(mockLeads))
        .mockResolvedValueOnce(
          buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Not Contacted' }]),
        )
        .mockResolvedValueOnce(buildResponse(mockLeads))

      const results = await searchModule.searchLeadsByName('John', 'Doe')

      expect(results).toHaveLength(1)
      expect(results[0]!.fullName).toBe('John Doe')
      expect(results[0]!.leadId).toBe(123)
    })

    it('should return empty array for empty name', async () => {
      const results = await searchModule.searchLeadsByName('', '')
      expect(results).toEqual([])
    })
  })

  describe('searchLeadsByEmail', () => {
    it('should search by email', async () => {
      const mockLeads = [
        {
          LEAD_ID: 456,
          FIRST_NAME: 'Jane',
          LAST_NAME: 'Smith',
          EMAIL: 'jane@example.com',
          PHONE: '410-555-0000',
          LEAD_STATUS_ID: 1,
          DATE_CREATED_UTC: '2026-01-02T00:00:00Z',
        },
      ]

      mockFetch
        .mockResolvedValueOnce(buildResponse(mockLeads))
        .mockResolvedValueOnce(
          buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Not Contacted' }]),
        )

      const results = await searchModule.searchLeadsByEmail('jane@example.com')

      expect(results).toHaveLength(1)
      expect(results[0]!.email).toBe('jane@example.com')
    })
  })

  describe('checkForDuplicates', () => {
    it('should combine name and email search results', async () => {
      // New impl: name search (2 calls: first_name, last_name) + LeadStatuses + email search
      // first_name=John -> John Doe, LeadStatuses, last_name=Doe -> Johnny Doe, email -> Johnny Doe
      mockFetch
        .mockResolvedValueOnce(
          buildResponse([
            { LEAD_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', LEAD_STATUS_ID: 1 },
          ]),
        )
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Unknown' }]))
        .mockResolvedValueOnce(
          buildResponse([
            { LEAD_ID: 2, FIRST_NAME: 'Johnny', LAST_NAME: 'Doe', LEAD_STATUS_ID: null },
          ]),
        )
        .mockResolvedValueOnce(
          buildResponse([
            { LEAD_ID: 2, FIRST_NAME: 'Johnny', LAST_NAME: 'Doe', EMAIL: 'john@example.com', LEAD_STATUS_ID: null },
          ]),
        )

      const result = await searchModule.checkForDuplicates('John Doe', 'john@example.com')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(2)
      expect(result.searchedName).toBe('John Doe')
    })
  })

  describe('getLeadById', () => {
    it('should fetch lead by ID', async () => {
      const mockLead = {
        LEAD_ID: 999,
        FIRST_NAME: 'Test',
        LAST_NAME: 'Lead',
        EMAIL: null,
        PHONE: null,
        LEAD_STATUS_ID: null,
        DATE_CREATED_UTC: '2026-01-03T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce(buildResponse(mockLead))

      const result = await searchModule.getLeadById(999)
      expect(result?.LEAD_ID).toBe(999)
    })
  })

  // =============================================================================
  // Group A: filterMatchingLeads (OR matching - client-side filter)
  // =============================================================================

  describe('filterMatchingLeads', () => {
    const createLead = (
      leadId: number,
      firstName: string,
      lastName: string,
      email?: string,
    ): LeadSearchResult => ({
      leadId,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' ') || 'Unknown',
      email,
      leadStatus: 'Open',
      leadUrl: `https://crm.insightly.com/leads/${leadId}`,
      createdAt: '2026-01-15T10:00:00Z',
    })

    it('should match when firstName matches (case-insensitive)', () => {
      const leads = [createLead(1, 'John', 'Doe', 'john.doe@example.com')]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'JOHN', 'Smith', 'other@email.com')
      expect(result).toHaveLength(1)
      expect(result[0]!.leadId).toBe(1)
    })

    it('should match when lastName matches (case-insensitive)', () => {
      const leads = [createLead(2, 'Jane', 'Doe', 'jane.doe@example.com')]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'John', 'DOE', 'other@email.com')
      expect(result).toHaveLength(1)
      expect(result[0]!.leadId).toBe(2)
    })

    it('should match when email matches (case-insensitive)', () => {
      const leads = [
        { ...createLead(3, 'Robert', 'Johnson'), email: 'SHARED@company.com' },
      ]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'Alice', 'Williams', 'shared@company.com')
      expect(result).toHaveLength(1)
      expect(result[0]!.leadId).toBe(3)
    })

    it('should NOT match when nothing matches', () => {
      const leads = [createLead(4, 'Michael', 'Brown', 'michael.brown@example.com')]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'Sarah', 'Wilson', 'sarah@different.com')
      expect(result).toHaveLength(0)
    })

    it('should filter multiple leads with mixed matches', () => {
      const leads = [
        createLead(10, 'John', 'Doe', 'john.doe@example.com'),
        createLead(11, 'John', 'Smith', 'john.smith@example.com'),
        createLead(12, 'Jane', 'Williams', 'jane@example.com'),
        createLead(13, 'Bob', 'Miller', 'bob@example.com'),
      ]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'John', 'Williams', undefined)
      expect(result).toHaveLength(3)
      const ids = result.map((r) => r.leadId)
      expect(ids).toContain(10)
      expect(ids).toContain(11)
      expect(ids).toContain(12)
      expect(ids).not.toContain(13)
    })

    it('should return empty array when search terms are empty', () => {
      const leads = [createLead(20, 'John', 'Doe', 'john@example.com')]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, '', '', undefined)
      expect(result).toHaveLength(0)
    })

    it('should handle leads with empty/undefined fields', () => {
      const leads: LeadSearchResult[] = [
        {
          leadId: 30,
          firstName: '',
          lastName: 'Doe',
          fullName: 'Doe',
          email: undefined,
          leadStatus: 'Open',
          leadUrl: 'https://crm.insightly.com/leads/30',
          createdAt: '2026-01-15T10:00:00Z',
        },
      ]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'John', 'Doe', 'test@example.com')
      expect(result).toHaveLength(1)
      expect(result[0]!.leadId).toBe(30)
    })

    it('should trim whitespace from names before comparison', () => {
      const leads = [
        { ...createLead(40, '  John  ', 'Doe'), fullName: 'John Doe' },
      ]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, 'John', 'Smith', undefined)
      expect(result).toHaveLength(1)
    })

    it('should match on email even without name search terms', () => {
      const leads = [createLead(50, 'Unknown', 'Person', 'target@example.com')]
      const filterMatchingLeads = (searchModule as { filterMatchingLeads?: (leads: LeadSearchResult[], searchFirst: string, searchLast: string, searchEmail?: string) => LeadSearchResult[] }).filterMatchingLeads
      if (!filterMatchingLeads) throw new Error('filterMatchingLeads not implemented')
      const result = filterMatchingLeads(leads, '', '', 'target@example.com')
      expect(result).toHaveLength(1)
      expect(result[0]!.leadId).toBe(50)
    })
  })

  // =============================================================================
  // Group B: searchLeadsByName - OR matching (separate API calls)
  // =============================================================================

  describe('searchLeadsByName - OR matching', () => {
    it('should make separate API calls for firstName and lastName', async () => {
      const johnDoe = {
        LEAD_ID: 100,
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        PHONE: '410-555-1234',
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }
      const janeSmith = {
        LEAD_ID: 101,
        FIRST_NAME: 'Jane',
        LAST_NAME: 'Smith',
        EMAIL: 'jane.smith@example.com',
        PHONE: '410-555-5678',
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      // Order: first_name=John -> johnDoe, LeadStatuses (when processing), last_name=Smith -> janeSmith
      mockFetch
        .mockResolvedValueOnce(buildResponse([johnDoe]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))
        .mockResolvedValueOnce(buildResponse([janeSmith]))

      const results = await searchModule.searchLeadsByName('John', 'Smith')

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('first_name=John'),
        expect.any(Object),
      )
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('first_name=John&last_name=Smith'),
        expect.any(Object),
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('last_name=Smith'),
        expect.any(Object),
      )
      expect(results).toHaveLength(2)
      expect(results.map((r) => r.leadId)).toContain(100)
      expect(results.map((r) => r.leadId)).toContain(101)
    })

    it('should deduplicate results from multiple queries', async () => {
      const johnSmith = {
        LEAD_ID: 200,
        FIRST_NAME: 'John',
        LAST_NAME: 'Smith',
        EMAIL: 'john.smith@example.com',
        PHONE: null,
        LEAD_STATUS_ID: null,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([johnSmith]))
        .mockResolvedValueOnce(buildResponse([johnSmith]))

      const results = await searchModule.searchLeadsByName('John', 'Smith')

      expect(results).toHaveLength(1)
      expect(results[0]!.leadId).toBe(200)
    })

    it('should return empty array when no name provided', async () => {
      const results = await searchModule.searchLeadsByName('', '')
      expect(results).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle firstName-only search', async () => {
      const john = {
        LEAD_ID: 300,
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        EMAIL: null,
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([john]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const results = await searchModule.searchLeadsByName('John', '')

      expect(results).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('first_name=John'),
        expect.any(Object),
      )
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('last_name='),
        expect.any(Object),
      )
    })

    it('should handle lastName-only search', async () => {
      const doe = {
        LEAD_ID: 400,
        FIRST_NAME: 'Jane',
        LAST_NAME: 'Doe',
        EMAIL: null,
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([doe]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const results = await searchModule.searchLeadsByName('', 'Doe')

      expect(results).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('last_name=Doe'),
        expect.any(Object),
      )
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('first_name='),
        expect.any(Object),
      )
    })

    it(
      'should gracefully handle API errors on one query',
      async () => {
        const janeSmith = {
          LEAD_ID: 500,
          FIRST_NAME: 'Jane',
          LAST_NAME: 'Smith',
          EMAIL: null,
          PHONE: null,
          LEAD_STATUS_ID: null,
          DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
          TAGS: [] as string[],
        }

        // First call (first_name=John) rejects; need enough rejections for retries to exhaust
        mockFetch
          .mockRejectedValueOnce(new Error('API timeout'))
          .mockRejectedValueOnce(new Error('API timeout'))
          .mockRejectedValueOnce(new Error('API timeout'))
          .mockRejectedValueOnce(new Error('API timeout'))
          .mockResolvedValueOnce(buildResponse([janeSmith]))

        const results = await searchModule.searchLeadsByName('John', 'Smith')

        expect(results).toHaveLength(1)
        expect(results[0]!.leadId).toBe(500)
      },
      15000,
    )
  })

  // =============================================================================
  // Group C: checkForDuplicates - OR matching integration
  // =============================================================================

  describe('checkForDuplicates - OR matching integration', () => {
    it('should find match when only firstName matches', async () => {
      const johnDoe = {
        LEAD_ID: 1000,
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        EMAIL: 'john.doe@gmail.com',
        PHONE: '410-555-1234',
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([johnDoe]))
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const result = await searchModule.checkForDuplicates('John Smith', 'johnsmith@yahoo.com')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]!.fullName).toBe('John Doe')
      expect(result.matches[0]!.firstName).toBe('John')
      expect(result.searchedName).toBe('John Smith')
    })

    it('should find match when only lastName matches', async () => {
      const johnDoe = {
        LEAD_ID: 1001,
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        EMAIL: 'john.doe@gmail.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([johnDoe]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const result = await searchModule.checkForDuplicates('Jane Doe')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]!.fullName).toBe('John Doe')
    })

    it('should find match when only email matches', async () => {
      const existingLead = {
        LEAD_ID: 1002,
        FIRST_NAME: 'Robert',
        LAST_NAME: 'Johnson',
        EMAIL: 'shared@company.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([existingLead]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const result = await searchModule.checkForDuplicates('Alice Williams', 'shared@company.com')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]!.fullName).toBe('Robert Johnson')
      expect(result.matches[0]!.email).toBe('shared@company.com')
    })

    it('should return no match when nothing matches', async () => {
      const unrelatedLead = {
        LEAD_ID: 1003,
        FIRST_NAME: 'Michael',
        LAST_NAME: 'Brown',
        EMAIL: 'michael@different.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      // Order: first_name=Sarah [], last_name=Wilson [unrelatedLead], LeadStatuses, email []
      mockFetch
        .mockResolvedValueOnce(buildResponse([]))
        .mockResolvedValueOnce(buildResponse([unrelatedLead]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))
        .mockResolvedValueOnce(buildResponse([]))

      const result = await searchModule.checkForDuplicates(
        'Sarah Wilson',
        'sarah@elsewhere.com',
      )

      expect(result.hasPotentialDuplicates).toBe(false)
      expect(result.matches).toHaveLength(0)
    })

    it('should find exact match', async () => {
      const johnSmith = {
        LEAD_ID: 1004,
        FIRST_NAME: 'John',
        LAST_NAME: 'Smith',
        EMAIL: 'john.smith@example.com',
        PHONE: '410-555-0000',
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([johnSmith]))
        .mockResolvedValueOnce(buildResponse([johnSmith]))
        .mockResolvedValueOnce(buildResponse([johnSmith]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))

      const result = await searchModule.checkForDuplicates(
        'John Smith',
        'john.smith@example.com',
      )

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]!.fullName).toBe('John Smith')
    })

    it('should find multiple matches with different match reasons', async () => {
      const johnDoe = {
        LEAD_ID: 2001,
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }
      const janeSmith = {
        LEAD_ID: 2002,
        FIRST_NAME: 'Jane',
        LAST_NAME: 'Smith',
        EMAIL: 'jane.smith@example.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }
      const bobJones = {
        LEAD_ID: 2003,
        FIRST_NAME: 'Bob',
        LAST_NAME: 'Jones',
        EMAIL: 'target@company.com',
        PHONE: null,
        LEAD_STATUS_ID: 1,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      // Order: first_name=John [johnDoe], LeadStatuses, last_name=Smith [janeSmith], email [bobJones]
      mockFetch
        .mockResolvedValueOnce(buildResponse([johnDoe]))
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Open' }]))
        .mockResolvedValueOnce(buildResponse([janeSmith]))
        .mockResolvedValueOnce(buildResponse([bobJones]))

      const result = await searchModule.checkForDuplicates('John Smith', 'target@company.com')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(3)
      const ids = result.matches.map((m) => m.leadId)
      expect(ids).toContain(2001)
      expect(ids).toContain(2002)
      expect(ids).toContain(2003)
    })

    it('should treat single name as firstName', async () => {
      const prince = {
        LEAD_ID: 3000,
        FIRST_NAME: 'Prince',
        LAST_NAME: null,
        EMAIL: null,
        PHONE: null,
        LEAD_STATUS_ID: null,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch.mockResolvedValueOnce(buildResponse([prince]))

      const result = await searchModule.checkForDuplicates('Prince')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0]!.firstName).toBe('Prince')
    })

    it('should handle multi-word last names', async () => {
      const maryJaneWatson = {
        LEAD_ID: 4000,
        FIRST_NAME: 'Mary',
        LAST_NAME: 'Jane Watson',
        EMAIL: null,
        PHONE: null,
        LEAD_STATUS_ID: null,
        DATE_CREATED_UTC: '2026-01-15T10:00:00Z',
        TAGS: [] as string[],
      }

      mockFetch
        .mockResolvedValueOnce(buildResponse([maryJaneWatson]))
        .mockResolvedValueOnce(buildResponse([maryJaneWatson]))

      const result = await searchModule.checkForDuplicates('Mary Jane Watson')

      expect(result.hasPotentialDuplicates).toBe(true)
      expect(result.matches).toHaveLength(1)
    })
  })
})
