import type { MediationFormValues } from '@/Forms/schema/request-mediation-self-referral-form'
import type { RestorativeProgramReferralFormValues } from '@/Forms/schema/restorative-program-referral-form'
import {
  MONDAY_MASTER_BOARD_ID,
  MONDAY_GROUP_MEDIATION_REFERRALS,
  MONDAY_GROUP_RESTORATIVE_REFERRALS,
  MONDAY_COLUMNS,
  MONDAY_DEFAULT_ASSIGNEE_ID,
  MONDAY_SERVICE_AREA_LABELS,
} from './config'
import type { CreateMondayItemInput } from './items'

function truncate(text: string | undefined, max = 80): string {
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function buildBaseColumnValues(values: Record<string, unknown>) {
  return JSON.stringify(values)
}

export function buildMediationReferralMondayItem(
  values: MediationFormValues,
): CreateMondayItemInput {
  const first = values.firstName?.trim() ?? ''
  const last = values.lastName?.trim() ?? ''
  const shortSummary = truncate(values.conflictOverview?.replace(/\s+/g, ' ').trim())
  const itemName = `Mediation – ${first} ${last}`.trim() + (shortSummary ? ` – ${shortSummary}` : '')
  const submissionDateIso = new Date().toISOString().slice(0, 10)
  const contactLine = `${first} ${last}`.trim() || 'Unknown participant'
  const contactDetails = [
    contactLine,
    values.email ? `Email: ${values.email}` : null,
    values.phone ? `Phone: ${values.phone}` : null,
  ]
    .filter(Boolean)
    .join(' • ')

  const descriptionText = [
    'What brings you to seek mediation right now?',
    '------------------------------------------------------------------',
    values.conflictOverview?.trim() || '(no description provided)',
  ].join('\n')

  const columnValues: Record<string, unknown> = {
    [MONDAY_COLUMNS.status]: { label: 'New' },
    [MONDAY_COLUMNS.formType]: { label: 'Mediation Referral' },
    [MONDAY_COLUMNS.submissionDate]: { date: submissionDateIso },
    [MONDAY_COLUMNS.primaryContact]: contactDetails,
    [MONDAY_COLUMNS.serviceArea]: MONDAY_SERVICE_AREA_LABELS.mediation,
    [MONDAY_COLUMNS.description]: descriptionText,
    [MONDAY_COLUMNS.rawPayload]: JSON.stringify(values),
  }

  if (MONDAY_DEFAULT_ASSIGNEE_ID) {
    columnValues[MONDAY_COLUMNS.assignee] = {
      personsAndTeams: [{ id: MONDAY_DEFAULT_ASSIGNEE_ID, kind: 'person' }],
    }
  }

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_MEDIATION_REFERRALS,
    itemName,
    columnValues: buildBaseColumnValues(columnValues),
  }
}

export function buildRestorativeProgramMondayItem(
  values: RestorativeProgramReferralFormValues,
): CreateMondayItemInput {
  const referrer = values.referrerName?.trim() || 'Unknown referrer'
  const org = values.referrerOrg?.toString() || 'Unknown organization'
  const shortSummary = truncate(values.incidentDescription?.replace(/\s+/g, ' ').trim())
  const itemName = `Restorative – ${org}` + (shortSummary ? ` – ${shortSummary}` : '')
  const submissionDateIso = new Date().toISOString().slice(0, 10)
  const contactLine = [
    referrer,
    values.referrerEmail ? `Email: ${values.referrerEmail}` : null,
    values.referrerPhone ? `Phone: ${values.referrerPhone}` : null,
  ]
    .filter(Boolean)
    .join(' • ')

  const descriptionBlocks = [
    'Brief description of the situation / harm:',
    '------------------------------------------------------------------',
    values.incidentDescription?.trim() || '(no description provided)',
    '',
    `Referrer: ${referrer}`,
    values.referrerRole ? `Role: ${values.referrerRole}` : null,
    values.participantName ? `Participant: ${values.participantName}` : null,
    values.participantSchool ? `School / Program: ${values.participantSchool}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const columnValues: Record<string, unknown> = {
    [MONDAY_COLUMNS.status]: { label: 'New' },
    [MONDAY_COLUMNS.formType]: { label: 'Restorative Program' },
    [MONDAY_COLUMNS.submissionDate]: { date: submissionDateIso },
    [MONDAY_COLUMNS.primaryContact]: contactLine,
    [MONDAY_COLUMNS.serviceArea]: MONDAY_SERVICE_AREA_LABELS.restorativePractices,
    [MONDAY_COLUMNS.description]: descriptionBlocks,
    [MONDAY_COLUMNS.rawPayload]: JSON.stringify(values),
  }

  if (MONDAY_DEFAULT_ASSIGNEE_ID) {
    columnValues[MONDAY_COLUMNS.assignee] = {
      personsAndTeams: [{ id: MONDAY_DEFAULT_ASSIGNEE_ID, kind: 'person' }],
    }
  }

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_RESTORATIVE_REFERRALS,
    itemName,
    columnValues: buildBaseColumnValues(columnValues),
  }
}


