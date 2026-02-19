'use client'

import { Hash, Loader2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/utilities/ui'
import type { EventFormValues } from './eventFormSchema'
import { slugify } from './eventFormUtils'
import type { SlugStatus } from './useEventForm'

interface EventBasicFieldsProps {
  slugStatus: SlugStatus
  isSubmitting?: boolean
  onSlugDirtyChange: () => void
}

export function EventBasicFields({
  slugStatus,
  isSubmitting,
  onSlugDirtyChange,
}: EventBasicFieldsProps) {
  const { control } = useFormContext<EventFormValues>()

  return (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Event title" disabled={isSubmitting} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Summary</FormLabel>
            <FormControl>
              <Input placeholder="Short summary (optional)" disabled={isSubmitting} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Hash className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  className={cn('pl-10', slugStatus === 'checking' && 'pr-10')}
                  placeholder="event-slug"
                  disabled={isSubmitting || slugStatus === 'checking'}
                  aria-busy={slugStatus === 'checking'}
                  {...field}
                  onChange={(e) => {
                    onSlugDirtyChange()
                    field.onChange(slugify(e.target.value))
                  }}
                />
                {slugStatus === 'checking' && (
                  <Loader2
                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                    aria-label="Checking availability"
                  />
                )}
              </div>
            </FormControl>
            <FormDescription>
              URL path for this event.{' '}
              {slugStatus === 'available' && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Available
                </Badge>
              )}
              {slugStatus === 'unavailable' && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  Already in use
                </Badge>
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="descriptionHtml"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea rows={6} placeholder="Event details (supports HTML)" disabled={isSubmitting} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
