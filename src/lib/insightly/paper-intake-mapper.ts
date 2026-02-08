/**
 * Paper Intake to Insightly Mapper
 *
 * Converts paper intake form data to Insightly API payloads
 * for creating Leads and Cases (Opportunities).
 */

import type {
  PaperIntake,
  ParticipantData,
  ParticipantDemographics,
} from '@/types/paper-intake'
import {
  CASE_PIPELINE_ID,
  DEFAULT_CASE_STAGE_ID,
  CASE_CUSTOM_FIELDS,
  DISPUTE_TYPE_TO_CASE_TYPE,
  SESSION_TYPE_MEDIATION,
  REFERRAL_TO_LEAD_SOURCE,
  buildLeadTags,
} from './paper-intake-config'
import { getLeadSourceId } from './search'

// =============================================================================
// Lead Payload Builder
// =============================================================================

interface InsightlyLeadPayload {
  FIRST_NAME: string
  LAST_NAME: string
  EMAIL?: string
  PHONE?: string
  MOBILE?: string
  ADDRESS_STREET?: string
  ADDRESS_CITY?: string
  ADDRESS_STATE?: string
  ADDRESS_POSTCODE?: string
  LEAD_SOURCE_ID?: number
  LEAD_DESCRIPTION: string
  TAGS?: Array<{ TAG_NAME: string }>
}

/**
 * Format demographics for the Lead description
 */
function formatDemographicsForDescription(
  demographics?: ParticipantDemographics,
): string {
  if (!demographics) return ''

  const lines: string[] = []

  if (demographics.gender) {
    lines.push(`Gender: ${demographics.gender}`)
  }
  if (demographics.race) {
    lines.push(`Race: ${demographics.race}`)
  }
  if (demographics.ageRange) {
    lines.push(`Age Range: ${demographics.ageRange}`)
  }
  if (demographics.income) {
    lines.push(`Income: ${demographics.income}`)
  }
  if (demographics.education) {
    lines.push(`Education: ${demographics.education}`)
  }
  if (demographics.militaryStatus) {
    lines.push(`Military Status: ${demographics.militaryStatus}`)
  }

  return lines.length > 0
    ? `\nDemographics\n${'-'.repeat(50)}\n${lines.join('\n')}`
    : ''
}

/**
 * Format participant details for the Lead description
 */
function formatParticipantDescription(
  participant: ParticipantData,
  intake: PaperIntake,
  participantNumber: 1 | 2,
): string {
  const sections: string[] = []

  sections.push(`Source: Paper Intake Form (${intake.intakeDate})`)
  sections.push(`Participant ${participantNumber}`)
  sections.push('='.repeat(50))

  const contactPrefs: string[] = []
  if (participant.bestCallTime) {
    contactPrefs.push(`Best Call Time: ${participant.bestCallTime}`)
  }
  if (participant.bestMeetTime) {
    contactPrefs.push(`Best Time/Days to Meet: ${participant.bestMeetTime}`)
  }
  if (participant.canSendJointEmail !== undefined) {
    contactPrefs.push(`Joint Email OK: ${participant.canSendJointEmail ? 'Yes' : 'No'}`)
  }
  if (participant.attorney) {
    contactPrefs.push(`Attorney: ${participant.attorney}`)
  }

  if (contactPrefs.length > 0) {
    sections.push('\nContact Preferences')
    sections.push('-'.repeat(50))
    sections.push(contactPrefs.join('\n'))
  }

  const demographicsSection = formatDemographicsForDescription(participant.demographics)
  if (demographicsSection) {
    sections.push(demographicsSection)
  }

  sections.push('\nCase Context')
  sections.push('-'.repeat(50))
  if (intake.caseNumber) {
    sections.push(`Case Number: ${intake.caseNumber}`)
  }
  if (intake.referralSource) {
    sections.push(`Referral Source: ${intake.referralSource}`)
  }
  if (intake.disputeType) {
    sections.push(`Dispute Type: ${intake.disputeType}`)
  }
  sections.push(`Court Ordered: ${intake.isCourtOrdered ? 'Yes' : 'No'}`)
  if (intake.magistrateJudge) {
    sections.push(`Magistrate/Judge: ${intake.magistrateJudge}`)
  }

  sections.push('\nSafety Screening')
  sections.push('-'.repeat(50))
  sections.push(
    `Police Involvement: ${intake.phoneChecklist.policeInvolvement ? 'Yes' : 'No'}`,
  )
  sections.push(
    `Peace/Protective Order: ${intake.phoneChecklist.peaceProtectiveOrder ? 'Yes' : 'No'}`,
  )
  sections.push(
    `Safety Screening Complete: ${intake.phoneChecklist.safetyScreeningComplete ? 'Yes' : 'No'}`,
  )

  if (intake.staffNotes) {
    sections.push('\nStaff Notes')
    sections.push('-'.repeat(50))
    sections.push(intake.staffNotes)
  }

  sections.push('')
  sections.push(`(Entered via CMS Paper Intake on ${new Date().toLocaleDateString()})`)

  return sections.join('\n')
}

/**
 * Parse a full name into first and last name
 */
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Build Insightly Lead payload from participant data
 */
export async function buildLeadPayload(
  participant: ParticipantData,
  intake: PaperIntake,
  participantNumber: 1 | 2,
): Promise<InsightlyLeadPayload> {
  const { firstName, lastName } =
    participant.firstName && participant.lastName
      ? { firstName: participant.firstName, lastName: participant.lastName }
      : parseFullName(participant.name)

  let leadSourceId: number | undefined
  if (intake.referralSource) {
    const sourceName = REFERRAL_TO_LEAD_SOURCE[intake.referralSource]
    leadSourceId = await getLeadSourceId(sourceName)
  }

  const tags = buildLeadTags({
    isCourtOrdered: intake.isCourtOrdered,
    policeInvolvement: intake.phoneChecklist.policeInvolvement,
    referralSource: intake.referralSource,
  })

  const description = formatParticipantDescription(participant, intake, participantNumber)

  const payload: InsightlyLeadPayload = {
    FIRST_NAME: firstName,
    LAST_NAME: lastName,
    LEAD_DESCRIPTION: description,
    TAGS: tags.map((name) => ({ TAG_NAME: name })),
  }

  if (participant.email) {
    payload.EMAIL = participant.email
  }
  if (participant.phone) {
    payload.PHONE = participant.phone
  }
  if (participant.homePhone) {
    payload.MOBILE = participant.homePhone
  }
  if (leadSourceId) {
    payload.LEAD_SOURCE_ID = leadSourceId
  }

  if (participant.address) {
    if (participant.address.street) {
      payload.ADDRESS_STREET = participant.address.street
    }
    if (participant.address.city) {
      payload.ADDRESS_CITY = participant.address.city
    }
    if (participant.address.state) {
      payload.ADDRESS_STATE = participant.address.state
    }
    if (participant.address.zipCode) {
      payload.ADDRESS_POSTCODE = participant.address.zipCode
    }
  }

  return payload
}

// =============================================================================
// Case (Opportunity) Payload Builder
// =============================================================================

interface InsightlyOpportunityPayload {
  OPPORTUNITY_NAME: string
  OPPORTUNITY_STATE: string
  PIPELINE_ID: number
  STAGE_ID: number
  OPPORTUNITY_DETAILS?: string
  CUSTOMFIELDS: Array<{
    FIELD_NAME: string
    FIELD_VALUE: unknown
  }>
}

/**
 * Build Case (Opportunity) description
 */
function buildCaseDescription(intake: PaperIntake): string {
  const sections: string[] = []

  sections.push('Nature of Dispute')
  sections.push('='.repeat(50))
  sections.push(intake.disputeDescription || '(No description provided)')

  sections.push('\nPhone Checklist')
  sections.push('-'.repeat(50))
  sections.push(
    `✓ Explained Mediation Process: ${
      intake.phoneChecklist.explainedProcess ? 'Yes' : 'No'
    }`,
  )
  sections.push(
    `✓ Explained Neutrality: ${intake.phoneChecklist.explainedNeutrality ? 'Yes' : 'No'}`,
  )
  sections.push(
    `✓ Explained Confidentiality: ${
      intake.phoneChecklist.explainedConfidentiality ? 'Yes' : 'No'
    }`,
  )
  sections.push(
    `✓ Police Involvement Check: ${
      intake.phoneChecklist.policeInvolvement ? 'Yes' : 'No'
    }`,
  )
  sections.push(
    `✓ Peace/Protective Order: ${
      intake.phoneChecklist.peaceProtectiveOrder ? 'Yes' : 'No'
    }`,
  )
  sections.push(
    `✓ Safety Screening Complete: ${
      intake.phoneChecklist.safetyScreeningComplete ? 'Yes' : 'No'
    }`,
  )

  sections.push('\nStaff Assessment')
  sections.push('-'.repeat(50))
  sections.push(
    `Can represent own needs: ${intake.staffAssessment.canRepresentSelf ? 'Yes' : 'No'}`,
  )
  sections.push(
    `No fear of coercion: ${intake.staffAssessment.noFearOfCoercion ? 'Yes' : 'No'}`,
  )
  sections.push(
    `No danger to self/others: ${intake.staffAssessment.noDangerToSelf ? 'Yes' : 'No'}`,
  )
  sections.push(
    `No danger to center: ${intake.staffAssessment.noDangerToCenter ? 'Yes' : 'No'}`,
  )

  if (intake.staffNotes) {
    sections.push('\nAdditional Staff Notes')
    sections.push('-'.repeat(50))
    sections.push(intake.staffNotes)
  }

  sections.push('')
  sections.push(`Original Intake Date: ${intake.intakeDate}`)
  if (intake.intakePerson) {
    sections.push(`Original Intake Person: ${intake.intakePerson}`)
  }
  sections.push(`Entered via CMS: ${new Date().toLocaleDateString()}`)

  return sections.join('\n')
}

/**
 * Generate opportunity name from case number and participant names
 */
function generateOpportunityName(intake: PaperIntake): string {
  const parts: string[] = []

  if (intake.caseNumber) {
    parts.push(intake.caseNumber)
    parts.push('-')
  }

  const p1LastName =
    intake.participant1.lastName ||
    parseFullName(intake.participant1.name).lastName ||
    intake.participant1.name

  if (intake.participant2) {
    const p2LastName =
      intake.participant2.lastName ||
      parseFullName(intake.participant2.name).lastName ||
      intake.participant2.name
    parts.push(`${p1LastName} / ${p2LastName}`)
  } else {
    parts.push(p1LastName)
  }

  return parts.join(' ').trim()
}

/**
 * Build Insightly Opportunity (Case) payload
 */
export function buildCasePayload(intake: PaperIntake): InsightlyOpportunityPayload {
  const customFields: Array<{ FIELD_NAME: string; FIELD_VALUE: unknown }> = []

  if (intake.caseNumber) {
    const numericMatch = intake.caseNumber.match(/\d+/)
    if (numericMatch) {
      customFields.push({
        FIELD_NAME: CASE_CUSTOM_FIELDS.CASE_NUMBER,
        FIELD_VALUE: parseInt(numericMatch[0], 10),
      })
    }
  }

  if (intake.referralSource) {
    customFields.push({
      FIELD_NAME: CASE_CUSTOM_FIELDS.REFERRAL_SOURCE,
      FIELD_VALUE: intake.referralSource,
    })
  }

  if (intake.disputeType) {
    const caseType = DISPUTE_TYPE_TO_CASE_TYPE[intake.disputeType]
    if (caseType) {
      customFields.push({
        FIELD_NAME: CASE_CUSTOM_FIELDS.MEDIATION_CASE_TYPE,
        FIELD_VALUE: caseType,
      })
    }
  }

  customFields.push({
    FIELD_NAME: CASE_CUSTOM_FIELDS.SESSION_TYPE,
    FIELD_VALUE: SESSION_TYPE_MEDIATION,
  })

  if (intake.intakeDate) {
    customFields.push({
      FIELD_NAME: CASE_CUSTOM_FIELDS.OPEN_DATE,
      FIELD_VALUE: intake.intakeDate,
    })
  }

  if (intake.isCourtOrdered && intake.intakeDate) {
    customFields.push({
      FIELD_NAME: CASE_CUSTOM_FIELDS.COURT_REFERRAL_DATE,
      FIELD_VALUE: intake.intakeDate,
    })
  }

  return {
    OPPORTUNITY_NAME: generateOpportunityName(intake),
    OPPORTUNITY_STATE: 'Open',
    PIPELINE_ID: CASE_PIPELINE_ID,
    STAGE_ID: DEFAULT_CASE_STAGE_ID,
    OPPORTUNITY_DETAILS: buildCaseDescription(intake),
    CUSTOMFIELDS: customFields,
  }
}

// =============================================================================
// Link Payload Builder
// =============================================================================

interface InsightlyLinkPayload {
  LINK_OBJECT_NAME: 'Lead' | 'Contact' | 'Organisation'
  LINK_OBJECT_ID: number
  DETAILS?: string
}

/**
 * Build payload to link a Lead to a Case
 */
export function buildLeadToCaseLink(
  leadId: number,
  participantNumber: 1 | 2,
): InsightlyLinkPayload {
  return {
    LINK_OBJECT_NAME: 'Lead',
    LINK_OBJECT_ID: leadId,
    DETAILS: `Participant ${participantNumber}`,
  }
}

// =============================================================================
// Note Payload Builder
// =============================================================================

interface InsightlyNotePayload {
  TITLE: string
  BODY: string
}

/**
 * Build a note payload to add to an existing Lead when linking
 */
export function buildLinkingNote(
  intakeId: string,
  caseNumber?: string,
): InsightlyNotePayload {
  const title = 'Paper Intake Form Linked'
  const body = [
    `This Lead was linked to a paper intake form entry.`,
    '',
    `Intake ID: ${intakeId}`,
    caseNumber ? `Case Number: ${caseNumber}` : null,
    `Linked on: ${new Date().toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { TITLE: title, BODY: body }
}
