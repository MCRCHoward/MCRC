'use client'

import { useFormContext } from 'react-hook-form'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUploadPreview } from './ImageUploadPreview'
import type { EventFormValues } from './eventFormSchema'

interface EventImageFieldsProps {
  existingImageUrl?: string
  existingSecondaryImageUrl?: string
}

export function EventImageFields({
  existingImageUrl,
  existingSecondaryImageUrl,
}: EventImageFieldsProps) {
  const { control } = useFormContext<EventFormValues>()

  return (
    <>
      <FormField
        control={control}
        name="imageFile"
        render={({ field: { onChange, value } }) => (
          <FormItem>
            <FormLabel>Event image</FormLabel>
            <ImageUploadPreview
              value={value}
              onChange={(file) => onChange(file)}
              existingUrl={existingImageUrl}
              recommendedSize={{ width: 1200, height: 630 }}
            />
            <FormDescription>Recommended 1200x630px. JPG or PNG up to 5MB.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="secondaryImageFile"
        render={({ field: { onChange, value } }) => (
          <FormItem>
            <FormLabel>Secondary image (optional)</FormLabel>
            <ImageUploadPreview
              value={value}
              onChange={(file) => onChange(file)}
              existingUrl={existingSecondaryImageUrl}
              recommendedSize={{ width: 1200, height: 630 }}
            />
            <FormDescription>Used for alternate layouts or cards.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
