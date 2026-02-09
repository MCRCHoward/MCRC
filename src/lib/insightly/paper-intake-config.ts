/**
 * Insightly Configuration for Paper Intake
 *
 * Contains IDs, mappings, and constants for syncing paper intake forms
 * to Insightly CRM (Leads and Cases/Opportunities).
 */

import type { ReferralSource, DisputeType } from '@/types/paper-intake'

// =============================================================================
// Environment Variables
// =============================================================================

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`[Insightly] Missing required environment variable: ${name}`)
  }
  return value
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value === '' ? undefined : value
}

export const INSIGHTLY_API_KEY = getOptionalEnv('INSIGHTLY_API_KEY') ?? ''
export const INSIGHTLY_API_URL = normalizeUrl(
  getEnv('INSIGHTLY_API_URL', 'https://api.na1.insightly.com/v3.1'),
)
export const INSIGHTLY_WEB_BASE_URL = normalizeUrl(
  getEnv('INSIGHTLY_WEB_BASE_URL', 'https://crm.na1.insightly.com'),
)

// =============================================================================
// Pipeline Configuration
// =============================================================================

/**
 * Case Pipeline ID
 * From: /Settings/Pipelines - PipelineStagesAdd/989108
 */
export const CASE_PIPELINE_ID = 989108

/**
 * Case Pipeline Stages
 * Extracted from case_pipeline.html
 */
export const CASE_PIPELINE_STAGES = {
  RECEIVE_INQUIRY: 4075518,
  INTAKES_COMPLETED: 4075519,
  GATHER_AVAILABILITY: 4075520,
  CONFIRMING_SESSION: 4075521,
  SEND_MEDIATOR_REQUEST: 4075522,
  READY_FOR_SESSION: 4103774,
} as const

/**
 * Default stage for new cases from paper intake
 * Since these are historical forms where intake is already done,
 * we start at "Intakes Completed"
 */
export const DEFAULT_CASE_STAGE_ID = CASE_PIPELINE_STAGES.INTAKES_COMPLETED

/**
 * Lead Pipeline Stages (for reference)
 * Leads have a simpler pipeline
 */
export const LEAD_PIPELINE_STAGES = {
  NOT_CONTACTED: 3380784,
  ATTEMPTED_CONTACT: 3380785,
  CONTACTED: 3380786,
  CONVERTED: 3380788,
} as const

// =============================================================================
// Lead Source Configuration
// =============================================================================

/**
 * Existing Lead Sources in Insightly
 */
export const EXISTING_LEAD_SOURCES: Record<string, number> = {
  Web: 3442168,
  'Phone Inquiry': 3442169,
  'Partner Referral': 3442170,
  Outreach: 3442171,
  Other: 3442172,
}

/**
 * Lead Sources that need to be created
 * Maps paper form referral source → Insightly Lead Source name
 */
export const LEAD_SOURCES_TO_CREATE = [
  'Staff/Volunteer',
  'Government Agency',
  'Previous Client',
  "State's Attorney",
  'Community Organization',
  'Law Enforcement',
  'Professional Referral',
  'District Court',
  'Circuit Court',
  'Paper Intake', // Special source for this feature
] as const

/**
 * Map paper form referral source to Insightly Lead Source name
 * Some sources map to existing ones, others need to be created
 */
export const REFERRAL_TO_LEAD_SOURCE: Record<ReferralSource, string> = {
  'Staff/Volunteer': 'Staff/Volunteer',
  'Government Agency': 'Government Agency',
  'Previous Client': 'Previous Client',
  "State's Attorney": "State's Attorney",
  'Community Organization': 'Community Organization',
  'Law Enforcement': 'Law Enforcement',
  'Professional Referral': 'Professional Referral',
  'District Court': 'District Court',
  'Circuit Court': 'Circuit Court',
  Outreach: 'Outreach', // Maps to existing
  Other: 'Other', // Maps to existing
}

// =============================================================================
// Case Custom Field Configuration
// =============================================================================

/**
 * Case (Opportunity) custom field names
 * From insightly-mediation.html analysis
 */
export const CASE_CUSTOM_FIELDS = {
  CASE_NUMBER: 'Case_Number_NEW__c',
  CASE_DISPOSITION: 'Case_Disposition__c',
  REFERRAL_SOURCE: 'Referral_Source__c',
  REFERRAL_METHOD: 'ReferralInquiry_Method__c',
  SESSION_TYPE: 'Session_Type__c',
  MEDIATION_CASE_TYPE: 'Mediation_Case_Type__c',
  MEDIATION_CASE_SUBTYPE: 'Mediation_Case_Subtype__c',
  COURT_REFERRAL_DATE: 'Court_Referral_Date_If_applicable__c',
  OPEN_DATE: 'Open_Date__c',
  CLOSED_DATE: 'Closed_Date__c',
} as const

/**
 * Map dispute type to Insightly Mediation_Case_Type__c dropdown values
 * Note: These must match exactly what's configured in Insightly
 */
export const DISPUTE_TYPE_TO_CASE_TYPE: Record<DisputeType, string> = {
  'Business/Contract': 'Business/Contract',
  'Employment/EEO': 'Employment/EEO',
  'Landlord/Tenant': 'Landlord/Tenant',
  'Parenting Plan': 'Co-parenting/Parenting Plan',
  Community: 'Community',
  Family: 'Family',
  Medical: 'Medical',
  Roommate: 'Roommate',
  Divorce: 'Divorce',
  Insurance: 'Insurance',
  Neighbor: 'Neighbor',
  School: 'School',
  ElderCare: 'ElderCare',
  Juvenile: 'Juvenile',
  'Parent/Child': 'Parent/Child',
  Separation: 'Separation',
}

/**
 * Session type for mediation cases
 */
export const SESSION_TYPE_MEDIATION = 'Mediation'

// =============================================================================
// Tag Configuration
// =============================================================================

/**
 * Standard tags to apply to Leads created from paper intake
 */
export const PAPER_INTAKE_TAGS = {
  // Source identification
  PAPER_INTAKE: 'Paper_Intake',
  MCRC: 'MCRC',
  MEDIATION: 'Mediation',

  // Court ordered status
  COURT_ORDERED_YES: 'Court_Ordered_Yes',
  COURT_ORDERED_NO: 'Court_Ordered_No',

  // Police involvement (NEW)
  POLICE_INVOLVEMENT_YES: 'Police_Involvement_Yes',
  POLICE_INVOLVEMENT_NO: 'Police_Involvement_No',
} as const

/**
 * Build tags array for a Lead based on paper intake data
 */
export function buildLeadTags(options: {
  isCourtOrdered: boolean
  policeInvolvement: boolean
  referralSource?: string
}): string[] {
  const tags: string[] = [
    PAPER_INTAKE_TAGS.PAPER_INTAKE,
    PAPER_INTAKE_TAGS.MCRC,
    PAPER_INTAKE_TAGS.MEDIATION,
  ]

  // Court ordered status
  tags.push(
    options.isCourtOrdered
      ? PAPER_INTAKE_TAGS.COURT_ORDERED_YES
      : PAPER_INTAKE_TAGS.COURT_ORDERED_NO,
  )

  // Police involvement status
  tags.push(
    options.policeInvolvement
      ? PAPER_INTAKE_TAGS.POLICE_INVOLVEMENT_YES
      : PAPER_INTAKE_TAGS.POLICE_INVOLVEMENT_NO,
  )

  // Referral source as tag (normalized)
  if (options.referralSource) {
    const normalizedSource = options.referralSource
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
    tags.push(`Referral_${normalizedSource}`)
  }

  return tags
}

// =============================================================================
// URL Builders
// =============================================================================

/**
 * Build URL to view a Lead in Insightly
 */
export function buildLeadUrl(leadId: number): string {
  return `${INSIGHTLY_WEB_BASE_URL}/details/Lead/${leadId}`
}

/**
 * Build URL to view an Opportunity (Case) in Insightly
 */
export function buildCaseUrl(opportunityId: number): string {
  return `${INSIGHTLY_WEB_BASE_URL}/details/Opportunity/${opportunityId}`
}

// =============================================================================
// Lead Source Cache
// =============================================================================

/**
 * Runtime cache for Lead Source IDs
 * Populated on first use to avoid repeated API calls
 */
let leadSourceCache: Record<string, number> | null = null

/**
 * Get cached Lead Source ID by name
 */
export function getCachedLeadSourceId(sourceName: string): number | undefined {
  if (!leadSourceCache) return undefined
  return leadSourceCache[sourceName]
}

/**
 * Set the Lead Source cache
 */
export function setLeadSourceCache(cache: Record<string, number>): void {
  leadSourceCache = cache
}

/**
 * Clear the Lead Source cache (for testing or refresh)
 */
export function clearLeadSourceCache(): void {
  leadSourceCache = null
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if Insightly integration is configured
 */
export function isInsightlyConfigured(): boolean {
  return Boolean(INSIGHTLY_API_KEY)
}

/**
 * Validate that all required Insightly configuration is present
 */
export function validateInsightlyConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!INSIGHTLY_API_KEY) {
    errors.push('INSIGHTLY_API_KEY is not configured')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// =============================================================================
// Case Number Generation (Future Feature)
// =============================================================================

/**
 * Case number format: YYYYFMXXXX
 * YYYY = Year
 * FM = Fixed prefix for mediation
 * XXXX = Sequence number
 *
 * NOTE: Currently manual entry only. Auto-generation to be implemented later.
 *
 * Future implementation will:
 * 1. Query Firestore for the highest case number in the current year
 * 2. Increment and return the next number
 * 3. Handle race conditions with transactions
 */
export function parseCaseNumber(caseNumber: string): {
  year: number
  sequence: number
} | null {
  // Pattern: 2025FM1234
  const match = caseNumber.match(/^(\d{4})FM(\d+)$/)
  if (!match) return null

  const [, yearString, sequenceString] = match
  if (!yearString || !sequenceString) return null

  return {
    year: parseInt(yearString, 10),
    sequence: parseInt(sequenceString, 10),
  }
}

/**
 * Format a case number from components
 */
export function formatCaseNumber(year: number, sequence: number): string {
  return `${year}FM${sequence.toString().padStart(4, '0')}`
}

// TODO: Implement auto-generation
// export async function generateNextCaseNumber(): Promise<string> {
//   const currentYear = new Date().getFullYear()
//   // Query Firestore for max sequence in current year
//   // Return formatted case number
// }
