'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  checkSlugAvailability,
  createEvent,
  updateEvent,
} from '@/app/(frontend)/(cms)/dashboard/events/firebase-actions'
import type { EventWithEditFields } from '@/lib/events'
import {
  categories,
  currencies,
  eventFormSchema,
  formats,
  type EventFormValues,
} from './eventFormSchema'
import { extractImageUrl, isoToDate, isoToTime, slugify, uploadEventImage } from './eventFormUtils'

export type SlugStatus = 'idle' | 'checking' | 'available' | 'unavailable'

export interface UseEventFormOptions {
  mode: 'new' | 'edit'
  event?: EventWithEditFields | null
  eventId?: string
}

export interface UseEventFormResult {
  form: UseFormReturn<EventFormValues>
  isSubmitting: boolean
  slugStatus: SlugStatus
  isSlugDirty: boolean
  setIsSlugDirty: (value: boolean) => void
  existingImageUrl?: string
  existingSecondaryImageUrl?: string
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
}

const tzDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export function useEventForm({ mode, event, eventId }: UseEventFormOptions): UseEventFormResult {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlugDirty, setIsSlugDirty] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')

  const existingImageUrl = useMemo(() => extractImageUrl(event?.featuredImage), [event?.featuredImage])
  const existingSecondaryImageUrl = useMemo(
    () => extractImageUrl(event?.secondaryImage),
    [event?.secondaryImage],
  )

  const defaultValues = useMemo((): EventFormValues => {
    if (mode === 'edit' && event) {
      return {
        title: event.name || '',
        slug: event.meta?.slug || event.slug || '',
        summary: event.summary || '',
        descriptionHtml: event.descriptionHtml || '',
        externalRegistrationLink: event.externalRegistrationLink || '',
        startDate: isoToDate(event.eventStartTime),
        startTime: isoToTime(event.eventStartTime),
        endDate: isoToDate(event.eventEndTime) || '',
        endTime: isoToTime(event.eventEndTime) || '',
        timezone: event.timezone || tzDefault,
        isOnline: event.modality === 'online' || event.modality === 'hybrid',
        isRegistrationRequired: event.isRegistrationRequired ?? true,
        venueName: event.venueFields?.name || event.location?.venueName || '',
        addressLine1: event.venueFields?.addressLine1 || '',
        addressLine2: event.venueFields?.addressLine2 || '',
        city: event.venueFields?.city || '',
        state: event.venueFields?.state || '',
        postalCode: event.venueFields?.postalCode || '',
        country: event.venueFields?.country || '',
        onlineMeetingUrl: event.onlineMeetingUrl || event.onlineMeeting?.url || '',
        onlineMeetingDetails: event.onlineMeetingDetails || event.onlineMeeting?.details || '',
        capacity: event.capacity,
        isFree: event.isFree ?? true,
        price: event.cost?.amount,
        currency: (event.cost?.currency as (typeof currencies)[number]) || 'USD',
        costDescription: event.cost?.description,
        listed: event.listed ?? true,
        status: event.meta?.status === 'published' ? 'published' : 'draft',
        category: (event.category || event.meta?.eventType) as (typeof categories)[number] | undefined,
        subcategory: event.subcategory || '',
        format: (event.format as (typeof formats)[number]) || undefined,
        imageFile: undefined,
        secondaryImageFile: undefined,
      }
    }

    return {
      title: '',
      slug: '',
      summary: '',
      descriptionHtml: '',
      externalRegistrationLink: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      timezone: tzDefault,
      isOnline: false,
      isRegistrationRequired: true,
      venueName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      onlineMeetingUrl: '',
      onlineMeetingDetails: '',
      capacity: undefined,
      isFree: true,
      price: undefined,
      currency: 'USD',
      costDescription: '',
      listed: true,
      status: 'published',
      category: undefined,
      subcategory: '',
      format: undefined,
      imageFile: undefined,
      secondaryImageFile: undefined,
    }
  }, [mode, event])

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const titleValue = form.watch('title')
  const slugValue = form.watch('slug')

  useEffect(() => {
    if (isSlugDirty) return
    if (slugValue) return

    const nextSlug = slugify(titleValue || '')
    form.setValue('slug', nextSlug, { shouldValidate: true })
  }, [titleValue, slugValue, isSlugDirty, form])

  useEffect(() => {
    let active = true

    if (!slugValue) {
      setSlugStatus('idle')
      return
    }

    setSlugStatus('checking')
    const handle = setTimeout(async () => {
      try {
        const available = await checkSlugAvailability(slugValue, mode === 'edit' ? eventId : undefined)
        if (!active) return
        setSlugStatus(available ? 'available' : 'unavailable')
      } catch (error) {
        console.error('[useEventForm] slug check failed', error)
        if (!active) return
        setSlugStatus('unavailable')
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [slugValue, mode, eventId])

  const handleSubmit = useCallback(
    async (values: EventFormValues) => {
      setIsSubmitting(true)
      try {
        if (slugStatus === 'unavailable') {
          throw new Error('Slug is already in use. Please choose another.')
        }

        const startAt = new Date(`${values.startDate}T${values.startTime}:00`)
        const endAt =
          values.endDate && values.endTime ? new Date(`${values.endDate}T${values.endTime}:00`) : undefined

        let imageUrl: string | undefined
        if (values.imageFile instanceof File) {
          imageUrl = await uploadEventImage(values.imageFile)
        } else {
          imageUrl = existingImageUrl
        }

        let secondaryImageUrl: string | undefined
        if (values.secondaryImageFile instanceof File) {
          secondaryImageUrl = await uploadEventImage(values.secondaryImageFile)
        } else {
          secondaryImageUrl = existingSecondaryImageUrl
        }

        const priceValue =
          typeof values.price === 'number'
            ? values.price
            : typeof values.price === 'string' && values.price
              ? Number(values.price)
              : undefined
        const capacityValue =
          typeof values.capacity === 'number'
            ? values.capacity
            : typeof values.capacity === 'string' && values.capacity
              ? Number(values.capacity)
              : undefined

        const cost =
          values.isFree || !priceValue
            ? undefined
            : {
                amount: priceValue,
                currency: values.currency || 'USD',
                description: values.costDescription || undefined,
              }

        const eventData = {
          title: values.title,
          slug: values.slug,
          summary: values.summary,
          descriptionHtml: values.descriptionHtml,
          imageUrl,
          secondaryImageUrl,
          externalRegistrationLink: values.externalRegistrationLink || undefined,
          startAt: startAt.toISOString(),
          endAt: endAt?.toISOString(),
          timezone: values.timezone,
          isOnline: values.isOnline ?? false,
          onlineMeetingUrl: values.isOnline ? values.onlineMeetingUrl || undefined : undefined,
          onlineMeetingDetails: values.isOnline ? values.onlineMeetingDetails || undefined : undefined,
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
          capacity: capacityValue,
          isFree: values.isFree ?? true,
          price: cost?.amount,
          currency: cost?.currency,
          costDescription: cost?.description,
          cost,
          listed: values.listed ?? true,
          status: values.status ?? 'published',
          isRegistrationRequired: values.isRegistrationRequired ?? true,
          category: values.category,
          subcategory: values.subcategory,
          format: values.format,
        }

        if (mode === 'new') {
          await createEvent(eventData)
          toast.success('Event created')
          router.push('/dashboard/events')
        } else {
          if (!eventId) {
            throw new Error('Event ID is required for editing')
          }

          await updateEvent(eventId, eventData)
          toast.success('Event updated')
          router.push('/dashboard/events')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to ${mode === 'new' ? 'create' : 'update'} event`
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [eventId, existingImageUrl, existingSecondaryImageUrl, mode, router, slugStatus],
  )

  return {
    form,
    isSubmitting,
    slugStatus,
    isSlugDirty,
    setIsSlugDirty,
    existingImageUrl,
    existingSecondaryImageUrl,
    onSubmit: form.handleSubmit(handleSubmit),
  }
}
