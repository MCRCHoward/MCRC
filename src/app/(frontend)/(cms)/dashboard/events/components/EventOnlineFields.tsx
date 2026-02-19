'use client'

import { Globe } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { EventFormValues } from './eventFormSchema'

interface EventOnlineFieldsProps {
  disabled?: boolean
}

export function EventOnlineFields({ disabled }: EventOnlineFieldsProps) {
  const { control, watch } = useFormContext<EventFormValues>()
  const isOnline = watch('isOnline')

  if (!isOnline) {
    return null
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-base">Online meeting details</CardTitle>
        <CardDescription>Share the virtual meeting URL and notes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="onlineMeetingUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting URL</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input {...field} className="pl-10" placeholder="https://zoom.us/j/..." disabled={disabled} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="onlineMeetingDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Agenda, passcode, dial-in info"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
