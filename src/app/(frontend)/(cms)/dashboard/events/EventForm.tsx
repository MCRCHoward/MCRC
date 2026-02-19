'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import type { EventWithEditFields } from '@/lib/events'
import {
  EventBasicFields,
  EventCategoryFields,
  EventDateTimeFields,
  EventImageFields,
  EventLocationFields,
  EventOnlineFields,
  EventPricingFields,
  EventPublishFields,
  EventRegistrationFields,
  useEventForm,
} from './components'

export type EventFormProps = {
  mode: 'new' | 'edit'
  event?: EventWithEditFields | null
  eventId?: string
}

export default function EventForm({ mode, event, eventId }: EventFormProps) {
  const router = useRouter()
  const {
    form,
    isSubmitting,
    slugStatus,
    setIsSlugDirty,
    existingImageUrl,
    existingSecondaryImageUrl,
    onSubmit,
  } = useEventForm({
    mode,
    event,
    eventId,
  })

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'new' ? 'Create Event' : 'Edit Event'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-6">
              <EventBasicFields
                slugStatus={slugStatus}
                isSubmitting={isSubmitting}
                onSlugDirtyChange={() => setIsSlugDirty(true)}
              />
              <EventDateTimeFields disabled={isSubmitting} />
              <EventLocationFields disabled={isSubmitting} />
              <EventOnlineFields disabled={isSubmitting} />
              <EventRegistrationFields disabled={isSubmitting} />
              <EventPublishFields disabled={isSubmitting} />
              <EventPricingFields disabled={isSubmitting} />
              <EventCategoryFields disabled={isSubmitting} />
              <EventImageFields
                existingImageUrl={existingImageUrl}
                existingSecondaryImageUrl={existingSecondaryImageUrl}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/events')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || slugStatus === 'checking' || slugStatus === 'unavailable'
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : mode === 'new' ? (
                    'Create event'
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
