import { z } from 'zod'

export const currencies = ['USD', 'EUR', 'GBP'] as const
export const formats = ['Conference', 'Seminar', 'Workshop', 'Class', 'Networking'] as const
export const categories = ['Business', 'Science & Tech', 'Health', 'Arts', 'Community'] as const

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const eventFormBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(80, 'Slug must be at most 80 characters')
    .regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only'),
  summary: z.string().optional(),
  descriptionHtml: z.string().optional(),
  externalRegistrationLink: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || z.string().url().safeParse(val).success,
      'Enter a valid URL (https://...) or leave blank',
    ),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().min(1),
  isOnline: z.boolean().default(false),
  isRegistrationRequired: z.boolean().default(true),
  venueName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  onlineMeetingUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || z.string().url().safeParse(val).success,
      'Enter a valid meeting URL (https://...) or leave blank',
    ),
  onlineMeetingDetails: z.string().optional(),
  capacity: z
    .union([z.number().int().min(1), z.string().regex(/^\d+$/)])
    .optional()
    .transform((v) => (typeof v === 'string' ? (v ? Number(v) : undefined) : v)),
  isFree: z.boolean().default(true),
  price: z
    .union([z.number().min(0), z.string().regex(/^\d+(?:\.\d{1,2})?$/)])
    .optional()
    .transform((v) => (typeof v === 'string' ? (v ? Number(v) : undefined) : v)),
  currency: z.enum(currencies).optional(),
  costDescription: z.string().optional(),
  listed: z.boolean().default(true),
  status: z.enum(['draft', 'published']).default('published'),
  category: z.enum(categories).optional(),
  subcategory: z.string().optional(),
  format: z.enum(formats).optional(),
  imageFile: z.instanceof(File).optional().or(z.literal(undefined)),
  secondaryImageFile: z.instanceof(File).optional().or(z.literal(undefined)),
})

export const eventFormSchema = eventFormBaseSchema
  .refine(
    (d) =>
      d.isOnline ||
      Boolean(d.venueName || d.addressLine1 || d.city || d.state || d.postalCode || d.country),
    { path: ['venueName'], message: 'Provide a venue or mark Online event' },
  )
  .refine((d) => (d.isFree ? true : Boolean(d.price && d.currency)), {
    path: ['price'],
    message: 'Price and currency required unless event is free',
  })
  .refine(
    (d) => {
      if (!d.endDate || !d.endTime) return true
      const start = new Date(`${d.startDate}T${d.startTime}:00`)
      const end = new Date(`${d.endDate}T${d.endTime}:00`)
      return end >= start
    },
    { path: ['endDate'], message: 'End date/time must be after start date/time' },
  )

export type EventFormValues = z.input<typeof eventFormBaseSchema>
