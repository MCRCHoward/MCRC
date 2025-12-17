'use client'

// This is a comprehensive refactor - will replace the original page.tsx
// This file demonstrates the new structure with all improvements

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link as LinkIcon, Loader2 } from 'lucide-react'

import { createEvent } from '@/app/(frontend)/(cms)/dashboard/events/firebase-actions'
import { useFormAutoSave } from '@/hooks/useFormAutoSave'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

// Import new components
import { EventFormStepper, type FormStep } from '../components/EventFormStepper'
import { FormHeader } from '../components/FormHeader'
import { DraftRecoveryModal } from '../components/DraftRecoveryModal'
import { TimezoneSelect } from '../components/TimezoneSelect'
import { SlugInput } from '../components/SlugInput'
import { ImageUploadPreview } from '../components/ImageUploadPreview'
// Note: EventDescriptionEditor needs Tiptap setup - using Textarea for now
// import { EventDescriptionEditor } from '../components/EventDescriptionEditor'

const currencies = ['USD', 'EUR', 'GBP'] as const
const formats = ['Conference', 'Seminar', 'Workshop', 'Class', 'Networking'] as const
const categories = ['Business', 'Science & Tech', 'Health', 'Arts', 'Community'] as const

const tzDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const baseSchema = z.object({
  title: z.string().min(1, 'Event title is required (e.g., "Community Mediation Workshop")'),
  summary: z.string().optional(),
  descriptionHtml: z.string().optional(),
  slug: z.string().optional(),
  externalRegistrationLink: z
    .string()
    .trim()
    .url('Enter a valid URL (e.g., https://example.com)')
    .optional()
    .or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().min(1),
  isOnline: z.boolean().default(false),
  venueName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
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
  listed: z.boolean().default(true),
  category: z.enum(categories).optional(),
  subcategory: z.string().optional(),
  format: z.enum(formats).optional(),
  imageFile: z.instanceof(File).optional().or(z.literal(undefined)),
})

const schema = baseSchema
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

type FormValues = z.input<typeof baseSchema>

// Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[] },
          ) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => {
              address_components?: Array<{
                long_name: string
                short_name: string
                types: string[]
              }>
              formatted_address?: string
            }
          }
        }
      }
    }
  }
}

type GooglePlacesAutocomplete = {
  addListener: (event: string, callback: () => void) => void
  getPlace: () => {
    address_components?: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    formatted_address?: string
  }
}

async function uploadEventImage(file: File): Promise<string | undefined> {
  if (!file) return undefined
  const fd = new FormData()
  fd.set('file', file)
  fd.set('type', 'events')
  fd.set('alt', file.name)
  const res = await fetch('/api/media', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || 'Image upload failed')
  }
  const data = await res.json()
  return data?.url as string
}

export default function NewEventPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [isInitializingAddress, setIsInitializingAddress] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | undefined>()
  const addressAutocompleteRef = useRef<GooglePlacesAutocomplete | null>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      summary: '',
      descriptionHtml: '',
      slug: '',
      externalRegistrationLink: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      timezone: tzDefault,
      isOnline: false,
      capacity: undefined,
      isFree: true,
      price: undefined,
      currency: 'USD',
      listed: true,
      category: undefined,
      subcategory: '',
      format: undefined,
    },
    mode: 'onBlur',
  })

  // Auto-save
  const { clearSavedData, hasSavedData } = useFormAutoSave(form, 'event-create')

  // Check for draft on mount
  useEffect(() => {
    if (hasSavedData()) {
      setShowDraftModal(true)
    }
  }, [hasSavedData])

  // Track last saved time
  useEffect(() => {
    const subscription = form.watch(() => {
      setLastSaved(new Date())
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [form.formState.isDirty])

  const isOnline = form.watch('isOnline')
  const isFree = form.watch('isFree')
  const title = form.watch('title')

  // Google Maps initialization (same as before)
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setIsGoogleMapsLoaded(true)
        return true
      }
      return false
    }

    if (checkGoogleMaps()) {
      return
    }

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isGoogleMapsLoaded || !addressInputRef.current || isOnline) {
      return
    }

    if (addressAutocompleteRef.current) {
      return
    }

    setIsInitializingAddress(true)

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) {
          setIsInitializingAddress(false)
          return
        }

        let streetNumber = ''
        let streetName = ''
        let city = ''
        let state = ''
        let postalCode = ''
        let country = ''

        for (const component of place.address_components) {
          const types = component.types

          if (types.includes('street_number')) {
            streetNumber = component.long_name
          } else if (types.includes('route')) {
            streetName = component.long_name
          } else if (types.includes('locality')) {
            city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name
          } else if (types.includes('country')) {
            country = component.long_name
          }
        }

        const addressLine1 = [streetNumber, streetName].filter(Boolean).join(' ')

        form.setValue('addressLine1', addressLine1, { shouldValidate: true })
        form.setValue('city', city, { shouldValidate: true })
        form.setValue('state', state, { shouldValidate: true })
        form.setValue('postalCode', postalCode, { shouldValidate: true })
        form.setValue('country', country, { shouldValidate: true })

        setIsInitializingAddress(false)
      })

      addressAutocompleteRef.current = autocomplete
      setIsInitializingAddress(false)
    } catch (error) {
      console.error('[NewEventPage] Error initializing Google Places:', error)
      setIsInitializingAddress(false)
    }

    return () => {
      if (addressAutocompleteRef.current) {
        addressAutocompleteRef.current = null
      }
    }
  }, [isGoogleMapsLoaded, isOnline, form])

  const handleNext = useCallback(async () => {
    // Validate current step fields
    const stepFields: Record<number, (keyof FormValues)[]> = {
      0: ['title', 'summary', 'category', 'format'],
      1: ['startDate', 'startTime', 'timezone', 'isOnline'],
      2: ['descriptionHtml', 'capacity', 'isFree'],
    }

    const fieldsToValidate = stepFields[currentStep] || []
    const isValid = await form.trigger(fieldsToValidate)

    if (isValid) {
      setCurrentStep((s) => Math.min(3, s + 1))
    }
  }, [currentStep, form])

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const values = form.getValues()
      const startAt = new Date(`${values.startDate}T${values.startTime}:00`)
      const endAt =
        values.endDate && values.endTime
          ? new Date(`${values.endDate}T${values.endTime}:00`)
          : undefined

      let imageUrl: string | undefined
      if (values.imageFile instanceof File) {
        imageUrl = await uploadEventImage(values.imageFile)
      }

      await createEvent({
        title: values.title,
        summary: values.summary,
        descriptionHtml: values.descriptionHtml,
        imageUrl,
        externalRegistrationLink:
          typeof values.externalRegistrationLink === 'string' &&
          values.externalRegistrationLink.trim().length > 0
            ? values.externalRegistrationLink.trim()
            : undefined,
        slug: values.slug,
        startAt: startAt.toISOString(),
        endAt: endAt?.toISOString(),
        timezone: values.timezone,
        isOnline: values.isOnline ?? false,
        venue: values.isOnline
          ? undefined
          : {
              name: values.venueName,
              addressLine1: values.addressLine1,
              addressLine2: values.addressLine2,
              city: values.city,
              state: values.state,
              postalCode: values.postalCode,
              country: values.country,
            },
        capacity: typeof values.capacity === 'number' ? values.capacity : undefined,
        isFree: values.isFree ?? true,
        price: values.isFree
          ? undefined
          : typeof values.price === 'number'
            ? values.price
            : undefined,
        currency: values.isFree ? undefined : values.currency,
        listed: values.listed ?? true,
        category: values.category,
        subcategory: values.subcategory,
        format: values.format,
      })

      clearSavedData()
      toast.success('Event created')
      router.push('/dashboard/events')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [form, clearSavedData, router])

  // Step components
  const step1Content = (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title</FormLabel>
            <FormDescription>
              Choose a clear, descriptive title (50-100 characters recommended)
            </FormDescription>
            <FormControl>
              <Input placeholder="e.g., Community Mediation Workshop" {...field} />
            </FormControl>
            <div className="text-xs text-muted-foreground">
              {field.value?.length || 0} characters
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <SlugInput
            value={field.value || ''}
            onChange={field.onChange}
            title={title}
            baseUrl="mcrchoward.org"
          />
        )}
      />

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Summary</FormLabel>
            <FormDescription>A brief one-line description of the event</FormDescription>
            <FormControl>
              <Input placeholder="Short summary (optional)" {...field} />
            </FormControl>
            <div className="text-xs text-muted-foreground">
              {field.value?.length || 0} characters
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Format</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )

  const step2Content = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <FormDescription>Select the timezone where the event will take place</FormDescription>
            <FormControl>
              <TimezoneSelect value={field.value} onValueChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isOnline"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Online event</FormLabel>
              <FormDescription>
                Check this if the event will be held online (no physical location required)
              </FormDescription>
            </div>
          </FormItem>
        )}
      />

      {!isOnline && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="venueName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue name</FormLabel>
                <FormControl>
                  <Input placeholder="Venue" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressLine1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Address line 1
                  {isInitializingAddress && (
                    <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      ref={(e) => {
                        addressInputRef.current = e
                        if (typeof field.ref === 'function') {
                          field.ref(e)
                        }
                      }}
                      placeholder="Start typing your address..."
                      disabled={!isGoogleMapsLoaded}
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                    {!isGoogleMapsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressLine2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Address line 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="State/Province" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code</FormLabel>
                <FormControl>
                  <Input placeholder="Postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )

  const step3Content = (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="descriptionHtml"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormDescription>
              Provide detailed information about the event (supports HTML)
            </FormDescription>
            <FormControl>
              <textarea
                rows={8}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Event details..."
                {...field}
              />
            </FormControl>
            <div className="text-xs text-muted-foreground">
              {field.value?.length || 0} characters
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="capacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Capacity</FormLabel>
            <FormDescription>
              Maximum number of attendees (leave blank for unlimited)
            </FormDescription>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="e.g. 100"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isFree"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(Boolean(v))}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Free event</FormLabel>
                <FormDescription>Check if the event is free to attend</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {!isFree && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="e.g. 25.00"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      <FormField
        control={form.control}
        name="imageFile"
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel>Event Image</FormLabel>
            <FormDescription>
              Upload an image for the event (recommended: 1200×630px for best display)
            </FormDescription>
            <FormControl>
              <ImageUploadPreview
                value={value}
                onChange={onChange}
                onUpload={uploadEventImage}
                recommendedSize={{ width: 1200, height: 630 }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="externalRegistrationLink"
        render={({ field }) => (
          <FormItem>
            <FormLabel>External registration link</FormLabel>
            <FormDescription>
              Optional. If provided, the public event page will show a “Register here” button
              linking out.
            </FormDescription>
            <FormControl>
              <div className="relative">
                <LinkIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="url"
                  placeholder="https://…"
                  autoComplete="url"
                  inputMode="url"
                  className="pl-10"
                  {...field}
                  value={field.value || ''}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  const step4Content = (
    <div className="space-y-6">
      <div className="rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold">Review Your Event</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Title:</span> {form.watch('title') || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Date:</span>{' '}
            {form.watch('startDate') && form.watch('startTime')
              ? `${form.watch('startDate')} at ${form.watch('startTime')}`
              : 'Not set'}
          </div>
          <div>
            <span className="font-medium">Location:</span>{' '}
            {isOnline ? 'Online' : form.watch('venueName') || form.watch('city') || 'Not set'}
          </div>
          <div>
            <span className="font-medium">Price:</span>{' '}
            {isFree ? 'Free' : `$${form.watch('price')} ${form.watch('currency')}`}
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="listed"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Listed (public)</FormLabel>
              <FormDescription>Make this event visible on the public events page</FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  )

  const steps: FormStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Event title, summary, and categorization',
      component: step1Content,
    },
    {
      id: 'schedule',
      title: 'Schedule & Location',
      description: 'Date, time, timezone, and venue details',
      component: step2Content,
    },
    {
      id: 'details',
      title: 'Details & Settings',
      description: 'Description, capacity, pricing, and image',
      component: step3Content,
    },
    {
      id: 'review',
      title: 'Review & Publish',
      description: 'Review your event and publish',
      component: step4Content,
    },
  ]

  const isLastStep = currentStep === steps.length - 1
  const canProceed = isLastStep ? form.formState.isValid : true

  // When arriving at the Review step, validate the full form so missing required fields are surfaced.
  useEffect(() => {
    if (isLastStep) {
      void form.trigger()
    }
  }, [isLastStep, form])

  return (
    <div className="min-h-screen bg-background">
      <FormHeader
        title="Create Event"
        isDirty={form.formState.isDirty}
        lastSaved={lastSaved}
        isSaving={false}
      />

      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFinish)}>
                <EventFormStepper
                  steps={steps}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  onFinish={() => form.handleSubmit(handleFinish)()}
                  isSubmitting={isSubmitting}
                  canProceed={canProceed}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <DraftRecoveryModal
        open={showDraftModal}
        onOpenChange={setShowDraftModal}
        onRestore={() => {
          setShowDraftModal(false)
          // Data is already restored by useFormAutoSave
        }}
        onDiscard={() => {
          clearSavedData()
          setShowDraftModal(false)
        }}
        lastSaved={lastSaved}
      />
    </div>
  )
}
