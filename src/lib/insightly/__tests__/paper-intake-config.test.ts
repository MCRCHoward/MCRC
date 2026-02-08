import { describe, it, expect, beforeEach } from 'vitest'
import {
  CASE_PIPELINE_ID,
  DEFAULT_CASE_STAGE_ID,
  CASE_PIPELINE_STAGES,
  LEAD_PIPELINE_STAGES,
  EXISTING_LEAD_SOURCES,
  LEAD_SOURCES_TO_CREATE,
  REFERRAL_TO_LEAD_SOURCE,
  DISPUTE_TYPE_TO_CASE_TYPE,
  buildLeadTags,
  buildLeadUrl,
  buildCaseUrl,
  parseCaseNumber,
  formatCaseNumber,
  isInsightlyConfigured,
  getCachedLeadSourceId,
  setLeadSourceCache,
  clearLeadSourceCache,
} from '../paper-intake-config'

describe('Paper Intake Config', () => {
  describe('Pipeline Configuration', () => {
    it('should have valid case pipeline ID', () => {
      expect(CASE_PIPELINE_ID).toBe(989108)
    })

    it('should have default stage set to Intakes Completed', () => {
      expect(DEFAULT_CASE_STAGE_ID).toBe(4075519)
    })

    it('should have all case pipeline stages', () => {
      expect(CASE_PIPELINE_STAGES).toHaveProperty('RECEIVE_INQUIRY')
      expect(CASE_PIPELINE_STAGES).toHaveProperty('INTAKES_COMPLETED')
      expect(CASE_PIPELINE_STAGES).toHaveProperty('GATHER_AVAILABILITY')
    })

    it('should have all lead pipeline stages', () => {
      expect(LEAD_PIPELINE_STAGES).toHaveProperty('NOT_CONTACTED')
      expect(LEAD_PIPELINE_STAGES).toHaveProperty('ATTEMPTED_CONTACT')
      expect(LEAD_PIPELINE_STAGES).toHaveProperty('CONTACTED')
      expect(LEAD_PIPELINE_STAGES).toHaveProperty('CONVERTED')
    })
  })

  describe('Lead Sources', () => {
    it('should have existing lead sources mapped', () => {
      expect(EXISTING_LEAD_SOURCES).toHaveProperty('Web')
      expect(EXISTING_LEAD_SOURCES).toHaveProperty('Phone Inquiry')
      expect(EXISTING_LEAD_SOURCES.Web).toBe(3442168)
    })

    it('should have lead sources to create list', () => {
      expect(LEAD_SOURCES_TO_CREATE).toContain('Staff/Volunteer')
      expect(LEAD_SOURCES_TO_CREATE).toContain('District Court')
      expect(LEAD_SOURCES_TO_CREATE).toContain('Circuit Court')
      expect(LEAD_SOURCES_TO_CREATE).toContain('Paper Intake')
    })

    it('should map referral sources to lead sources', () => {
      const referralSources = ['Staff/Volunteer', 'District Court', 'Circuit Court']
      referralSources.forEach((source) => {
        expect(REFERRAL_TO_LEAD_SOURCE[source]).toBeDefined()
      })
    })
  })

  describe('Dispute Type Mapping', () => {
    it('should map dispute types to case type values', () => {
      expect(DISPUTE_TYPE_TO_CASE_TYPE['Landlord/Tenant']).toBe('Landlord/Tenant')
      expect(DISPUTE_TYPE_TO_CASE_TYPE.Neighbor).toBe('Neighbor')
    })
  })

  describe('buildLeadTags', () => {
    it('should always include Paper_Intake tag', () => {
      const tags = buildLeadTags({ isCourtOrdered: false, policeInvolvement: false })
      expect(tags).toContain('Paper_Intake')
    })

    it('should add court ordered status tag', () => {
      const tags = buildLeadTags({ isCourtOrdered: true, policeInvolvement: false })
      expect(tags).toContain('Court_Ordered_Yes')
    })

    it('should add police involvement tags', () => {
      const yesTags = buildLeadTags({ isCourtOrdered: false, policeInvolvement: true })
      expect(yesTags).toContain('Police_Involvement_Yes')
      const noTags = buildLeadTags({ isCourtOrdered: false, policeInvolvement: false })
      expect(noTags).toContain('Police_Involvement_No')
    })

    it('should add referral source tag', () => {
      const tags = buildLeadTags({
        isCourtOrdered: false,
        policeInvolvement: false,
        referralSource: 'District Court',
      })
      expect(tags).toContain('Referral_District_Court')
    })
  })

  describe('URL Builders', () => {
    it('should build valid lead URL', () => {
      const url = buildLeadUrl(12345)
      expect(url).toContain('/details/Lead/')
      expect(url).toContain('12345')
    })

    it('should build valid case URL', () => {
      const url = buildCaseUrl(67890)
      expect(url).toContain('/details/Opportunity/')
      expect(url).toContain('67890')
    })
  })

  describe('Case Number Parsing', () => {
    it('should parse valid case number format', () => {
      const result = parseCaseNumber('2026FM1234')
      expect(result).toEqual({
        year: 2026,
        sequence: 1234,
      })
    })

    it('should return null for invalid format', () => {
      expect(parseCaseNumber('invalid')).toBeNull()
      expect(parseCaseNumber('')).toBeNull()
      expect(parseCaseNumber('12345')).toBeNull()
    })

    it('should format case number correctly', () => {
      const formatted = formatCaseNumber(2026, 1234)
      expect(formatted).toBe('2026FM1234')
    })
  })

  describe('Lead Source Cache', () => {
    beforeEach(() => {
      clearLeadSourceCache()
    })

    it('should return undefined for uncached source', () => {
      expect(getCachedLeadSourceId('Unknown')).toBeUndefined()
    })

    it('should cache and retrieve lead source IDs', () => {
      setLeadSourceCache({ 'Test Source': 12345 })
      expect(getCachedLeadSourceId('Test Source')).toBe(12345)
    })

    it('should clear cache', () => {
      setLeadSourceCache({ 'Test Source': 12345 })
      clearLeadSourceCache()
      expect(getCachedLeadSourceId('Test Source')).toBeUndefined()
    })
  })

  describe('isInsightlyConfigured', () => {
    it('should return boolean', () => {
      const result = isInsightlyConfigured()
      expect(typeof result).toBe('boolean')
    })
  })
})
