'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { handlePhoneInputChange, handlePhoneKeyPress } from '@/utilities/phoneUtils'
import { useFormAutoSave } from '@/hooks/useFormAutoSave'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

// shadcn/ui
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { requestFormConfirmationEmail } from '@/lib/form-confirmation-client'
import { submitRestorativeReferralFormAction } from '@/lib/actions/public-form-actions'
import {
  restorativeOrgOptions,
  restorativeProgramReferralFormSchema,
  restorativeServiceOptions,
  restorativeUrgencyOptions,
  type RestorativeProgramReferralFormValues,
} from '@/Forms/schema/restorative-program-referral-form'

// ---------------- Step Configuration ----------------
const STEP_TITLES = [
  'Section 1: Person/Agency Making the Referral',
  'Section 2: Person / Youth Being Referred',
  'Section 3: Restorative Need / Incident Information',
  'Section 4: Urgency & Follow-up',
  'Submitted',
] as const

const STEP_FIELDS: Array<(keyof RestorativeProgramReferralFormValues)[]> = [
  [
    'referrerName',
    'referrerEmail',
    'referrerPhone',
    'referrerOrg',
    'referrerRole',
    'referrerPreferredContact',
  ],
  [
    'participantName',
    'participantDob',
    'participantPronouns',
    'participantSchool',
    'participantPhone',
    'participantEmail',
    'parentGuardianName',
    'parentGuardianPhone',
    'parentGuardianEmail',
    'participantBestTime',
  ],
  [
    'incidentDate',
    'incidentLocation',
    'incidentDescription',
    'otherParties',
    'reasonReferral',
    'serviceRequested',
    'safetyConcerns',
    'currentDiscipline',
  ],
  ['urgency', 'additionalNotes'],
]

export function RestorativeProgramReferralForm() {
  const TOTAL_STEPS = STEP_TITLES.length
  const [currentStep, setCurrentStep] = React.useState(0)
  const router = useRouter()
  const SERVICE_AREA_SLUG = 'restorative-practices'
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submissionError, setSubmissionError] = React.useState<string | null>(null)

  const form = useForm<RestorativeProgramReferralFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(restorativeProgramReferralFormSchema) as any,
    defaultValues: {
      // Referrer
      referrerName: '',
      referrerEmail: '',
      referrerPhone: '',
      referrerOrg: '',
      referrerRole: '',
      referrerPreferredContact: '',
      // Participant
      participantName: '',
      participantDob: undefined,
      participantPronouns: '',
      participantSchool: '',
      participantPhone: '',
      participantEmail: '',
      parentGuardianName: '',
      parentGuardianPhone: '',
      parentGuardianEmail: '',
      participantBestTime: '',
      // Incident
      incidentDate: undefined,
      incidentLocation: '',
      incidentDescription: '',
      otherParties: '',
      reasonReferral: '',
      serviceRequested: '',
      safetyConcerns: '',
      currentDiscipline: '',
      // Urgency
      urgency: '',
      additionalNotes: '',
    },
    mode: 'onChange', // Changed from 'onTouched' for real-time validation
  })

  // Auto-save form data
  const { clearSavedData, hasSavedData: _hasSavedData } = useFormAutoSave(form, 'restorative-program-referral')

  const goBack = () => setCurrentStep((s) => Math.max(0, s - 1))

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep]
    const isStepValid = await form.trigger(fields as (keyof RestorativeProgramReferralFormValues)[], {
      shouldFocus: true,
    })
    if (isStepValid) setCurrentStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }

  async function onSubmit(data: RestorativeProgramReferralFormValues) {
    const okay = await form.trigger(
      STEP_FIELDS[currentStep] as (keyof RestorativeProgramReferralFormValues)[],
      {
        shouldFocus: true,
      },
    )
    if (!okay) return

    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const result = await submitRestorativeReferralFormAction(data)
      if (!result.success || !result.inquiryId) {
        throw new Error(result.error ?? 'Unable to submit your referral right now.')
      }

      // Insightly sync runs asynchronously (Firestore trigger). Status is visible in the CMS inquiry page.
      console.log('[RestorativeProgramReferralForm] Insightly sync queued (async)')

      const displayName = data.referrerName || data.participantName
      void requestFormConfirmationEmail({
        to: data.referrerEmail,
        name: displayName,
        formName: 'Restorative Program Referral',
        summary:
          'We received your restorative referral and will connect with you shortly to review details and discuss next steps.',
      })

      router.push(
        `/getting-started/thank-you?serviceArea=${SERVICE_AREA_SLUG}&inquiryId=${result.inquiryId}`,
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit your referral right now.'
      setSubmissionError(message)
    } finally {
      setIsSubmitting(false)
    }
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

        {/* STEP 1: Referrer */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Person/Agency Making the Referral</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="referrerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name (person making referral) *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referrerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referrerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your phone</FormLabel>
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

              <FormField
                control={form.control}
                name="referrerRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your role / position</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referrerOrg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referring agency / organization</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-3"
                      >
                        {restorativeOrgOptions.map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referrerPreferredContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred contact method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-3"
                      >
                        {['email', 'phone-call', 'text'].map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Participant */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>2. Person / Youth Being Referred</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="participantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of person/youth being referred *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participantDob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of birth (if known)</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="participantPronouns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pronouns</FormLabel>
                      <FormControl>
                        <Input placeholder="she/her, he/him, they/them, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="participantSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School / program / organization</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="participantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participant phone (if appropriate)</FormLabel>
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
                <FormField
                  control={form.control}
                  name="participantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participant email (if appropriate)</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="parentGuardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/guardian name (if youth)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentGuardianPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/guardian phone</FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="parentGuardianEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/guardian email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="participantBestTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Best time/way to contact the family/participant</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. afternoons, email only, text first, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Incident */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Restorative Need / Incident Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of incident (if known)</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incidentLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location of incident</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="incidentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief description of the situation / harm *</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherParties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Other person(s) involved (names, roles, contact if you have it)
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasonReferral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why are you referring this to MCRC’s restorative program?</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="e.g. relationship repair, re-entry, accountability, classroom/community impact, ongoing conflict"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restorative service you think is needed</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        {restorativeServiceOptions.map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="safetyConcerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Safety, confidentiality, or accessibility concerns we should know about
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="e.g. no joint meeting yet, trauma, language access, interpreter needed, ADA needs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentDiscipline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Is there any current discipline / school / court action related to this?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="e.g. suspension pending, admin review, restorative alternative being requested"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Urgency */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>4. Urgency & Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How urgent is this referral?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-3"
                      >
                        {restorativeUrgencyOptions.map((opt) => (
                          <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional context for MCRC staff</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Success */}
        {currentStep === TOTAL_STEPS - 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Submitted</CardTitle>
              <CardDescription>We received your referral.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 font-semibold">
                Thank you! Your referral was submitted. We’ll follow up shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer: status + nav buttons */}
        <div className="flex flex-col gap-3">
          {submissionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>
                {submissionError}. Please try again or contact us if the problem persists.
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
                      'Submit Referral'
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
                  Start another referral
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
