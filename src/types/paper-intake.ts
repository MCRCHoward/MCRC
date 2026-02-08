/**
 * Paper Intake Types
 *
 * Data structures for digitizing historical paper mediation intake forms
 * and syncing them to Insightly CRM.
 */

// =============================================================================
// Enums and Constants
// =============================================================================

/**
 * Referral sources from the paper form
 * Maps to Insightly Lead Sources
 */
export const REFERRAL_SOURCES = [
  'Staff/Volunteer',
  'Government Agency',
  'Previous Client',
  "State's Attorney",
  'Community Organization',
  'Law Enforcement',
  'Professional Referral',
  'District Court',
  'Circuit Court',
  'Outreach',
  'Other',
] as const

export type ReferralSource = (typeof REFERRAL_SOURCES)[number]

/**
 * Dispute types from the paper form
 * Maps to Insightly Case custom field: Mediation_Case_Type__c
 */
export const DISPUTE_TYPES = [
  'Business/Contract',
  'Employment/EEO',
  'Landlord/Tenant',
  'Parenting Plan',
  'Community',
  'Family',
  'Medical',
  'Roommate',
  'Divorce',
  'Insurance',
  'Neighbor',
  'School',
  'ElderCare',
  'Juvenile',
  'Parent/Child',
  'Separation',
] as const

export type DisputeType = (typeof DISPUTE_TYPES)[number]

/**
 * Gender options for demographics
 */
export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Other',
  'Prefer not to say',
  'Unknown/Illegible',
] as const

export type Gender = (typeof GENDER_OPTIONS)[number]

/**
 * Race options for demographics
 */
export const RACE_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or More Races',
  'Other',
  'Prefer not to say',
  'Unknown/Illegible',
] as const

export type Race = (typeof RACE_OPTIONS)[number]

/**
 * Age range options for demographics
 */
export const AGE_RANGES = [
  'Under 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
  'Unknown/Illegible',
] as const

export type AgeRange = (typeof AGE_RANGES)[number]

/**
 * Income range options for demographics
 */
export const INCOME_RANGES = [
  'Under $25,000',
  '$25,000 - $49,999',
  '$50,000 - $74,999',
  '$75,000 - $99,999',
  '$100,000+',
  'Prefer not to say',
  'Unknown/Illegible',
] as const

export type IncomeRange = (typeof INCOME_RANGES)[number]

/**
 * Education level options for demographics
 */
export const EDUCATION_LEVELS = [
  'Less than High School',
  'High School / GED',
  'Some College',
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Prefer not to say',
  'Unknown/Illegible',
] as const

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

/**
 * Military status options for demographics
 */
export const MILITARY_STATUSES = [
  'Active Duty',
  'Veteran',
  'Retired',
  'N/A',
  'Unknown/Illegible',
] as const

export type MilitaryStatus = (typeof MILITARY_STATUSES)[number]

// =============================================================================
// Data Structures
// =============================================================================

/**
 * Demographics data for a participant
 */
export interface ParticipantDemographics {
  gender?: Gender
  race?: Race
  ageRange?: AgeRange
  income?: IncomeRange
  education?: EducationLevel
  militaryStatus?: MilitaryStatus
}

/**
 * Address structure
 */
export interface ParticipantAddress {
  street?: string
  city?: string
  state?: string
  zipCode?: string
}

/**
 * Participant data from the paper form
 */
export interface ParticipantData {
  // Participant number from paper form (optional)
  participantNumber?: string

  // Contact information
  name: string
  firstName?: string
  lastName?: string
  address?: ParticipantAddress
  homePhone?: string
  phone?: string
  email?: string
  canSendJointEmail?: boolean

  // Additional info
  attorney?: string
  bestCallTime?: string
  bestMeetTime?: string

  // Demographics
  demographics?: ParticipantDemographics
}

/**
 * Phone checklist items from the paper form
 */
export interface PhoneChecklist {
  explainedProcess: boolean
  explainedNeutrality: boolean
  explainedConfidentiality: boolean
  policeInvolvement: boolean
  peaceProtectiveOrder: boolean
  safetyScreeningComplete: boolean
}

/**
 * Staff assessment questions from the paper form
 */
export interface StaffAssessment {
  canRepresentSelf: boolean
  noFearOfCoercion: boolean
  noDangerToSelf: boolean
  noDangerToCenter: boolean
}

/**
 * Sync status for individual Insightly objects
 */
export type SyncStatus = 'pending' | 'success' | 'failed' | 'linked' | 'skipped'

/**
 * Overall sync status for the paper intake
 */
export type OverallSyncStatus = 'pending' | 'partial' | 'success' | 'failed'

/**
 * Insightly Lead sync result
 */
export interface LeadSyncResult {
  leadId?: number
  leadUrl?: string
  status: SyncStatus
  linkedToExisting?: boolean
  error?: string
}

/**
 * Insightly Case (Opportunity) sync result
 */
export interface CaseSyncResult {
  caseId?: number
  caseUrl?: string
  status: SyncStatus
  error?: string
}

/**
 * Main Paper Intake document structure
 * Stored in Firestore: paperIntakes/{id}
 */
export interface PaperIntake {
  id: string

  // === Case Metadata ===
  caseNumber?: string // Manual entry from paper form
  intakeDate: string // Date on paper form (ISO)
  intakePerson?: string // Who did the original intake

  // === Data Entry Tracking ===
  dataEntryBy: string // User ID who entered data
  dataEntryByName?: string // User name for display
  dataEntryAt: string // When data was entered (ISO)

  // === Source Tracking ===
  paperFormId?: string // Optional: scan/photo reference
  batchId?: string // Group related entries

  // === Referral Information ===
  referralSource?: ReferralSource

  // === Dispute Information ===
  disputeType?: DisputeType
  disputeDescription: string

  // === Court Information ===
  isCourtOrdered: boolean
  magistrateJudge?: string

  // === Participants ===
  participant1: ParticipantData
  participant2?: ParticipantData // Optional if only one participant

  // === Checklist & Assessment ===
  phoneChecklist: PhoneChecklist
  staffAssessment: StaffAssessment

  // === Staff Notes ===
  // For handwritten additions not in the standard form fields
  staffNotes?: string

  // === Insightly Sync - Participant 1 Lead ===
  participant1Sync?: LeadSyncResult

  // === Insightly Sync - Participant 2 Lead ===
  participant2Sync?: LeadSyncResult

  // === Insightly Sync - Case (Opportunity) ===
  caseSync?: CaseSyncResult

  // === Overall Status ===
  overallSyncStatus: OverallSyncStatus
  syncErrors?: string[]
  syncedAt?: string

  // === Timestamps ===
  createdAt: string
  updatedAt: string
}

/**
 * Input type for creating a new paper intake
 * Omits auto-generated fields
 */
export type PaperIntakeInput = Omit<
  PaperIntake,
  | 'id'
  | 'dataEntryAt'
  | 'participant1Sync'
  | 'participant2Sync'
  | 'caseSync'
  | 'overallSyncStatus'
  | 'syncErrors'
  | 'syncedAt'
  | 'createdAt'
  | 'updatedAt'
>

/**
 * Search result for duplicate checking
 */
export interface LeadSearchResult {
  leadId: number
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phone?: string
  leadStatus: string
  leadUrl: string
  createdAt: string
  tags?: string[]
}

/**
 * Duplicate check result
 */
export interface DuplicateCheckResult {
  hasPotentialDuplicates: boolean
  matches: LeadSearchResult[]
  searchedName: string
}

// =============================================================================
// Form State Types (for UI)
// =============================================================================

/**
 * Form step for the data entry wizard
 */
export type DataEntryStep =
  | 'duplicate-check'
  | 'case-info'
  | 'participant-1'
  | 'participant-2'
  | 'dispute'
  | 'checklist'
  | 'review'

/**
 * Duplicate resolution action
 */
export type DuplicateAction = 'create-new' | 'link-existing' | 'skip'

/**
 * Participant duplicate resolution state
 */
export interface ParticipantDuplicateState {
  checked: boolean
  action?: DuplicateAction
  linkedLeadId?: number
  linkedLeadUrl?: string
}

/**
 * Complete form state for the data entry wizard
 */
export interface DataEntryFormState {
  currentStep: DataEntryStep

  // Duplicate check state
  participant1Duplicate: ParticipantDuplicateState
  participant2Duplicate: ParticipantDuplicateState

  // Form data (builds up as user progresses)
  formData: Partial<PaperIntakeInput>

  // UI state
  isSubmitting: boolean
  submitError?: string
}
