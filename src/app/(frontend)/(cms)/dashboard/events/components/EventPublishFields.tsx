'use client'

import { Info as InfoIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EventFormValues } from './eventFormSchema'

interface EventPublishFieldsProps {
  disabled?: boolean
}

export function EventPublishFields({ disabled }: EventPublishFieldsProps) {
  const { control, watch } = useFormContext<EventFormValues>()
  const status = watch('status')
  const listed = watch('listed')

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-base">Publishing Settings</CardTitle>
        <CardDescription>Control event visibility and status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Draft events are only visible to editors</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="listed"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between">
                <FormLabel>Public Listing</FormLabel>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(Boolean(value))}
                      disabled={disabled}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-normal">Show in public event listings</FormLabel>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {status === 'draft' && (
              <span>
                This event is <strong>not visible</strong> to the public.
              </span>
            )}
            {status === 'published' && listed === false && (
              <span>
                This event is published but <strong>unlisted</strong> (accessible via direct link only).
              </span>
            )}
            {status === 'published' && listed === true && (
              <span>
                This event is <strong>published and listed</strong> publicly.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
