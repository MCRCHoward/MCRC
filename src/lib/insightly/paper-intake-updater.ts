/**
 * Paper Intake Insightly Updater
 *
 * Functions for updating existing Leads and Opportunities in Insightly.
 * Used by the edit flow to sync changes to CRM.
 *
 * API Verification (2026-02-28):
 * - PUT /Leads/{id} confirmed working with LEAD_ID in body
 * - Returns HTTP 200 with full updated Lead object
 * - OWNER_USER_ID and RESPONSIBLE_USER_ID should be preserved
 *
 * @see https://api.na1.insightly.com/v3.1/Help
 */

import { insightlyRequest } from './search'
import { buildLeadPayload, buildCasePayload } from './paper-intake-mapper'
import { buildLeadUrl, buildCaseUrl } from './paper-intake-config'
import type { PaperIntake, LeadSyncResult, CaseSyncResult } from '@/types/paper-intake'

// =============================================================================
// Types
// =============================================================================

export interface UpdateLeadOptions {
  /** Existing Lead ID to update */
  leadId: number
  /** Full intake data (for building payload) */
  intake: PaperIntake
  /** Which participant this Lead represents */
  participantNumber: 1 | 2
  /** Optional: preserve certain fields from existing Lead */
  existingLeadData?: {
    ownerUserId?: number
    responsibleUserId?: number
  }
}

export interface UpdateOpportunityOptions {
  /** Existing Opportunity ID to update */
  opportunityId: number
  /** Full intake data (for building payload) */
  intake: PaperIntake
}

export interface LinkParticipantOptions {
  /** Existing Case ID */
  opportunityId: number
  /** Newly created Lead ID */
  leadId: number
  /** For link details */
  participantNumber: 1 | 2
}

export interface LinkResult {
  success: boolean
  error?: string
}

// =============================================================================
// Lead Update
// =============================================================================

/**
 * Update an existing Lead in Insightly
 *
 * Builds the payload using the same function as create, then adds LEAD_ID
 * for the PUT request. Optionally preserves OWNER_USER_ID and RESPONSIBLE_USER_ID.
 *
 * @example
 * ```ts
 * const result = await updateLeadInInsightly({
 *   leadId: 80778575,
 *   intake: paperIntakeData,
 *   participantNumber: 1,
 *   existingLeadData: { ownerUserId: 2221466 }
 * })
 * ```
 */
export async function updateLeadInInsightly({
  leadId,
  intake,
  participantNumber,
  existingLeadData,
}: UpdateLeadOptions): Promise<LeadSyncResult> {
  // Determine which participant to use
  const participant =
    participantNumber === 1 ? intake.participant1 : intake.participant2

  // If participant doesn't exist (e.g., P2 was removed), skip
  if (!participant) {
    return { status: 'skipped' }
  }

  try {
    // Build the same payload as create (DRY: reuse existing function)
    const basePayload = await buildLeadPayload(
      participant,
      intake,
      participantNumber,
    )

    // Add required fields for PUT
    const updatePayload = {
      LEAD_ID: leadId,
      ...basePayload,
      // Preserve ownership fields if provided
      ...(existingLeadData?.ownerUserId !== undefined && {
        OWNER_USER_ID: existingLeadData.ownerUserId,
      }),
      ...(existingLeadData?.responsibleUserId !== undefined && {
        RESPONSIBLE_USER_ID: existingLeadData.responsibleUserId,
      }),
    }

    // PUT to update existing Lead
    await insightlyRequest(`/Leads/${leadId}`, {
      method: 'PUT',
      body: updatePayload,
    })

    return {
      leadId,
      leadUrl: buildLeadUrl(leadId),
      status: 'success',
      linkedToExisting: false,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      leadId, // Include for reference even on failure
      status: 'failed',
      error: `Update failed: ${message}`,
    }
  }
}

// =============================================================================
// Opportunity Update
// =============================================================================

/**
 * Update an existing Opportunity (Case) in Insightly
 *
 * Builds the payload using the same function as create, then adds OPPORTUNITY_ID
 * for the PUT request.
 *
 * @example
 * ```ts
 * const result = await updateOpportunityInInsightly({
 *   opportunityId: 123456,
 *   intake: paperIntakeData,
 * })
 * ```
 */
export async function updateOpportunityInInsightly({
  opportunityId,
  intake,
}: UpdateOpportunityOptions): Promise<CaseSyncResult> {
  try {
    // Build the same payload as create (DRY: reuse existing function)
    const basePayload = buildCasePayload(intake)

    // Add required field for PUT
    const updatePayload = {
      OPPORTUNITY_ID: opportunityId,
      ...basePayload,
    }

    // PUT to update existing Opportunity
    await insightlyRequest(`/Opportunities/${opportunityId}`, {
      method: 'PUT',
      body: updatePayload,
    })

    return {
      caseId: opportunityId,
      caseUrl: buildCaseUrl(opportunityId),
      status: 'success',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      caseId: opportunityId, // Include for reference even on failure
      status: 'failed',
      error: `Update failed: ${message}`,
    }
  }
}

// =============================================================================
// Link Participant to Case
// =============================================================================

/**
 * Link a newly created participant Lead to an existing Opportunity
 *
 * Used when P2 is added during an edit — the Lead is created but needs
 * to be linked to the existing Case.
 *
 * Note: This creates a new link. Insightly doesn't support updating or
 * removing links via this endpoint. Duplicate links may fail silently.
 *
 * @example
 * ```ts
 * const result = await linkParticipantToCase({
 *   opportunityId: 123456,
 *   leadId: 789012,
 *   participantNumber: 2,
 * })
 * ```
 */
export async function linkParticipantToCase({
  opportunityId,
  leadId,
  participantNumber,
}: LinkParticipantOptions): Promise<LinkResult> {
  try {
    await insightlyRequest(`/Opportunities/${opportunityId}/Links`, {
      method: 'POST',
      body: {
        LINK_OBJECT_NAME: 'Lead' as const,
        LINK_OBJECT_ID: leadId,
        DETAILS: `Participant ${participantNumber}`,
      },
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
