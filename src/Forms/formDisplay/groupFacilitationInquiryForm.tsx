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
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

// shadcn/ui
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------- Schema & Types ----------------
const organizationTypes = [
  'Community Group',
  'Neighborhood Association',
  'Small Business',
  'School',
  'Nonprofit',
  'Other',
] as const

const supportOptions = [
  'Group Facilitation and Dialogue Support',
  'Conflict Resolution or Mediation',
  'Support with conflicts during planning or decision-making',
  'Community Building Circles',
  'Restorative Circles or Restorative Conversations',
  'Other',
] as const

// Phone validation
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required.')
  .refine(
    (val) => {
      const digits = stripPhoneNumber(val)
      return digits.length === 10
    },
    { message: 'Please enter a valid 10-digit phone number.' },
  )
  .refine((val) => phoneRegex.test(val) || stripPhoneNumber(val).length === 10, {
    message: 'Phone number format: (XXX) XXX-XXXX',
  })

const facilitationSchema = z
  .object({
    // Contact Information
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z.string().email('Please enter a valid email.'),
    phone: phoneSchema,

    // Organization Information
    organizationName: z.string().optional().or(z.literal('')),
    organizationType: z.enum(organizationTypes),
    organizationTypeOther: z.string().optional().or(z.literal('')),
    groupSize: z
      .union([
        z.number().int().min(1, 'Must be at least 1'),
        z.string().regex(/^\d+$/, 'Enter a number'),
      ])
      .optional()
      .transform((val) => (typeof val === 'string' ? (val ? Number(val) : undefined) : val)),

    // Request Details
    supports: z.array(z.enum(supportOptions)).min(1, 'Select at least one support option.'),
    supportsOther: z.string().optional().or(z.literal('')),
    requestedDate: z.date().optional(),
    description: z
      .string()
      .min(1, 'Please tell us about your group and what you’d like support with.'),
    heardAbout: z.enum(['Referral', 'Website', 'Social Media', 'Previous MCRC service', 'Other']),
    heardAboutOther: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) =>
      data.organizationType !== 'Other' ? true : Boolean(data.organizationTypeOther?.trim()),
    { path: ['organizationTypeOther'], message: 'Please specify your organization type.' },
  )
  .refine(
    (data) => (data.supports.includes('Other') ? Boolean(data.supportsOther?.trim()) : true),
    {
      path: ['supportsOther'],
      message: 'Please describe the “Other” support you need.',
    },
  )
  .refine((data) => (data.heardAbout !== 'Other' ? true : Boolean(data.heardAboutOther?.trim())), {
    path: ['heardAboutOther'],
    message: 'Please specify how you heard about us.',
  })

type FacilitationValues = z.infer<typeof facilitationSchema>

// ---------------- Step Configuration ----------------
const STEP_TITLES = [
  'Section 1: Contact Information',
  'Section 2: Organization Information',
  'Section 3: Request Details',
  'Submitted',
] as const

const STEP_FIELDS: Array<(keyof FacilitationValues)[]> = [
  ['firstName', 'lastName', 'email', 'phone'],
  ['organizationName', 'organizationType', 'organizationTypeOther', 'groupSize'],
  ['supports', 'supportsOther', 'requestedDate', 'description', 'heardAbout', 'heardAboutOther'],
]

export function GroupFacilitationInquiryForm() {
  const TOTAL_STEPS = STEP_TITLES.length
  const [currentStep, setCurrentStep] = React.useState(0)

  const { isSubmitting, error, submitData } = useFirestoreFormSubmit(
    'forms/groupFacilitationInquiry/submissions',
  )

  const form = useForm<FacilitationValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(facilitationSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organizationName: '',
      organizationType: undefined as unknown as FacilitationValues['organizationType'],
      organizationTypeOther: '',
      groupSize: undefined,
      supports: [],
      supportsOther: '',
      requestedDate: undefined,
      description: '',
      heardAbout: undefined as unknown as FacilitationValues['heardAbout'],
      heardAboutOther: '',
    },
    mode: 'onChange', // Changed from 'onTouched' for real-time validation
  })

  // Auto-save form data
  const { clearSavedData, hasSavedData } = useFormAutoSave(form, 'group-facilitation-inquiry')

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1))

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const isStepValid = await form.trigger(fields as (keyof FacilitationValues)[], {
      shouldFocus: true,
    })
    if (isStepValid) setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }

  async function onSubmit(data: FacilitationValues) {
    const okay = await form.trigger(STEP_FIELDS[currentStep] as (keyof FacilitationValues)[], {
      shouldFocus: true,
    })
    if (!okay) return

    await submitData(data)

    setTimeout(() => {
      if (form.formState.isSubmitSuccessful && !error) {
        clearSavedData() // Clear auto-saved data on successful submission
        toast.success(
          "Thank you! Your facilitation inquiry was submitted. We'll follow up shortly.",
        )
        setCurrentStep(TOTAL_STEPS - 1)
      }
    }, 0)
  }

  const progressPct = ((currentStep + 1) / TOTAL_STEPS) * 100

  const control = form.control

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
              <CardDescription>
                Please provide information about who we should reach out to for facilitation
                coordination.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
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
                control={control}
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
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Phone number</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Organization Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Section 2: Organization Information</CardTitle>
              <CardDescription>
                Please tell us a little about your organization. This helps us understand your
                group, its size, and the community you serve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="(Optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="groupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of People in Your Group</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="e.g. 12"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            field.onChange(v === '' ? undefined : Number(v))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type of Organization</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {organizationTypes.map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    {form.watch('organizationType') === 'Other' && (
                      <div className="pt-2">
                        <Input
                          placeholder="Please specify"
                          value={form.watch('organizationTypeOther') ?? ''}
                          onChange={(e) =>
                            form.setValue('organizationTypeOther', e.target.value, {
                              shouldValidate: true,
                            })
                          }
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Request Details */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Section 3: Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="supports"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      What type of support are you looking for? (Check all that apply)
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {supportOptions.map((option) => {
                        const checked = form.watch('supports')?.includes(option) ?? false
                        return (
                          <FormItem key={option} className="flex items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  const current = form.getValues('supports') ?? []
                                  const isChecked = Boolean(next)
                                  const updated = isChecked
                                    ? Array.from(new Set([...current, option]))
                                    : current.filter((v: string) => v !== option)
                                  form.setValue('supports', updated, { shouldValidate: true })
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
                    {form.watch('supports')?.includes('Other') && (
                      <div className="pt-2">
                        <Input
                          placeholder="Please describe"
                          value={form.watch('supportsOther') ?? ''}
                          onChange={(e) =>
                            form.setValue('supportsOther', e.target.value, { shouldValidate: true })
                          }
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Requested Service Date (if known)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
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
                      You can leave this blank if you’re not sure yet.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tell us a little about your group and what you’d like support with
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heardAbout"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How did you hear about MCRC’s facilitation services?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {[
                          'Referral',
                          'Website',
                          'Social Media',
                          'Previous MCRC service',
                          'Other',
                        ].map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    {form.watch('heardAbout') === 'Other' && (
                      <div className="pt-2">
                        <Input
                          placeholder="Please specify"
                          value={form.watch('heardAboutOther') ?? ''}
                          onChange={(e) =>
                            form.setValue('heardAboutOther', e.target.value, {
                              shouldValidate: true,
                            })
                          }
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Success */}
        {currentStep === TOTAL_STEPS - 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Submitted</CardTitle>
              <CardDescription>We received your request.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 font-semibold">
                Thank you! Your facilitation inquiry was submitted. We&apos;ll follow up shortly.
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
          {hasSavedData() && !isSubmitting && !error && (
            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
                Your progress has been saved automatically.
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
                      'Submit Inquiry'
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
                  Start another inquiry
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
