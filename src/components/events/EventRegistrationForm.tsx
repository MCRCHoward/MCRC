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
import { PayPalButton } from '@/components/payments/PayPalButton'
import { formatPaymentAmount } from '@/utilities/payment-helpers'

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-()\+]+$/.test(val),
      'Phone number can only contain digits, spaces, dashes, parentheses, and plus sign',
    ),
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
  userEmail?: string
  userName?: string
  userPhone?: string
  isFree: boolean
  eventCost?: { amount: number; currency: string }
  onSuccess?: () => void
}

export function EventRegistrationForm({
  eventId,
  userEmail = '',
  userName = '',
  userPhone = '',
  isFree,
  eventCost,
  onSuccess,
}: EventRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPayPalButtons, setShowPayPalButtons] = useState(false)
  const [formData, setFormData] = useState<EventRegistrationInput | null>(null)

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

      // For free events, register directly
      if (isFree) {
        await registerForEvent(eventId, registrationData)

        toast.success('Successfully registered!', {
          description: 'You will receive a confirmation email shortly.',
          duration: 5000,
        })
        onSuccess?.()
        router.refresh()
        return
      }

      // For paid events, show PayPal buttons
      if (eventCost && eventCost.amount > 0) {
        setFormData(registrationData)
        setShowPayPalButtons(true)
        setIsSubmitting(false)
        return
      }

      // Fallback: should not reach here, but handle gracefully
      throw new Error('Payment information is missing for this paid event')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register for event. Please try again.'
      toast.error('Registration Failed', {
        description: errorMessage,
        duration: 5000,
      })
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Successfully registered!', {
      description: 'Your payment has been processed and registration confirmed.',
      duration: 5000,
    })
    onSuccess?.()
    router.refresh()
  }

  const handlePaymentError = (_error: Error) => {
    // Error is already handled in PayPalButton component
    setShowPayPalButtons(false)
    setFormData(null)
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
                  aria-describedby={form.formState.errors.name ? 'name-error' : 'name-description'}
                />
              </FormControl>
              <FormDescription id="name-description">Enter your full name as it should appear on your registration</FormDescription>
              <FormMessage id="name-error" />
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
                  aria-describedby={form.formState.errors.email ? 'email-error' : 'email-description'}
                />
              </FormControl>
              <FormDescription id="email-description">
                {userEmail ? 'Email from your account' : 'Your email address'}
              </FormDescription>
              <FormMessage id="email-error" />
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
                  aria-describedby={form.formState.errors.phone ? 'phone-error' : 'phone-description'}
                />
              </FormControl>
              <FormDescription id="phone-description">Optional: We may use this to contact you about the event</FormDescription>
              <FormMessage id="phone-error" />
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
                  <SelectTrigger
                    aria-required="true"
                    aria-describedby={form.formState.errors.serviceInterest ? 'service-interest-error' : 'service-interest-description'}
                  >
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
              <FormDescription id="service-interest-description">Help us understand your interests for better event planning</FormDescription>
              <FormMessage id="service-interest-error" />
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
                  aria-describedby={form.formState.errors.emailMarketingConsent ? 'consent-error' : 'consent-description'}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer" htmlFor="emailMarketingConsent">
                  I consent to receive email marketing communications
                </FormLabel>
                <FormDescription id="consent-description">
                  You&apos;ll receive updates about upcoming events and programs that match your interests.
                </FormDescription>
                {form.formState.errors.emailMarketingConsent && (
                  <p id="consent-error" className="text-sm font-medium text-destructive">
                    {form.formState.errors.emailMarketingConsent.message}
                  </p>
                )}
              </div>
            </FormItem>
          )}
        />

        {!showPayPalButtons ? (
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {isFree ? 'Registering...' : 'Continue to Payment...'}
              </>
            ) : isFree ? (
              'Register for Event'
            ) : (
              `Continue to Payment - ${formatPaymentAmount(eventCost?.amount || 0, eventCost?.currency || 'USD')}`
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {eventCost && formData && (
              <>
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">{formatPaymentAmount(eventCost.amount, eventCost.currency)}</p>
                </div>
                <PayPalButton
                  eventId={eventId}
                  registrationData={formData}
                  amount={eventCost.amount}
                  currency={eventCost.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowPayPalButtons(false)
                    setFormData(null)
                  }}
                >
                  Back to Form
                </Button>
              </>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}

