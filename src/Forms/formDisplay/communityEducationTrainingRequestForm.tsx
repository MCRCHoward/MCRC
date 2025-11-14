'use client'

import * as React from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { useFirestoreFormSubmit } from '@/hooks/useFirestoreFormSubmit'
import {
  handlePhoneInputChange,
  handlePhoneKeyPress,
  stripPhoneNumber,
} from '@/utilities/phoneUtils'
import { useFormAutoSave } from '@/hooks/useFormAutoSave'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------- Schema & Types ----------------
const trainingOptions = [
  'Mediation 101 for Businesses',
  'Conflict Management in the Workplace',
  'Conflict Styles & Self-Awareness',
  'Consensus-Based Decision Making',
  'Anger Management / Emotional Regulation',
  'Custom Workshop or Series',
  "Not sure yet, let's talk",
] as const

// Optional phone validation
const optionalPhoneSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      const digits = stripPhoneNumber(val)
      return digits.length === 10 || digits.length === 0
    },
    { message: 'Please enter a valid 10-digit phone number or leave blank.' },
  )

const trainingRequestSchema = z.object({
  // Section 1: Contact Information
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email.'),
  phone: optionalPhoneSchema,
  organization: z.string().optional().or(z.literal('')),

  // Section 2: Training Interest (required except additionalInfo)
  trainings: z.array(z.enum(trainingOptions)).min(1, 'Please select at least one training.'),
  audience: z.string().min(1, 'Please tell us who the training is for.'),
  timeframe: z.date({ required_error: 'Please select a preferred date or timeframe.' }),
  additionalInfo: z.string().optional().or(z.literal('')),
})

type TrainingRequestValues = z.infer<typeof trainingRequestSchema>

// ---------------- Step Configuration ----------------
const STEP_TITLES = [
  'Section 1: Contact Information',
  'Section 2: Training Interest',
  'Submitted',
] as const

const STEP_FIELDS: Array<(keyof TrainingRequestValues)[]> = [
  ['firstName', 'lastName', 'email', 'phone', 'organization'],
  ['trainings', 'audience', 'timeframe', 'additionalInfo'],
]

export function CommunityEducationTrainingRequestForm() {
  const TOTAL_STEPS = STEP_TITLES.length
  const [currentStep, setCurrentStep] = React.useState(0)

  const {
    isSubmitting,
    error,
    success: _success,
    submitData,
  } = useFirestoreFormSubmit('forms/communityEducationTrainingRequest/submissions')

  const form = useForm<TrainingRequestValues>({
    resolver: zodResolver(trainingRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      trainings: [],
      audience: '',
      timeframe: undefined,
      additionalInfo: '',
    },
    mode: 'onChange', // Changed from 'onTouched' for real-time validation
  })

  // Auto-save form data
  const { clearSavedData, hasSavedData } = useFormAutoSave(form, 'community-education-training')

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1))

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const isStepValid = await form.trigger(fields as Array<keyof TrainingRequestValues>, {
      shouldFocus: true,
    })
    if (isStepValid) setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }

  async function onSubmit(data: TrainingRequestValues) {
    const okay = await form.trigger(
      STEP_FIELDS[currentStep] as Array<keyof TrainingRequestValues>,
      { shouldFocus: true },
    )
    if (!okay) return

    await submitData(data)

    setTimeout(() => {
      if (form.formState.isSubmitSuccessful && !error) {
        clearSavedData() // Clear auto-saved data on successful submission
        toast.success("Thank you! Your training request was submitted. We'll follow up shortly.")
        setCurrentStep(TOTAL_STEPS - 1)
      }
    }, 0)
  }

  const progressPct = ((currentStep + 1) / TOTAL_STEPS) * 100

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step header + progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </p>
            <p className="text-sm font-medium">{STEP_TITLES[currentStep]}</p>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* STEP 1: Contact Information */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Section 1: Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Your Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormDescription>So we can follow up with you</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="(123) 456-7890"
                        pattern="[\(]\d{3}[\)]\s\d{3}[\-]\d{4}"
                        {...field}
                        onChange={(e) => {
                          handlePhoneInputChange(e.target.value, field.onChange)
                        }}
                        onKeyPress={handlePhoneKeyPress}
                      />
                    </FormControl>
                    <FormDescription>(Optional if you would prefer a phone call)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of Organization</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tell us who you are reaching out on behalf of"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>(If applicable)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Training Interest */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Section 2: Training Interest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="trainings"
                render={() => (
                  <FormItem>
                    <FormLabel>Which training(s) are you interested in?</FormLabel>
                    <FormDescription>Check all that apply</FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {trainingOptions.map((option) => {
                        const checked = form.watch('trainings')?.includes(option) ?? false
                        return (
                          <FormItem key={option} className="flex items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  const current = form.getValues('trainings') ?? []
                                  const isChecked = Boolean(next)
                                  const updated = isChecked
                                    ? Array.from(new Set([...current, option]))
                                    : current.filter((v: string) => v !== option)
                                  form.setValue('trainings', updated, { shouldValidate: true })
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">{option}</FormLabel>
                            </div>
                          </FormItem>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who would the training be for?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="E.g., staff, board members, volunteers, students, community members"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Preferred Date(s) or Timeframe</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Rough timing is fine, we can coordinate details later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else you&apos;d like to share? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Open text box" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Success */}
        {currentStep === TOTAL_STEPS - 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Submitted</CardTitle>
              <CardDescription>We received your request.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 font-semibold">
                Thank you! Your training request was submitted. We’ll follow up shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer: status + nav buttons */}
        <div className="flex flex-col gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>
                {error}. Please try again or contact us if the problem persists.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3">
            {currentStep < TOTAL_STEPS - 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  Back
                </Button>

                {currentStep < TOTAL_STEPS - 2 ? (
                  <Button type="button" onClick={goNext} disabled={isSubmitting}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Training Request'
                    )}
                  </Button>
                )}
              </>
            ) : (
              <>
                <div />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearSavedData()
                    form.reset()
                    setCurrentStep(0)
                  }}
                >
                  Start another request
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
