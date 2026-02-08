import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
      expect(result[0].LEAD_SOURCE).toBe('Web')
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

      mockFetch
        .mockResolvedValueOnce(buildResponse(mockLeads))
        .mockResolvedValueOnce(
          buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Not Contacted' }]),
        )

      const results = await searchModule.searchLeadsByName('John', 'Doe')

      expect(results).toHaveLength(1)
      expect(results[0].fullName).toBe('John Doe')
      expect(results[0].leadId).toBe(123)
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
      expect(results[0].email).toBe('jane@example.com')
    })
  })

  describe('checkForDuplicates', () => {
    it('should combine name and email search results', async () => {
      mockFetch
        .mockResolvedValueOnce(
          buildResponse([
            { LEAD_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', LEAD_STATUS_ID: null },
          ]),
        )
        .mockResolvedValueOnce(buildResponse([{ LEAD_STATUS_ID: 1, LEAD_STATUS: 'Unknown' }]))
        .mockResolvedValueOnce(
          buildResponse([
            { LEAD_ID: 2, FIRST_NAME: 'Johnny', LAST_NAME: 'Doe', LEAD_STATUS_ID: null },
          ]),
        )
        .mockResolvedValueOnce(buildResponse([]))

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
})
