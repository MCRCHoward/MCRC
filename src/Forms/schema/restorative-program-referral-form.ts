import { z } from 'zod'
import { stripPhoneNumber } from '@/utilities/phoneUtils'

export const restorativeOrgOptions = [
  'school',
  'juvenile-services',
  'community-organization',
  'court-legal',
  'self-family',
  'other',
] as const

export const restorativeServiceOptions = [
  'restorative-reflection',
  'restorative-dialogue',
  'restorative-circle',
  'reentry',
  'conflict-mediation',
  'not-sure',
] as const

export const restorativeUrgencyOptions = ['high', 'medium', 'low'] as const

const stripAndValidatePhone = (value: string | undefined): boolean => {
  if (!value || value.trim() === '') return true
  const digits = stripPhoneNumber(value)
  return digits.length === 10 || digits.length === 0
}

const optionalPhoneSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(stripAndValidatePhone, {
    message: 'Please enter a valid 10-digit phone number or leave blank.',
  })

export const restorativeProgramReferralFormSchema = z.object({
  referrerName: z.string().min(1, 'Your name is required.'),
  referrerEmail: z.string().email('Valid email is required.'),
  referrerPhone: optionalPhoneSchema,
  referrerOrg: z.enum(restorativeOrgOptions).optional().or(z.literal('')),
  referrerRole: z.string().optional().or(z.literal('')),
  referrerPreferredContact: z.enum(['email', 'phone-call', 'text']).optional().or(z.literal('')),

  participantName: z.string().min(1, 'Participant name is required.'),
  participantDob: z.date().optional(),
  participantPronouns: z.string().optional().or(z.literal('')),
  participantSchool: z.string().optional().or(z.literal('')),
  participantPhone: optionalPhoneSchema,
  participantEmail: z.string().optional().or(z.literal('')),
  parentGuardianName: z.string().optional().or(z.literal('')),
  parentGuardianPhone: optionalPhoneSchema,
  parentGuardianEmail: z.string().optional().or(z.literal('')),
  participantBestTime: z.string().optional().or(z.literal('')),

  incidentDate: z.date().optional(),
  incidentLocation: z.string().optional().or(z.literal('')),
  incidentDescription: z.string().min(1, 'Please describe the situation.'),
  otherParties: z.string().optional().or(z.literal('')),
  reasonReferral: z.string().optional().or(z.literal('')),
  serviceRequested: z.enum(restorativeServiceOptions).optional().or(z.literal('')),
  safetyConcerns: z.string().optional().or(z.literal('')),
  currentDiscipline: z.string().optional().or(z.literal('')),

  urgency: z.enum(restorativeUrgencyOptions).optional().or(z.literal('')),
  additionalNotes: z.string().optional().or(z.literal('')),
})

export type RestorativeProgramReferralFormValues = z.infer<
  typeof restorativeProgramReferralFormSchema
>

