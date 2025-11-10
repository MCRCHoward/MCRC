'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { EventRegistrationInput } from '@/types/event-registration'
import { registerForEvent } from '@/app/(frontend)/(default)/events/[slug]/actions'

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  serviceInterest: z.enum(['Mediation', 'Facilitation', 'Restorative Practices', 'Other', 'None'], {
    required_error: 'Please select a service interest',
  }),
  emailMarketingConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to email marketing to register',
  }),
})

type RegistrationFormValues = z.infer<typeof registrationSchema>

interface EventRegistrationFormProps {
  eventId: string
  eventSlug: string
  userEmail?: string
  userName?: string
  userPhone?: string
  onSuccess?: () => void
}

export function EventRegistrationForm({
  eventId,
  userEmail = '',
  userName = '',
  userPhone = '',
  onSuccess,
}: EventRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: userName,
      email: userEmail,
      phone: userPhone,
      serviceInterest: undefined,
      emailMarketingConsent: false,
    },
  })

  // Update form when user data changes
  useEffect(() => {
    if (userName) form.setValue('name', userName)
    if (userEmail) form.setValue('email', userEmail)
    if (userPhone) form.setValue('phone', userPhone)
  }, [userName, userEmail, userPhone, form])

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true)

    try {
      const registrationData: EventRegistrationInput = {
        eventId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        emailMarketingConsent: values.emailMarketingConsent,
        serviceInterest: values.serviceInterest,
      }

      await registerForEvent(eventId, registrationData)

      toast.success('Successfully registered for this event!')
      onSuccess?.()
      // Refresh the page to show updated registration status
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register for event. Please try again.'
      toast.error(errorMessage)
      console.error('Registration error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Your full name"
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="your.email@example.com"
                  disabled={isSubmitting || !!userEmail}
                  readOnly={!!userEmail}
                  aria-required="true"
                />
              </FormControl>
              <FormDescription>
                {userEmail ? 'Email from your account' : 'Your email address'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="(123) 456-7890"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Which service interests you most?</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger aria-required="true">
                    <SelectValue placeholder="Select a service interest" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Mediation">Mediation</SelectItem>
                  <SelectItem value="Facilitation">Facilitation</SelectItem>
                  <SelectItem value="Restorative Practices">Restorative Practices</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Help us understand your interests for better event planning</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailMarketingConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  aria-required="true"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  I consent to receive email marketing communications
                </FormLabel>
                <FormDescription>
                  You&apos;ll receive updates about upcoming events and programs that match your interests.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Registering...
            </>
          ) : (
            'Register for Event'
          )}
        </Button>
      </form>
    </Form>
  )
}

