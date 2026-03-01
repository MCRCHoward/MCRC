'use server'

/**
 * Paper Intake Server Actions
 *
 * Server-side operations for paper intake data entry,
 * including Firestore CRUD and Insightly sync.
 */

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { adminDb } from '@/lib/firebase-admin'
import { getCurrentUser, requireRoleAny } from '@/lib/custom-auth'
import { toISOString } from '@/app/(frontend)/(cms)/dashboard/utils/timestamp-helpers'
import {
  buildCaseUrl,
  buildLeadUrl,
  isInsightlyConfigured,
  INSIGHTLY_API_KEY,
  INSIGHTLY_API_URL,
} from '@/lib/insightly/paper-intake-config'
import {
  checkForDuplicates,
  ensureLeadSourcesExist,
  insightlyRequest,
} from '@/lib/insightly/search'
import {
  buildLeadPayload,
  buildCasePayload,
  buildLeadToCaseLink,
  buildLinkingNote,
} from '@/lib/insightly/paper-intake-mapper'
import {
  updateLeadInInsightly,
  updateOpportunityInInsightly,
  linkParticipantToCase,
} from '@/lib/insightly/paper-intake-updater'
import {
  AGE_RANGES,
  DISPUTE_TYPES,
  EDUCATION_LEVELS,
  GENDER_OPTIONS,
  INCOME_RANGES,
  MILITARY_STATUSES,
  RACE_OPTIONS,
  REFERRAL_SOURCES,
} from '@/types/paper-intake'
import type {
  PaperIntake,
  PaperIntakeInput,
  DuplicateCheckResult,
} from '@/types/paper-intake'

// =============================================================================
// Constants
// =============================================================================

const COLLECTION_NAME = 'paperIntakes'

// =============================================================================
// Validation
// =============================================================================

const ParticipantDemographicsSchema = z.object({
  gender: z.enum(GENDER_OPTIONS).optional(),
  race: z.enum(RACE_OPTIONS).optional(),
  ageRange: z.enum(AGE_RANGES).optional(),
  income: z.enum(INCOME_RANGES).optional(),
  education: z.enum(EDUCATION_LEVELS).optional(),
  militaryStatus: z.enum(MILITARY_STATUSES).optional(),
})

const ParticipantAddressSchema = z.object({
  street: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
})

const ParticipantDataSchema = z.object({
  participantNumber: z.string().min(1).optional(),
  name: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  address: ParticipantAddressSchema.optional(),
  homePhone: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  canSendJointEmail: z.boolean().optional(),
  attorney: z.string().min(1).optional(),
  bestCallTime: z.string().min(1).optional(),
  bestMeetTime: z.string().min(1).optional(),
  demographics: ParticipantDemographicsSchema.optional(),
})

const PhoneChecklistSchema = z.object({
  explainedProcess: z.boolean(),
  explainedNeutrality: z.boolean(),
  explainedConfidentiality: z.boolean(),
  policeInvolvement: z.boolean(),
  peaceProtectiveOrder: z.boolean(),
  safetyScreeningComplete: z.boolean(),
})

const StaffAssessmentSchema = z.object({
  canRepresentSelf: z.boolean(),
  noFearOfCoercion: z.boolean(),
  noDangerToSelf: z.boolean(),
  noDangerToCenter: z.boolean(),
})

const PaperIntakeInputSchema = z.object({
  caseNumber: z.string().min(1).optional(),
  intakeDate: z.string().min(1),
  intakePerson: z.string().min(1).optional(),
  dataEntryBy: z.string().min(1).optional(),
  dataEntryByName: z.string().min(1).optional(),
  paperFormId: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(),
  referralSource: z.enum(REFERRAL_SOURCES).optional(),
  disputeType: z.enum(DISPUTE_TYPES).optional(),
  disputeDescription: z.string().min(1),
  isCourtOrdered: z.boolean(),
  magistrateJudge: z.string().min(1).optional(),
  participant1: ParticipantDataSchema,
  participant2: ParticipantDataSchema.optional(),
  phoneChecklist: PhoneChecklistSchema,
  staffAssessment: StaffAssessmentSchema,
  staffNotes: z.string().min(1).optional(),
})

// =============================================================================
// Helpers
// =============================================================================

function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  ) as Partial<T>
}

function serializePaperIntake(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): PaperIntake {
  const data = doc.data() ?? {}
  return {
    id: doc.id,
    ...data,
    dataEntryAt: toISOString(data.dataEntryAt) ?? new Date().toISOString(),
    syncedAt: toISOString(data.syncedAt),
    createdAt: toISOString(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toISOString(data.updatedAt) ?? new Date().toISOString(),
    lastEditedAt: toISOString(data.lastEditedAt),
  } as PaperIntake
}

function assertInsightlyConfigured(): void {
  if (!INSIGHTLY_API_KEY || !INSIGHTLY_API_URL) {
    throw new Error('Insightly is not configured')
  }
}

// =============================================================================
// Duplicate Check Actions
// =============================================================================

/**
 * Search for potential duplicate Leads by name
 */
export async function searchForDuplicates(
  name: string,
  email?: string,
): Promise<{ success: boolean; result?: DuplicateCheckResult; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!isInsightlyConfigured()) {
      return { success: false, error: 'Insightly is not configured' }
    }

    const result = await checkForDuplicates(name, email)

    return { success: true, result }
  } catch (error) {
    console.error('[Paper Intake] Duplicate check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// Setup Actions
// =============================================================================

/**
 * Initialize Lead Sources in Insightly
 * Should be called once before using the data entry feature
 */
export async function initializeLeadSources(): Promise<{
  success: boolean
  created: string[]
  errors: string[]
}> {
  try {
    await requireRoleAny(['admin', 'coordinator'])

    const result = await ensureLeadSourcesExist()

    return {
      success: result.success,
      created: result.created,
      errors: result.errors,
    }
  } catch (error) {
    console.error('[Paper Intake] Lead source initialization error:', error)
    return {
      success: false,
      created: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

// =============================================================================
// Paper Intake CRUD Actions
// =============================================================================

/**
 * Create a new paper intake and sync to Insightly
 */
export async function createPaperIntake(
  input: PaperIntakeInput,
  options?: {
    participant1LinkedLeadId?: number
    participant2LinkedLeadId?: number
  },
): Promise<{
  success: boolean
  intakeId?: string
  intake?: PaperIntake
  error?: string
}> {
  try {
    const user = await requireRoleAny(['admin', 'coordinator'])

    const parsed = PaperIntakeInputSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.message }
    }

    const now = new Date().toISOString()

    const intakeForSync: PaperIntake = {
      id: 'pending',
      ...parsed.data,
      dataEntryBy: user.id,
      dataEntryByName: user.name || user.email,
      dataEntryAt: now,
      overallSyncStatus: 'pending',
      syncErrors: [],
      createdAt: now,
      updatedAt: now,
    }

    const intakeData = removeUndefined({
      ...parsed.data,
      dataEntryBy: user.id,
      dataEntryByName: user.name || user.email,
      dataEntryAt: FieldValue.serverTimestamp(),
      overallSyncStatus: 'pending',
      syncErrors: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const docRef = await adminDb.collection(COLLECTION_NAME).add(intakeData)
    const intakeId = docRef.id

    const syncResult = await syncPaperIntakeToInsightly(
      { ...intakeForSync, id: intakeId },
      options,
    )

    await adminDb.doc(`${COLLECTION_NAME}/${intakeId}`).update(
      removeUndefined({
        participant1Sync: syncResult.participant1Sync,
        participant2Sync: syncResult.participant2Sync,
        caseSync: syncResult.caseSync,
        overallSyncStatus: syncResult.overallSyncStatus,
        syncErrors: syncResult.syncErrors,
        syncedAt:
          syncResult.overallSyncStatus === 'success'
            ? FieldValue.serverTimestamp()
            : undefined,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    )

    const updatedDoc = await adminDb.doc(`${COLLECTION_NAME}/${intakeId}`).get()
    const intake = serializePaperIntake(updatedDoc)

    revalidatePath('/dashboard/mediation/data-entry')

    return { success: true, intakeId, intake }
  } catch (error) {
    console.error('[Paper Intake] Create error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync a paper intake to Insightly
 * Creates Leads for participants and a Case, then links them
 */
async function syncPaperIntakeToInsightly(
  intake: PaperIntake,
  options?: {
    participant1LinkedLeadId?: number
    participant2LinkedLeadId?: number
  },
): Promise<{
  participant1Sync: PaperIntake['participant1Sync']
  participant2Sync: PaperIntake['participant2Sync']
  caseSync: PaperIntake['caseSync']
  overallSyncStatus: PaperIntake['overallSyncStatus']
  syncErrors: string[]
}> {
  const syncErrors: string[] = []
  let participant1Sync: PaperIntake['participant1Sync']
  let participant2Sync: PaperIntake['participant2Sync']
  let caseSync: PaperIntake['caseSync']

  if (!isInsightlyConfigured()) {
    return {
      participant1Sync: { status: 'failed', error: 'Insightly not configured' },
      participant2Sync: intake.participant2
        ? { status: 'failed', error: 'Insightly not configured' }
        : { status: 'skipped' },
      caseSync: { status: 'failed', error: 'Insightly not configured' },
      overallSyncStatus: 'failed',
      syncErrors: ['Insightly API is not configured'],
    }
  }

  assertInsightlyConfigured()

  if (options?.participant1LinkedLeadId) {
    participant1Sync = {
      leadId: options.participant1LinkedLeadId,
      leadUrl: buildLeadUrl(options.participant1LinkedLeadId),
      status: 'linked',
      linkedToExisting: true,
    }

    try {
      const note = buildLinkingNote(intake.id, intake.caseNumber)
      await insightlyRequest(`/Leads/${options.participant1LinkedLeadId}/Notes`, {
        method: 'POST',
        body: note,
      })
    } catch (error) {
      console.warn('[Paper Intake] Failed to add linking note to Lead:', error)
    }
  } else {
    try {
      const leadPayload = await buildLeadPayload(intake.participant1, intake, 1)
      const createdLead = await insightlyRequest<{ LEAD_ID: number }>('/Leads', {
        method: 'POST',
        body: leadPayload,
      })

      participant1Sync = {
        leadId: createdLead.LEAD_ID,
        leadUrl: buildLeadUrl(createdLead.LEAD_ID),
        status: 'success',
        linkedToExisting: false,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      participant1Sync = { status: 'failed', error: message }
      syncErrors.push(`Participant 1 Lead: ${message}`)
    }
  }

  if (intake.participant2) {
    if (options?.participant2LinkedLeadId) {
      participant2Sync = {
        leadId: options.participant2LinkedLeadId,
        leadUrl: buildLeadUrl(options.participant2LinkedLeadId),
        status: 'linked',
        linkedToExisting: true,
      }

      try {
        const note = buildLinkingNote(intake.id, intake.caseNumber)
        await insightlyRequest(`/Leads/${options.participant2LinkedLeadId}/Notes`, {
          method: 'POST',
          body: note,
        })
      } catch (error) {
        console.warn('[Paper Intake] Failed to add linking note to Lead:', error)
      }
    } else {
      try {
        const leadPayload = await buildLeadPayload(intake.participant2, intake, 2)
        const createdLead = await insightlyRequest<{ LEAD_ID: number }>('/Leads', {
          method: 'POST',
          body: leadPayload,
        })

        participant2Sync = {
          leadId: createdLead.LEAD_ID,
          leadUrl: buildLeadUrl(createdLead.LEAD_ID),
          status: 'success',
          linkedToExisting: false,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        participant2Sync = { status: 'failed', error: message }
        syncErrors.push(`Participant 2 Lead: ${message}`)
      }
    }
  } else {
    participant2Sync = { status: 'skipped' }
  }

  try {
    const casePayload = buildCasePayload(intake)
    const createdCase = await insightlyRequest<{ OPPORTUNITY_ID: number }>(
      '/Opportunities',
      {
        method: 'POST',
        body: casePayload,
      },
    )

    caseSync = {
      caseId: createdCase.OPPORTUNITY_ID,
      caseUrl: buildCaseUrl(createdCase.OPPORTUNITY_ID),
      status: 'success',
    }

    const caseId = createdCase.OPPORTUNITY_ID

    if (participant1Sync?.leadId) {
      try {
        const link = buildLeadToCaseLink(participant1Sync.leadId, 1)
        await insightlyRequest(`/Opportunities/${caseId}/Links`, {
          method: 'POST',
          body: link,
        })
      } catch (error) {
        console.warn('[Paper Intake] Failed to link Lead 1 to Case:', error)
      }
    }

    if (participant2Sync?.leadId) {
      try {
        const link = buildLeadToCaseLink(participant2Sync.leadId, 2)
        await insightlyRequest(`/Opportunities/${caseId}/Links`, {
          method: 'POST',
          body: link,
        })
      } catch (error) {
        console.warn('[Paper Intake] Failed to link Lead 2 to Case:', error)
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    caseSync = { status: 'failed', error: message }
    syncErrors.push(`Case: ${message}`)
  }

  let overallSyncStatus: PaperIntake['overallSyncStatus']

  const hasFailure =
    participant1Sync?.status === 'failed' ||
    participant2Sync?.status === 'failed' ||
    caseSync?.status === 'failed'

  const hasSuccess =
    participant1Sync?.status === 'success' ||
    participant1Sync?.status === 'linked' ||
    participant2Sync?.status === 'success' ||
    participant2Sync?.status === 'linked' ||
    caseSync?.status === 'success'

  if (hasFailure && hasSuccess) {
    overallSyncStatus = 'partial'
  } else if (hasFailure) {
    overallSyncStatus = 'failed'
  } else {
    overallSyncStatus = 'success'
  }

  return {
    participant1Sync,
    participant2Sync,
    caseSync,
    overallSyncStatus,
    syncErrors,
  }
}

/**
 * Sync an edited paper intake to Insightly
 *
 * Handles all scenarios:
 * - Update existing Leads/Opportunities via PUT
 * - Create missing records (from failed initial sync) via POST
 * - Link newly added participants to existing Case
 *
 * @internal Not exported — used only by updatePaperIntake
 */
async function syncEditedIntakeToInsightly(
  intake: PaperIntake,
  previousIntake: PaperIntake,
): Promise<{
  participant1Sync: PaperIntake['participant1Sync']
  participant2Sync: PaperIntake['participant2Sync']
  caseSync: PaperIntake['caseSync']
  syncErrors: string[]
}> {
  const syncErrors: string[] = []
  let participant1Sync: PaperIntake['participant1Sync']
  let participant2Sync: PaperIntake['participant2Sync']
  let caseSync: PaperIntake['caseSync']

  if (!isInsightlyConfigured()) {
    return {
      participant1Sync: { status: 'failed', error: 'Insightly not configured' },
      participant2Sync: previousIntake.participant2
        ? { status: 'failed', error: 'Insightly not configured' }
        : { status: 'skipped' },
      caseSync: { status: 'failed', error: 'Insightly not configured' },
      syncErrors: ['Insightly API is not configured'],
    }
  }

  // =========================================================================
  // Participant 1 Lead
  // =========================================================================

  const p1ExistingLeadId = previousIntake.participant1Sync?.leadId

  if (p1ExistingLeadId) {
    participant1Sync = await updateLeadInInsightly({
      leadId: p1ExistingLeadId,
      intake,
      participantNumber: 1,
    })

    if (participant1Sync.status === 'failed') {
      syncErrors.push(`Participant 1 Lead update: ${participant1Sync.error}`)
    }
  } else {
    try {
      const leadPayload = await buildLeadPayload(intake.participant1, intake, 1)
      const createdLead = await insightlyRequest<{ LEAD_ID: number }>('/Leads', {
        method: 'POST',
        body: leadPayload,
      })

      participant1Sync = {
        leadId: createdLead.LEAD_ID,
        leadUrl: buildLeadUrl(createdLead.LEAD_ID),
        status: 'success',
        linkedToExisting: false,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      participant1Sync = { status: 'failed', error: message }
      syncErrors.push(`Participant 1 Lead create: ${message}`)
    }
  }

  // =========================================================================
  // Participant 2 Lead
  // =========================================================================

  if (intake.participant2?.name) {
    const p2ExistingLeadId = previousIntake.participant2Sync?.leadId
    const p2PreviouslyFailed = previousIntake.participant2Sync?.status === 'failed'
    const p2IsNewlyAdded = !previousIntake.participant2?.name

    if (p2ExistingLeadId) {
      participant2Sync = await updateLeadInInsightly({
        leadId: p2ExistingLeadId,
        intake,
        participantNumber: 2,
      })

      if (participant2Sync.status === 'failed') {
        syncErrors.push(`Participant 2 Lead update: ${participant2Sync.error}`)
      }
    } else if (p2IsNewlyAdded || p2PreviouslyFailed) {
      try {
        const leadPayload = await buildLeadPayload(intake.participant2, intake, 2)
        const createdLead = await insightlyRequest<{ LEAD_ID: number }>(
          '/Leads',
          {
            method: 'POST',
            body: leadPayload,
          },
        )

        participant2Sync = {
          leadId: createdLead.LEAD_ID,
          leadUrl: buildLeadUrl(createdLead.LEAD_ID),
          status: 'success',
          linkedToExisting: false,
        }

        const existingCaseId = previousIntake.caseSync?.caseId
        if (existingCaseId) {
          const linkResult = await linkParticipantToCase({
            opportunityId: existingCaseId,
            leadId: createdLead.LEAD_ID,
            participantNumber: 2,
          })

          if (!linkResult.success) {
            console.warn(
              '[Paper Intake] Failed to link P2 to existing case:',
              linkResult.error,
            )
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        participant2Sync = { status: 'failed', error: message }
        syncErrors.push(`Participant 2 Lead create: ${message}`)
      }
    } else {
      participant2Sync = previousIntake.participant2Sync
    }
  } else {
    participant2Sync = previousIntake.participant2Sync ?? { status: 'skipped' }
  }

  // =========================================================================
  // Case (Opportunity)
  // =========================================================================

  const caseExistingId = previousIntake.caseSync?.caseId

  if (caseExistingId) {
    caseSync = await updateOpportunityInInsightly({
      opportunityId: caseExistingId,
      intake,
    })

    if (caseSync.status === 'failed') {
      syncErrors.push(`Case update: ${caseSync.error}`)
    }
  } else {
    try {
      const casePayload = buildCasePayload(intake)
      const createdCase = await insightlyRequest<{ OPPORTUNITY_ID: number }>(
        '/Opportunities',
        { method: 'POST', body: casePayload },
      )

      caseSync = {
        caseId: createdCase.OPPORTUNITY_ID,
        caseUrl: buildCaseUrl(createdCase.OPPORTUNITY_ID),
        status: 'success',
      }

      if (participant1Sync?.leadId) {
        try {
          const link = buildLeadToCaseLink(participant1Sync.leadId, 1)
          await insightlyRequest(
            `/Opportunities/${createdCase.OPPORTUNITY_ID}/Links`,
            { method: 'POST', body: link },
          )
        } catch (error) {
          console.warn('[Paper Intake] Failed to link P1 to new case:', error)
        }
      }

      if (participant2Sync?.leadId) {
        try {
          const link = buildLeadToCaseLink(participant2Sync.leadId, 2)
          await insightlyRequest(
            `/Opportunities/${createdCase.OPPORTUNITY_ID}/Links`,
            { method: 'POST', body: link },
          )
        } catch (error) {
          console.warn('[Paper Intake] Failed to link P2 to new case:', error)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      caseSync = { status: 'failed', error: message }
      syncErrors.push(`Case create: ${message}`)
    }
  }

  return {
    participant1Sync,
    participant2Sync,
    caseSync,
    syncErrors,
  }
}

/**
 * Update an existing paper intake and sync changes to Insightly
 *
 * This action:
 * 1. Validates merged input (merge before validate for partial nested updates)
 * 2. Fetches existing intake from Firestore
 * 3. Merges input with existing data
 * 4. Syncs changes to Insightly (PUT for existing records, POST for failed/new)
 * 5. Updates Firestore with merged data + sync results + edit tracking
 */
export async function updatePaperIntake(
  intakeId: string,
  input: Partial<PaperIntakeInput>,
): Promise<{
  success: boolean
  intake?: PaperIntake
  error?: string
}> {
  try {
    const user = await requireRoleAny(['admin', 'coordinator'])

    const docRef = adminDb.doc(`${COLLECTION_NAME}/${intakeId}`)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return { success: false, error: 'Intake not found' }
    }

    const previousIntake = serializePaperIntake(docSnap)

    // Merge before validation (Bug 1: allows partial participant updates)
    const mergedParticipant1 = input.participant1
      ? { ...previousIntake.participant1, ...input.participant1 }
      : previousIntake.participant1

    // Bug 2: preserve undefined when P2 not in input
    const mergedParticipant2 = input.participant2
      ? { ...previousIntake.participant2, ...input.participant2 }
      : previousIntake.participant2

    const mergedInput = {
      ...previousIntake,
      ...input,
      participant1: mergedParticipant1,
      participant2: mergedParticipant2,
    }

    const parsed = PaperIntakeInputSchema.safeParse(mergedInput)
    if (!parsed.success) {
      console.error('[Paper Intake] Merged data failed validation:', parsed.error)
      return { success: false, error: 'Invalid data after merge' }
    }

    const mergedIntake: PaperIntake = {
      ...previousIntake,
      ...parsed.data,
      participant1: mergedParticipant1,
      participant2: mergedParticipant2,
      participant1Sync: previousIntake.participant1Sync,
      participant2Sync: previousIntake.participant2Sync,
      caseSync: previousIntake.caseSync,
    }

    const syncResult = await syncEditedIntakeToInsightly(
      mergedIntake,
      previousIntake,
    )

    const hasFailure =
      syncResult.participant1Sync?.status === 'failed' ||
      syncResult.participant2Sync?.status === 'failed' ||
      syncResult.caseSync?.status === 'failed'

    const hasSuccess =
      syncResult.participant1Sync?.status === 'success' ||
      syncResult.participant1Sync?.status === 'linked' ||
      syncResult.participant2Sync?.status === 'success' ||
      syncResult.participant2Sync?.status === 'linked' ||
      syncResult.caseSync?.status === 'success'

    let overallSyncStatus: PaperIntake['overallSyncStatus']
    if (hasFailure && hasSuccess) {
      overallSyncStatus = 'partial'
    } else if (hasFailure) {
      overallSyncStatus = 'failed'
    } else {
      overallSyncStatus = 'success'
    }

    const updateData = removeUndefined({
      ...parsed.data,
      participant1: mergedParticipant1,
      participant2: mergedParticipant2,
      participant1Sync: syncResult.participant1Sync,
      participant2Sync: syncResult.participant2Sync,
      caseSync: syncResult.caseSync,
      overallSyncStatus,
      syncErrors:
        syncResult.syncErrors.length > 0 ? syncResult.syncErrors : [],
      syncedAt:
        overallSyncStatus === 'success' ? FieldValue.serverTimestamp() : undefined,
      lastEditedAt: FieldValue.serverTimestamp(),
      lastEditedBy: user.id,
      lastEditedByName: user.name || user.email,
      editCount: (previousIntake.editCount ?? 0) + 1,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await docRef.update(updateData)

    const updatedDoc = await docRef.get()
    const updatedIntake = serializePaperIntake(updatedDoc)

    revalidatePath('/dashboard/mediation/data-entry')
    revalidatePath('/dashboard/mediation/data-entry/history')

    return { success: true, intake: updatedIntake }
  } catch (error) {
    console.error('[Paper Intake] Update error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Retry syncing a failed paper intake
 */
export async function retrySyncPaperIntake(
  intakeId: string,
): Promise<{ success: boolean; intake?: PaperIntake; error?: string }> {
  try {
    await requireRoleAny(['admin', 'coordinator'])

    const docRef = adminDb.doc(`${COLLECTION_NAME}/${intakeId}`)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return { success: false, error: 'Intake not found' }
    }

    const intake = serializePaperIntake(docSnap)

    if (intake.overallSyncStatus === 'success') {
      return { success: true, intake }
    }

    const syncResult = await syncPaperIntakeToInsightly(intake, {
      participant1LinkedLeadId: intake.participant1Sync?.linkedToExisting
        ? intake.participant1Sync.leadId
        : undefined,
      participant2LinkedLeadId: intake.participant2Sync?.linkedToExisting
        ? intake.participant2Sync.leadId
        : undefined,
    })

    await docRef.update(
      removeUndefined({
        participant1Sync: syncResult.participant1Sync,
        participant2Sync: syncResult.participant2Sync,
        caseSync: syncResult.caseSync,
        overallSyncStatus: syncResult.overallSyncStatus,
        syncErrors: syncResult.syncErrors,
        syncedAt:
          syncResult.overallSyncStatus === 'success'
            ? FieldValue.serverTimestamp()
            : undefined,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    )

    const updatedDoc = await docRef.get()
    const updatedIntake = serializePaperIntake(updatedDoc)

    revalidatePath('/dashboard/mediation/data-entry')

    return { success: true, intake: updatedIntake }
  } catch (error) {
    console.error('[Paper Intake] Retry sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// Query Actions
// =============================================================================

/**
 * Fetch paper intake history
 */
export async function fetchPaperIntakeHistory(options?: {
  limit?: number
  status?: PaperIntake['overallSyncStatus']
}): Promise<{
  success: boolean
  intakes: PaperIntake[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, intakes: [], error: 'Not authenticated' }
    }

    let query = adminDb.collection(COLLECTION_NAME).orderBy('createdAt', 'desc')

    if (options?.status) {
      query = query.where('overallSyncStatus', '==', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const snapshot = await query.get()
    const intakes = snapshot.docs.map(serializePaperIntake)

    return { success: true, intakes }
  } catch (error) {
    console.error('[Paper Intake] Fetch history error:', error)
    return {
      success: false,
      intakes: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch a single paper intake by ID
 */
export async function fetchPaperIntake(
  intakeId: string,
): Promise<{ success: boolean; intake?: PaperIntake; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const docRef = adminDb.doc(`${COLLECTION_NAME}/${intakeId}`)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return { success: false, error: 'Intake not found' }
    }

    const intake = serializePaperIntake(docSnap)

    return { success: true, intake }
  } catch (error) {
    console.error('[Paper Intake] Fetch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get counts for dashboard statistics
 */
export async function getPaperIntakeStats(): Promise<{
  success: boolean
  stats?: {
    total: number
    synced: number
    failed: number
    partial: number
    pending: number
  }
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const snapshot = await adminDb.collection(COLLECTION_NAME).get()
    const intakes = snapshot.docs.map(serializePaperIntake)

    const stats = {
      total: intakes.length,
      synced: intakes.filter((i) => i.overallSyncStatus === 'success').length,
      failed: intakes.filter((i) => i.overallSyncStatus === 'failed').length,
      partial: intakes.filter((i) => i.overallSyncStatus === 'partial').length,
      pending: intakes.filter((i) => i.overallSyncStatus === 'pending').length,
    }

    return { success: true, stats }
  } catch (error) {
    console.error('[Paper Intake] Stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
