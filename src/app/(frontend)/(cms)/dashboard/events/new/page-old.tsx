'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

import { createEvent } from '@/app/(frontend)/(cms)/dashboard/events/firebase-actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const currencies = ['USD', 'EUR', 'GBP'] as const
const formats = ['Conference', 'Seminar', 'Workshop', 'Class', 'Networking'] as const
const categories = ['Business', 'Science & Tech', 'Health', 'Arts', 'Community'] as const

const tzDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  summary: z.string().optional(),
  descriptionHtml: z.string().optional(),
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

// Extend Window interface for Google Maps types
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
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const [isInitializingAddress, setIsInitializingAddress] = useState(false)
  const addressAutocompleteRef = useRef<GooglePlacesAutocomplete | null>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      summary: '',
      descriptionHtml: '',
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
    mode: 'onTouched',
  })

  const onSubmit = async (values: FormValues) => {
    try {
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

      toast.success('Event created')
      router.push('/dashboard/events')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event'
      toast.error(errorMessage)
    }
  }

  const isOnline = form.watch('isOnline')
  const isFree = form.watch('isFree')

  // Check if Google Maps is loaded
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

  // Initialize autocomplete when Google Maps is loaded and addressLine1 field is available
  useEffect(() => {
    if (!isGoogleMapsLoaded || !addressInputRef.current || isOnline) {
      return
    }

    if (addressAutocompleteRef.current) {
      return // Already initialized
    }

    setIsInitializingAddress(true)

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'], // Restrict to addresses only
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) {
          setIsInitializingAddress(false)
          return
        }

        // Parse address components
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
            state = component.short_name // Use short name for state (e.g., "MD")
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name
          } else if (types.includes('country')) {
            country = component.long_name
          }
        }

        // Set form values
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

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="Short summary (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Event details (supports HTML)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormControl>
                      <Input placeholder="e.g. America/New_York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isOnline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Online event</FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listed (public)</FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
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
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="e.g. 100"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                              aria-label="Address line 1 with autocomplete"
                              disabled={!isGoogleMapsLoaded}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e)
                                form.setValue('addressLine1', e.target.value, {
                                  shouldValidate: true,
                                })
                              }}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Free event</FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isFree && (
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
                              field.onChange(
                                e.target.value === '' ? undefined : Number(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isFree && (
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
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

              <FormField
                control={form.control}
                name="imageFile"
                render={({ field: { onChange, value: _value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Event image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        {...field}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          onChange(file || undefined)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="submit">Create event</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
