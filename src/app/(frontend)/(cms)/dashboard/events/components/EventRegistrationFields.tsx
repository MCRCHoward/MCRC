'use client'

import { Link2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { EventFormValues } from './eventFormSchema'

interface EventRegistrationFieldsProps {
  disabled?: boolean
}

export function EventRegistrationFields({ disabled }: EventRegistrationFieldsProps) {
  const { control } = useFormContext<EventFormValues>()

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-base">Registration Settings</CardTitle>
        <CardDescription>Configure how attendees register for this event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="isRegistrationRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(Boolean(value))}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">Require registration</FormLabel>
                <FormDescription className="text-xs">
                  Uncheck if the event is drop-in. Registration is blocked for archived events.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="externalRegistrationLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External registration link</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    {...field}
                    className="pl-10"
                    placeholder="https://example.com/registration (leave blank to use native form)"
                    disabled={disabled}
                  />
                </div>
              </FormControl>
              <FormDescription>
                If provided, attendees will be sent to this URL instead of the native form.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
