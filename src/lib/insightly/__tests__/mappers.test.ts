import { describe, expect, it } from 'vitest'
import { buildSelfReferralLeadPayload, buildRestorativeReferralLeadPayload } from '../mappers'
import type { MediationFormValues } from '@/Forms/schema/request-mediation-self-referral-form'
import type { RestorativeProgramReferralFormValues } from '@/Forms/schema/restorative-program-referral-form'

const mediationSample: MediationFormValues = {
  prefix: 'Mr',
  firstName: 'Alex',
  lastName: 'Rivera',
  phone: '(410) 555-1212',
  email: 'alex@example.com',
  preferredContactMethod: 'Email',
  allowVoicemail: 'Yes',
  allowText: 'No',
  streetAddress: '123 Main St',
  city: 'Columbia',
  state: 'MD',
  zipCode: '21044',
  referralSource: 'Website',
  conflictOverview: 'Need help resolving a neighbor dispute.',
  isCourtOrdered: 'No',
  contactOneFirstName: '',
  contactOneLastName: '',
  contactOnePhone: '',
  contactOneEmail: '',
  additionalContacts: [],
  deadline: undefined,
  accessibilityNeeds: 'None',
  additionalInfo: 'No other notes.',
}

const restorativeSample: RestorativeProgramReferralFormValues = {
  referrerName: 'Jordan Blake',
  referrerEmail: 'jordan@example.org',
  referrerPhone: '(301) 555-4040',
  referrerOrg: 'school',
  referrerRole: 'Counselor',
  referrerPreferredContact: 'email',
  participantName: 'Student A',
  participantDob: undefined,
  participantPronouns: '',
  participantSchool: 'Howard High',
  participantPhone: '',
  participantEmail: '',
  parentGuardianName: '',
  parentGuardianPhone: '',
  parentGuardianEmail: '',
  participantBestTime: '',
  incidentDate: undefined,
  incidentLocation: 'School hallway',
  incidentDescription: 'Conflict between students after class.',
  otherParties: '',
  reasonReferral: 'Seeking restorative circle.',
  serviceRequested: 'restorative-circle',
  safetyConcerns: '',
  currentDiscipline: '',
  urgency: 'medium',
  additionalNotes: '',
}

describe('Insightly payload mappers', () => {
  it('builds mediation payload with description and tags', () => {
    const payload = buildSelfReferralLeadPayload(mediationSample)
    expect(payload.FIRST_NAME).toBe('Alex')
    expect(payload.LAST_NAME).toBe('Rivera')
    expect(payload.LEAD_DESCRIPTION).toContain('neighbor dispute')
    expect(payload.TAGS?.map((tag) => tag.TAG_NAME)).toContain('Self_Referral')
  })

  it('builds restorative payload with parsed referrer name and service tag', () => {
    const payload = buildRestorativeReferralLeadPayload(restorativeSample)
    expect(payload.FIRST_NAME).toBe('Jordan')
    expect(payload.LAST_NAME).toBe('Blake')
    expect(payload.LEAD_DESCRIPTION).toContain('restorative circle')
    expect(payload.TAGS?.map((tag) => tag.TAG_NAME)).toContain('Service_Restorative_Circle')
  })
})

