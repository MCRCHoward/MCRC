import type { MediationFormValues } from '@/Forms/schema/request-mediation-self-referral-form'
import type { RestorativeProgramReferralFormValues } from '@/Forms/schema/restorative-program-referral-form'
import {
  MONDAY_MASTER_BOARD_ID,
  MONDAY_GROUP_MEDIATION_REFERRALS,
  MONDAY_GROUP_RESTORATIVE_REFERRALS,
  MONDAY_DEFAULT_ASSIGNEE_ID,
  MONDAY_SERVICE_AREA_LABELS,
} from './config'
import type { CreateMondayItemInput } from './items'
import { ensureMondayColumns, formatFormTypeLabel } from './columns'
import type { ColumnIdMap } from './column-schemas'
import { MEDIATION_MAX_ADDITIONAL_CONTACTS } from './column-schemas'

export interface InquiryMetadata {
  submittedAt?: Date | string | { seconds: number; nanoseconds: number } | null
  reviewed?: boolean
  reviewedAt?: Date | string | { seconds: number; nanoseconds: number } | null
  submittedBy?: string
  submissionType?: string
  [key: string]: unknown
}

type DateInput = Date | string | { seconds: number; nanoseconds: number } | null | undefined

const DEFAULT_STATUS_LABEL = 'New'

function truncate(text: string | undefined, max = 80): string {
  if (!text) return ''
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function formatDateOnly(value: DateInput): string | undefined {
  if (!value) return undefined
  let dateObj: Date | undefined
  if (value instanceof Date) {
    dateObj = value
  } else if (typeof value === 'string') {
    dateObj = new Date(value)
  } else if (value && typeof value === 'object' && 'seconds' in value) {
    dateObj = new Date(value.seconds * 1000)
  }

  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return undefined
  }

  return dateObj.toISOString().slice(0, 10)
}

function normalizeString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return undefined
}

function setTextValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  value: unknown,
) {
  if (!columnId) return
  const normalized = normalizeString(value)
  if (normalized) {
    target[columnId] = normalized
  }
}

function setLongTextValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  value: unknown,
) {
  if (!columnId) return
  if (typeof value === 'string' && value.trim().length > 0) {
    target[columnId] = value.trim()
    return
  }
  setTextValue(target, columnId, value)
}

function setStatusValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  label: string | undefined,
) {
  if (!columnId || !label) return
  target[columnId] = { label }
}

function setDropdownValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  label: string | undefined,
) {
  if (!columnId || !label) return
  target[columnId] = { labels: [label] }
}

function setDateValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  value: DateInput,
) {
  if (!columnId) return
  const isoDate = formatDateOnly(value)
  if (isoDate) {
    target[columnId] = { date: isoDate }
  }
}

function setPeopleValue(
  target: Record<string, unknown>,
  columnId: string | undefined,
  personId: number | undefined,
) {
  if (!columnId || !personId) return
  target[columnId] = { personsAndTeams: [{ id: personId, kind: 'person' }] }
}

function buildPrimaryContactSummary(parts: Array<string | undefined>): string | undefined {
  const filtered = parts
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0))
  if (filtered.length === 0) {
    return undefined
  }
  return filtered.join(' • ')
}

function applySharedColumns({
  columnValues,
  columnIds,
  scope,
  serviceAreaLabel,
  metadata,
  primarySummary,
  rawPayloadSource,
}: {
  columnValues: Record<string, unknown>
  columnIds: ColumnIdMap
  scope: 'mediation' | 'restorative'
  serviceAreaLabel: string
  metadata?: InquiryMetadata
  primarySummary?: string
  rawPayloadSource: Record<string, unknown>
}) {
  setStatusValue(columnValues, columnIds.shared.status, DEFAULT_STATUS_LABEL)
  setDropdownValue(columnValues, columnIds.shared.formType, formatFormTypeLabel(scope))
  setTextValue(columnValues, columnIds.shared.serviceArea, serviceAreaLabel)

  const submissionDate = metadata?.submittedAt ?? new Date()
  setDateValue(columnValues, columnIds.shared.submissionDate, submissionDate)
  setTextValue(columnValues, columnIds.shared.submittedBy, metadata?.submittedBy)
  setTextValue(columnValues, columnIds.shared.submissionType, metadata?.submissionType)

  const reviewedLabel = metadata?.reviewed ? 'Reviewed' : 'Not Reviewed'
  setStatusValue(columnValues, columnIds.shared.reviewed, reviewedLabel)
  if (metadata?.reviewedAt) {
    setDateValue(columnValues, columnIds.shared.reviewedAt, metadata.reviewedAt)
  }

  setPeopleValue(columnValues, columnIds.shared.assignee, MONDAY_DEFAULT_ASSIGNEE_ID)
  setTextValue(columnValues, columnIds.shared.primaryContactSummary, primarySummary)
  const rawPayloadColumn = columnIds.shared.rawPayload
  if (rawPayloadColumn) {
    columnValues[rawPayloadColumn] = JSON.stringify(
      {
        form: rawPayloadSource,
        metadata: {
          submittedAt: metadata?.submittedAt
            ? formatDateOnly(metadata.submittedAt)
            : formatDateOnly(new Date()),
          submittedBy: metadata?.submittedBy ?? 'unknown',
          submissionType: metadata?.submissionType ?? 'unknown',
        },
      },
      null,
      2,
    )
  }
}

function applyMediationSpecificColumns(
  columnValues: Record<string, unknown>,
  columnIds: ColumnIdMap,
  values: MediationFormValues,
) {
  setTextValue(columnValues, columnIds.specific.prefix, values.prefix)
  setTextValue(columnValues, columnIds.specific.firstName, values.firstName)
  setTextValue(columnValues, columnIds.specific.lastName, values.lastName)
  setTextValue(columnValues, columnIds.specific.email, values.email)
  setTextValue(columnValues, columnIds.specific.phone, values.phone)
  setTextValue(
    columnValues,
    columnIds.specific.preferredContactMethod,
    values.preferredContactMethod,
  )
  setStatusValue(
    columnValues,
    columnIds.specific.allowText,
    values.allowText === 'Yes' ? 'Yes' : 'No',
  )
  setStatusValue(
    columnValues,
    columnIds.specific.allowVoicemail,
    values.allowVoicemail === 'Yes' ? 'Yes' : 'No',
  )
  setTextValue(columnValues, columnIds.specific.streetAddress, values.streetAddress)
  setTextValue(columnValues, columnIds.specific.city, values.city)
  setTextValue(columnValues, columnIds.specific.state, values.state)
  setTextValue(columnValues, columnIds.specific.zipCode, values.zipCode)
  setTextValue(columnValues, columnIds.specific.referralSource, values.referralSource)
  setLongTextValue(columnValues, columnIds.specific.conflictOverview, values.conflictOverview)
  setStatusValue(
    columnValues,
    columnIds.specific.isCourtOrdered,
    values.isCourtOrdered === 'Yes' ? 'Yes' : 'No',
  )
  setTextValue(columnValues, columnIds.specific.contactOneFirstName, values.contactOneFirstName)
  setTextValue(columnValues, columnIds.specific.contactOneLastName, values.contactOneLastName)
  setTextValue(columnValues, columnIds.specific.contactOneEmail, values.contactOneEmail)
  setTextValue(columnValues, columnIds.specific.contactOnePhone, values.contactOnePhone)
  setDateValue(columnValues, columnIds.specific.deadline, values.deadline)
  setLongTextValue(columnValues, columnIds.specific.accessibilityNeeds, values.accessibilityNeeds)
  setLongTextValue(columnValues, columnIds.specific.additionalInfo, values.additionalInfo)

  const additionalContacts = values.additionalContacts ?? []
  for (let index = 0; index < MEDIATION_MAX_ADDITIONAL_CONTACTS; index += 1) {
    const contact = additionalContacts[index]
    const suffix = `additionalContact${index + 1}`
    setTextValue(columnValues, columnIds.specific[`${suffix}FirstName`], contact?.firstName)
    setTextValue(columnValues, columnIds.specific[`${suffix}LastName`], contact?.lastName)
    setTextValue(columnValues, columnIds.specific[`${suffix}Email`], contact?.email)
    setTextValue(columnValues, columnIds.specific[`${suffix}Phone`], contact?.phone)
  }
}

function applyRestorativeSpecificColumns(
  columnValues: Record<string, unknown>,
  columnIds: ColumnIdMap,
  values: RestorativeProgramReferralFormValues,
) {
  setTextValue(columnValues, columnIds.specific.referrerName, values.referrerName)
  setTextValue(columnValues, columnIds.specific.referrerEmail, values.referrerEmail)
  setTextValue(columnValues, columnIds.specific.referrerPhone, values.referrerPhone)
  setTextValue(columnValues, columnIds.specific.referrerOrg, values.referrerOrg)
  setTextValue(columnValues, columnIds.specific.referrerRole, values.referrerRole)
  setTextValue(
    columnValues,
    columnIds.specific.referrerPreferredContact,
    values.referrerPreferredContact,
  )
  setTextValue(columnValues, columnIds.specific.participantName, values.participantName)
  setDateValue(columnValues, columnIds.specific.participantDob, values.participantDob)
  setTextValue(columnValues, columnIds.specific.participantPronouns, values.participantPronouns)
  setTextValue(columnValues, columnIds.specific.participantSchool, values.participantSchool)
  setTextValue(columnValues, columnIds.specific.participantPhone, values.participantPhone)
  setTextValue(columnValues, columnIds.specific.participantEmail, values.participantEmail)
  setTextValue(columnValues, columnIds.specific.participantBestTime, values.participantBestTime)
  setTextValue(columnValues, columnIds.specific.parentGuardianName, values.parentGuardianName)
  setTextValue(columnValues, columnIds.specific.parentGuardianPhone, values.parentGuardianPhone)
  setTextValue(columnValues, columnIds.specific.parentGuardianEmail, values.parentGuardianEmail)
  setDateValue(columnValues, columnIds.specific.incidentDate, values.incidentDate)
  setTextValue(columnValues, columnIds.specific.incidentLocation, values.incidentLocation)
  setLongTextValue(
    columnValues,
    columnIds.specific.incidentDescription,
    values.incidentDescription,
  )
  setLongTextValue(columnValues, columnIds.specific.otherParties, values.otherParties)
  setLongTextValue(columnValues, columnIds.specific.reasonReferral, values.reasonReferral)
  setTextValue(columnValues, columnIds.specific.serviceRequested, values.serviceRequested)
  setLongTextValue(columnValues, columnIds.specific.safetyConcerns, values.safetyConcerns)
  setLongTextValue(columnValues, columnIds.specific.currentDiscipline, values.currentDiscipline)
  setTextValue(columnValues, columnIds.specific.urgency, values.urgency)
  setLongTextValue(columnValues, columnIds.specific.additionalNotes, values.additionalNotes)
}

async function buildBaseMondayItem({
  metadata,
  scope,
  serviceAreaKey,
  primarySummaryParts,
  rawPayloadSource,
}: {
  metadata?: InquiryMetadata
  scope: 'mediation' | 'restorative'
  serviceAreaKey: keyof typeof MONDAY_SERVICE_AREA_LABELS
  primarySummaryParts: Array<string | undefined>
  rawPayloadSource: Record<string, unknown>
}): Promise<{ columnIds: ColumnIdMap; columnValues: Record<string, unknown> }> {
  const columnIds = await ensureMondayColumns(scope)
  const columnValues: Record<string, unknown> = {}

  const serviceAreaLabel = MONDAY_SERVICE_AREA_LABELS[serviceAreaKey]
  const primarySummary = buildPrimaryContactSummary(primarySummaryParts)

  applySharedColumns({
    columnValues,
    columnIds,
    scope,
    serviceAreaLabel,
    metadata,
    primarySummary,
    rawPayloadSource,
  })

  return { columnIds, columnValues }
}

export async function buildMediationReferralMondayItem(
  values: MediationFormValues,
  metadata?: InquiryMetadata,
): Promise<CreateMondayItemInput> {
  const { columnIds, columnValues } = await buildBaseMondayItem({
    metadata,
    scope: 'mediation',
    serviceAreaKey: 'mediation',
    primarySummaryParts: [values.firstName, values.lastName, values.email, values.phone],
    rawPayloadSource: values,
  })

  applyMediationSpecificColumns(columnValues, columnIds, values)

  const itemNameParts = [
    'Mediation',
    values.firstName,
    values.lastName,
    values.conflictOverview ? truncate(values.conflictOverview) : undefined,
  ]
  const itemName = itemNameParts
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(' – ')

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_MEDIATION_REFERRALS,
    itemName: itemName || 'Mediation Referral',
    columnValues: JSON.stringify(columnValues),
  }
}

export async function buildRestorativeProgramMondayItem(
  values: RestorativeProgramReferralFormValues,
  metadata?: InquiryMetadata,
): Promise<CreateMondayItemInput> {
  const { columnIds, columnValues } = await buildBaseMondayItem({
    metadata,
    scope: 'restorative',
    serviceAreaKey: 'restorativePractices',
    primarySummaryParts: [values.referrerName, values.referrerEmail, values.referrerPhone],
    rawPayloadSource: values,
  })

  applyRestorativeSpecificColumns(columnValues, columnIds, values)

  const itemNameParts = [
    'Restorative',
    values.referrerOrg,
    values.referrerName,
    values.incidentDescription ? truncate(values.incidentDescription) : undefined,
  ]
  const itemName = itemNameParts
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(' – ')

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_RESTORATIVE_REFERRALS,
    itemName: itemName || 'Restorative Program Referral',
    columnValues: JSON.stringify(columnValues),
  }
}

