'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import type { NewsletterFormProps, NewsletterFormData } from './types'

// Create schema based on whether names are shown
const createSchema = (showNames: boolean) => {
  const baseSchema = {
    email: z.string().email({ message: 'Please enter a valid email address.' }),
  }

  if (showNames) {
    return z.object({
      ...baseSchema,
      firstName: z.string().min(1, { message: 'First name is required.' }).optional(),
    })
  }

  return z.object(baseSchema)
}

export function NewsletterForm({
  showNames = false,
  variant = 'default',
  className,
  emailPlaceholder = 'Email',
  firstNamePlaceholder = 'First Name',
  buttonText = 'Subscribe',
}: NewsletterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const schema = createSchema(showNames)
  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      firstName: showNames ? '' : undefined,
    },
  })

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true)
    setError(null)
    setShowSuccess(false)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim(),
          firstName: data.firstName?.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe to newsletter')
      }

      // Success
      toast.success('Successfully subscribed to our newsletter!')
      setShowSuccess(true)
      form.reset()

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCompact = variant === 'compact'
  const containerClass = className || (isCompact ? 'space-y-2' : 'space-y-4')

  return (
    <div className={containerClass}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {showNames && (
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="newsletter-firstname" className="sr-only">
                    First Name
                  </Label>
                  <FormControl>
                    <Input
                      id="newsletter-firstname"
                      type="text"
                      placeholder={firstNamePlaceholder}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="newsletter-email" className="sr-only">
                  Email
                </Label>
                <FormControl>
                  <Input
                    id="newsletter-email"
                    type="email"
                    placeholder={emailPlaceholder}
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className={isCompact ? 'w-full' : ''}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              buttonText
            )}
          </Button>
        </form>
      </Form>

      {/* Inline success message */}
      {showSuccess && (
        <div className="mt-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          Thank you for subscribing! Check your email to confirm your subscription.
        </div>
      )}

      {/* Inline error message */}
      {error && !showSuccess && (
        <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

