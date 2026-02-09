/**
 * Paper Intake Form Schema
 *
 * Zod validation schema for the paper intake data entry form.
 * Includes step-scoped field mapping for progressive validation.
 * 
 * CRITICAL FIXES APPLIED:
 * - optionalString helper transforms empty strings to undefined
 * - optionalEmail helper with transform + pipe pattern
 * - participantNumber field included in participantSchema
 * - DEFAULT_FORM_VALUES uses undefined for optional fields
 */

import { z } from 'zod'
import {
  REFERRAL_SOURCES,
  DISPUTE_TYPES,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  AGE_RANGES,
  INCOME_RANGES,
  EDUCATION_LEVELS,
  MILITARY_STATUSES,
} from '@/types/paper-intake'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Transform empty strings to undefined for optional fields
 * This ensures we don't send empty strings to the server
 */
const optionalString = z
  .string()
  .transform((val) => {
    const trimmed = val?.trim()
    return trimmed === '' ? undefined : trimmed
  })
  .optional()

/**
 * Email field with empty string handling
 * Transforms empty strings to undefined, then validates as email
 */
const optionalEmail = z
  .string()
  .optional()
  .transform((val) => {
    const trimmed = val?.trim()
    return trimmed === '' ? undefined : trimmed
  })
  .pipe(z.string().email('Invalid email address').optional())

// =============================================================================
// Sub-schemas
// =============================================================================

const participantDemographicsSchema = z.object({
  gender: z.enum(GENDER_OPTIONS).optional(),
  race: z.enum(RACE_OPTIONS).optional(),
  ageRange: z.enum(AGE_RANGES).optional(),
  income: z.enum(INCOME_RANGES).optional(),
  education: z.enum(EDUCATION_LEVELS).optional(),
  militaryStatus: z.enum(MILITARY_STATUSES).optional(),
})

const participantAddressSchema = z.object({
  street: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
})

const participantSchema = z.object({
  participantNumber: optionalString, // CRITICAL: Must include for server compatibility
  name: z.string().min(1, 'Name is required'),
  firstName: optionalString,
  lastName: optionalString,
  email: optionalEmail, // CRITICAL: Special email handling
  phone: optionalString,
  homePhone: optionalString,
  address: participantAddressSchema.optional(),
  canSendJointEmail: z.boolean().optional(),
  attorney: optionalString,
  bestCallTime: optionalString,
  bestMeetTime: optionalString,
  demographics: participantDemographicsSchema.optional(),
})

const phoneChecklistSchema = z.object({
  explainedProcess: z.boolean(),
  explainedNeutrality: z.boolean(),
  explainedConfidentiality: z.boolean(),
  policeInvolvement: z.boolean(),
  peaceProtectiveOrder: z.boolean(),
  safetyScreeningComplete: z.boolean(),
})

const staffAssessmentSchema = z.object({
  canRepresentSelf: z.boolean(),
  noFearOfCoercion: z.boolean(),
  noDangerToSelf: z.boolean(),
  noDangerToCenter: z.boolean(),
})

// =============================================================================
// Main Form Schema
// =============================================================================

export const paperIntakeFormSchema = z
  .object({
    // Step 1: Duplicate Check (names only for search)
    // No validation here - handled separately

    // Step 2: Case & Dispute
    caseNumber: optionalString,
    intakeDate: z.string().min(1, 'Intake date is required'),
    intakePerson: optionalString,
    referralSource: z.enum(REFERRAL_SOURCES).optional(),
    isCourtOrdered: z.boolean(),
    magistrateJudge: optionalString,
    disputeType: z.enum(DISPUTE_TYPES).optional(),
    disputeDescription: z.string().min(1, 'Please describe the nature of the dispute'),

    // Step 3: Participants
    // Note: hasParticipant2 is UI-only, not sent to server
    participant1: participantSchema,
    hasParticipant2: z.boolean(),
    participant2: participantSchema.optional(),

    // Step 4: Checklist & Review
    phoneChecklist: phoneChecklistSchema,
    staffAssessment: staffAssessmentSchema,
    staffNotes: optionalString,
  })
  .refine(
    (data) => {
      // If hasParticipant2 is true and participant2 exists, validate it has a name
      if (data.hasParticipant2 && data.participant2) {
        return data.participant2.name && data.participant2.name.trim().length > 0
      }
      return true
    },
    {
      message: 'Participant 2 name is required when adding a second participant',
      path: ['participant2', 'name'],
    }
  )

export type PaperIntakeFormValues = z.infer<typeof paperIntakeFormSchema>

// =============================================================================
// Step Configuration
// =============================================================================

export const FORM_STEPS = [
  {
    id: 'duplicate-check',
    title: 'Check for Duplicates',
    description: 'Search Insightly before creating new records',
  },
  {
    id: 'case-dispute',
    title: 'Case & Dispute Details',
    description: 'Case metadata and nature of the dispute',
  },
  {
    id: 'participants',
    title: 'Participant Information',
    description: 'Contact details and demographics',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Verify information and complete checklist',
  },
] as const

export type FormStepId = (typeof FORM_STEPS)[number]['id']

/**
 * Fields to validate for each step
 * Step 0 (duplicate-check): No form validation - uses separate state
 * Step 1 (case-dispute): Case metadata + dispute
 * Step 2 (participants): Participant data
 * Step 3 (review): Checklist + assessment (validate all on submit)
 */
export const STEP_FIELDS: Record<number, (keyof PaperIntakeFormValues)[]> = {
  0: [], // Duplicate check uses separate validation
  1: [
    'caseNumber',
    'intakeDate',
    'intakePerson',
    'referralSource',
    'isCourtOrdered',
    'magistrateJudge',
    'disputeType',
    'disputeDescription',
  ],
  2: ['participant1', 'hasParticipant2', 'participant2'],
  3: ['phoneChecklist', 'staffAssessment', 'staffNotes'],
}

// =============================================================================
// Default Values
// =============================================================================

/**
 * CRITICAL: Use undefined for optional fields, NOT empty strings
 * The transform helpers convert empty strings to undefined, so defaults must match
 */
export const DEFAULT_FORM_VALUES = {
  // Case Info
  caseNumber: undefined,
  intakeDate: new Date().toISOString().slice(0, 10),
  intakePerson: undefined,
  referralSource: undefined,
  isCourtOrdered: false,
  magistrateJudge: undefined,

  // Dispute
  disputeType: undefined,
  disputeDescription: '', // Required field, keep as empty string for validation

  // Participants
  participant1: {
    name: '', // Required field, keep as empty string for validation
    email: undefined,
    phone: undefined,
    homePhone: undefined,
    address: {
      street: undefined,
      city: undefined,
      state: 'MD', // Default state
      zipCode: undefined,
    },
    canSendJointEmail: false,
    attorney: undefined,
    bestCallTime: undefined,
    bestMeetTime: undefined,
    demographics: {},
  },
  hasParticipant2: true,
  participant2: {
    name: '',
    email: undefined,
    phone: undefined,
    homePhone: undefined,
    address: {
      street: undefined,
      city: undefined,
      state: 'MD',
      zipCode: undefined,
    },
    canSendJointEmail: false,
    attorney: undefined,
    bestCallTime: undefined,
    bestMeetTime: undefined,
    demographics: {},
  },

  // Checklist & Assessment
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
  staffNotes: undefined,
} satisfies PaperIntakeFormValues
