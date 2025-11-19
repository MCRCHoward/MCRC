'use server'

import type { MediationFormValues } from '@/Forms/schema/request-mediation-self-referral-form'
import type { RestorativeProgramReferralFormValues } from '@/Forms/schema/restorative-program-referral-form'
import { insightlyDefaults } from './config'
import type { InsightlyLeadPayload, InsightlyTag } from './types'

const RESTORATIVE_ORG_LABELS: Record<string, string> = {
  school: 'School / District',
  'juvenile-services': 'Juvenile Services',
  'community-organization': 'Community Organization',
  'court-legal': 'Court / Legal System',
  'self-family': 'Self / Family',
  other: 'Other',
}

const RESTORATIVE_SERVICE_LABELS: Record<string, string> = {
  'restorative-reflection': 'Restorative Reflection',
  'restorative-dialogue': 'Restorative Dialogue',
  'restorative-circle': 'Restorative Circle',
  reentry: 'Re-entry Support',
  'conflict-mediation': 'Conflict Mediation',
  'not-sure': 'Not Sure',
}

function sanitize(value?: string | null): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function splitFullName(value?: string | null): { firstName?: string; lastName?: string } {
  const sanitized = sanitize(value)
  if (!sanitized) {
    return {}
  }
  const parts = sanitized.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0] }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function descriptionBlock(title: string, body?: string): string {
  if (!body) return ''
  return `${title}\n------------------------------------------------------------------\n${body.trim()}\n`
}

function buildBasePayload(): InsightlyLeadPayload {
  return {
    LEAD_STATUS_ID: insightlyDefaults.leadStatusId,
    OWNER_USER_ID: insightlyDefaults.ownerUserId,
    RESPONSIBLE_USER_ID: insightlyDefaults.responsibleUserId,
    ADDRESS_COUNTRY: insightlyDefaults.defaultCountry,
  }
}

function withTags(...tags: InsightlyTag[]): InsightlyTag[] {
  return tags.filter(Boolean)
}

export function buildSelfReferralLeadPayload(values: MediationFormValues): InsightlyLeadPayload {
  const payload: InsightlyLeadPayload = {
    ...buildBasePayload(),
    LEAD_SOURCE_ID: insightlyDefaults.selfReferralLeadSourceId,
    FIRST_NAME: sanitize(values.firstName),
    LAST_NAME: sanitize(values.lastName) ?? 'Unknown',
    EMAIL_ADDRESS: sanitize(values.email),
    PHONE_NUMBER: sanitize(values.phone),
    ADDRESS_STREET: sanitize(values.streetAddress),
    ADDRESS_CITY: sanitize(values.city),
    ADDRESS_STATE: sanitize(values.state),
    ADDRESS_POSTCODE: sanitize(values.zipCode),
    LEAD_DESCRIPTION: [
      'Source: Mediation Self-Referral (Website)',
      '',
      descriptionBlock('What brings you to seek mediation right now?', values.conflictOverview),
      descriptionBlock('Are there accessibility needs or notes for staff?', values.accessibilityNeeds),
      descriptionBlock('Other details', values.additionalInfo),
      `Preferred contact method: ${values.preferredContactMethod}`,
      `Referral source: ${values.referralSource}`,
      values.allowText ? `Text OK: ${values.allowText}` : undefined,
      values.allowVoicemail ? `Voicemail OK: ${values.allowVoicemail}` : undefined,
      '',
      '(Submitted via mcrchoward.org self-referral form)',
    ]
      .filter(Boolean)
      .join('\n'),
    TAGS: withTags(
      { TAG_NAME: 'MCRC' },
      { TAG_NAME: 'Mediation' },
      { TAG_NAME: 'Self Referral' },
      sanitize(values.referralSource) ? { TAG_NAME: `Referral: ${values.referralSource}` } : undefined,
      values.isCourtOrdered ? { TAG_NAME: `Court Ordered: ${values.isCourtOrdered}` } : undefined,
    ),
  }

  return payload
}

export function buildRestorativeReferralLeadPayload(
  values: RestorativeProgramReferralFormValues,
): InsightlyLeadPayload {
  const { firstName, lastName } = splitFullName(values.referrerName)
  const organization =
    (values.referrerOrg && RESTORATIVE_ORG_LABELS[values.referrerOrg]) || values.referrerOrg
  const serviceLabel =
    (values.serviceRequested && RESTORATIVE_SERVICE_LABELS[values.serviceRequested]) ||
    values.serviceRequested

  const payload: InsightlyLeadPayload = {
    ...buildBasePayload(),
    LEAD_SOURCE_ID: insightlyDefaults.restorativeLeadSourceId,
    FIRST_NAME: firstName ?? sanitize(values.referrerName),
    LAST_NAME: lastName ?? firstName ?? 'Unknown',
    EMAIL_ADDRESS: sanitize(values.referrerEmail),
    PHONE_NUMBER: sanitize(values.referrerPhone),
    TITLE: sanitize(values.referrerRole),
    ORGANIZATION_NAME: organization,
    LEAD_DESCRIPTION: [
      'Source: Restorative Program Referral (Website)',
      '',
      descriptionBlock('Brief description of the situation / harm', values.incidentDescription),
      descriptionBlock('Reason for referral', values.reasonReferral),
      descriptionBlock('Other parties involved', values.otherParties),
      descriptionBlock('Safety or confidentiality considerations', values.safetyConcerns),
      descriptionBlock('Current discipline / school / court actions', values.currentDiscipline),
      descriptionBlock('Additional context for staff', values.additionalNotes),
      '',
      `Participant: ${values.participantName}`,
      values.participantSchool ? `School/Program: ${values.participantSchool}` : undefined,
      values.participantBestTime
        ? `Best time to contact participant/family: ${values.participantBestTime}`
        : undefined,
      serviceLabel ? `Requested service: ${serviceLabel}` : undefined,
      values.urgency ? `Urgency: ${values.urgency}` : undefined,
      '',
      '(Submitted via mcrchoward.org restorative program referral form)',
    ]
      .filter(Boolean)
      .join('\n'),
    TAGS: withTags(
      { TAG_NAME: 'MCRC' },
      { TAG_NAME: 'Restorative Program' },
      { TAG_NAME: 'Partner Referral' },
      organization ? { TAG_NAME: `Referral Org: ${organization}` } : undefined,
      serviceLabel ? { TAG_NAME: `Service: ${serviceLabel}` } : undefined,
    ),
  }

  return payload
}

