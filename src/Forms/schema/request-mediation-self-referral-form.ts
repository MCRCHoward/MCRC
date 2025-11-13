import { z } from 'zod'
import { stripPhoneNumber } from '@/utilities/phoneUtils'

// Phone number validation regex - matches US phone format: (XXX) XXX-XXXX
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/

// Custom phone validation
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required.')
  .refine(
    (val) => {
      const digits = stripPhoneNumber(val)
      return digits.length === 10
    },
    { message: 'Please enter a valid 10-digit phone number.' },
  )
  .refine((val) => phoneRegex.test(val) || stripPhoneNumber(val).length === 10, {
    message: 'Phone number format: (XXX) XXX-XXXX',
  })

// Optional phone validation (for fields that may be empty)
const optionalPhoneSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const digits = stripPhoneNumber(val)
      return digits.length === 10 || digits.length === 0
    },
    { message: 'Please enter a valid 10-digit phone number or leave blank.' },
  )

// Zod schema for form validation
export const mediationFormSchema = z.object({
  // Section 1: Contact Information
  prefix: z.string().min(1, 'Prefix is required.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: phoneSchema,
  email: z.string().email('Invalid email address.'),
  preferredContactMethod: z.enum(['Email', 'Phone', 'Either is fine'], {
    required_error: 'Please select a preferred contact method.',
  }),
  allowVoicemail: z.enum(['No', 'Yes'], {
    required_error: 'Please select an option.',
  }),
  allowText: z.enum(['No', 'Yes'], {
    required_error: 'Please select an option.',
  }),
  streetAddress: z.string().min(1, 'Street address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  zipCode: z.string().min(1, 'Zip code is required.'),
  referralSource: z.string().min(1, 'Please select a referral source.'),

  // Section 2: Conflict Overview
  conflictOverview: z
    .string()
    .min(1, 'This field is required.')
    .max(1000, 'Please limit your response to 1000 characters.'),
  isCourtOrdered: z.enum(['No', 'Yes'], {
    required_error: 'Please select an option.',
  }),

  // Section 3: Other Participants
  // Contact One is now optional
  contactOneFirstName: z.string().optional(),
  contactOneLastName: z.string().optional(),
  contactOnePhone: optionalPhoneSchema,
  contactOneEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),

  // Additional contacts array (up to 5 additional contacts)
  additionalContacts: z
    .array(
      z.object({
        firstName: z.string().min(1, 'First name is required.'),
        lastName: z.string().min(1, 'Last name is required.'),
        phone: phoneSchema,
        email: z.string().email('Invalid email address.'),
      }),
    )
    .max(5, 'Maximum of 5 additional contacts allowed.')
    .optional()
    .default([]),

  // Section 4: Scheduling
  deadline: z.date().optional(),
  accessibilityNeeds: z
    .string()
    .min(1, "Please enter 'None' if not applicable.")
    .max(500, 'Please limit your response to 500 characters.'),
  additionalInfo: z
    .string()
    .min(1, "Please enter 'None' if not applicable.")
    .max(500, 'Please limit your response to 500 characters.'),
})

// Infer the TypeScript type from the schema
export type MediationFormValues = z.infer<typeof mediationFormSchema>
