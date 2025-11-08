'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AddressAutocomplete } from '@/components/Forms/AddressAutocomplete'

// Define Zod schemas for each step of the form
const stepOneSchema = z.object({
  prefix: z.string().optional(),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Please enter a valid email address.'),
  preferredContact: z.enum(['Email', 'Phone', 'Either is fine'], {
    required_error: 'Please select a preferred contact method.',
  }),
  canLeaveVoicemail: z.enum(['Yes', 'No'], {
    required_error: 'This field is required.',
  }),
  canText: z.enum(['Yes', 'No'], { required_error: 'This field is required.' }),
  streetAddress: z.string().min(1, 'Street address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  zipCode: z.string().min(1, 'Zip code is required.'),
  howDidYouHear: z.string().min(1, 'This field is required.'),
})

const stepTwoSchema = z.object({
  whatBringsYou: z.string().min(1, 'This field is required.'),
  isCourtOrdered: z.enum(['Yes', 'No'], {
    required_error: 'This field is required.',
  }),
})

const stepThreeSchema = z.object({
  otherPartyFirstName: z.string().optional(),
  otherPartyLastName: z.string().optional(),
  otherPartyPhone: z.string().optional(),
  otherPartyEmail: z
    .string()
    .email({ message: 'Please enter a valid email.' })
    .optional()
    .or(z.literal('')),
})

const stepFourSchema = z.object({
  deadline: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  anythingElse: z.string().optional(),
})

// Combine schemas
const formSchema = stepOneSchema.merge(stepTwoSchema).merge(stepThreeSchema).merge(stepFourSchema)

// THE FIX: Define field names for each step to ensure type safety
const stepOneFields = Object.keys(stepOneSchema.shape) as (keyof z.infer<typeof stepOneSchema>)[]
const stepTwoFields = Object.keys(stepTwoSchema.shape) as (keyof z.infer<typeof stepTwoSchema>)[]
const stepThreeFields = Object.keys(stepThreeSchema.shape) as (keyof z.infer<
  typeof stepThreeSchema
>)[]
const stepFourFields = Object.keys(stepFourSchema.shape) as (keyof z.infer<typeof stepFourSchema>)[]

export function MediationForm() {
  const [step, setStep] = useState(0)
  const totalSteps = 4

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
    mode: 'onTouched',
  })

  const { handleSubmit, control, trigger, reset } = form

  const processForm = async (formData: z.infer<typeof formSchema>) => {
    // This is where you'll send the data to your API
    console.log('Form data to be submitted:', formData)
    try {
      const response = await fetch('/api/submit-service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: 'Mediation',
          formData: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('There was a problem submitting your request.')
      }

      toast.success('Mediation request successfully submitted!')
      setStep(0)
      reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
    }
  }

  const handleNext = async () => {
    let isValid = false
    if (step === 0) isValid = await trigger(stepOneFields)
    if (step === 1) isValid = await trigger(stepTwoFields)
    if (step === 2) isValid = await trigger(stepThreeFields)
    // Step 3 is the last step with fields to validate before submission
    if (step === 3) isValid = await trigger(stepFourFields)

    if (isValid && step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-16">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-2 w-full rounded-full',
              index <= step ? 'bg-primary' : 'bg-primary/20',
            )}
          />
        ))}
      </div>
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={handleSubmit(processForm)}>
            {step === 0 && (
              <>
                <CardHeader>
                  <CardTitle>Section 1: Contact Information</CardTitle>
                  <CardDescription>
                    Please provide your contact details so we can get in touch with you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prefix</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a prefix" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Rev.">Rev.</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div /> {/* Spacer */}
                  <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AddressAutocomplete
                    form={form}
                    streetAddressFieldName="streetAddress"
                    cityFieldName="city"
                    stateFieldName="state"
                    zipCodeFieldName="zipCode"
                    streetAddressLabel="Street Address"
                    cityLabel="City"
                    stateLabel="State"
                    zipCodeLabel="Zip Code"
                    streetAddressDescription="Our services are free for people who live or work in Howard County. Start typing your address for autocomplete suggestions."
                    disabled={form.formState.isSubmitting}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  />
                  <FormField
                    control={control}
                    name="preferredContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Phone">Phone</SelectItem>
                            <SelectItem value="Either is fine">Either is fine</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="canLeaveVoicemail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Can we leave a voicemail? *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="No" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="canText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Can we text you? *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="No" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="howDidYouHear"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>How did you hear about us? *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Community event or outreach">
                              Community event or outreach
                            </SelectItem>
                            <SelectItem value="Friend or family / Word of mouth">
                              Friend or family / Word of mouth
                            </SelectItem>
                            <SelectItem value="Referred by Howard County Court">
                              Referred by Howard County Court
                            </SelectItem>
                            <SelectItem value="Internet search">
                              Internet search (e.g., Google, Bing)
                            </SelectItem>
                            <SelectItem value="Referred by an organization or agency">
                              Referred by an organization or agency
                            </SelectItem>
                            <SelectItem value="I’ve used your services before">
                              I’ve used your services before
                            </SelectItem>
                            <SelectItem value="Social Media">
                              Social Media (e.g. Facebook or Instagram)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </>
            )}

            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Section 2: Conflict Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="whatBringsYou"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What brings you to seek mediation right now? *</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Feel free to briefly share what’s been happening, what the concern is, and who’s been involved..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="isCourtOrdered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Are you reaching out as part of a court order or legal process? *
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="Yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="No" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Section 3: Other Participants</CardTitle>
                  <CardDescription>
                    {/* THE FIX: Escaped apostrophe */}
                    Please share the names of others involved and you&apos;re hoping will join the
                    mediation process.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <h3 className="text-md col-span-full font-semibold">Contact One</h3>
                  <FormField
                    control={control}
                    name="otherPartyFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="otherPartyLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="otherPartyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="otherPartyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Section 4: Scheduling & Needs</CardTitle>
                  <CardDescription>
                    {/* THE FIX: Escaped apostrophe */}
                    After you submit, you&apos;ll get a link to schedule a follow-up call.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Is there a specific date or deadline you’re working with?
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Leave blank if none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="accessibilityNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Do you have any accessibility needs or language preferences?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="We’ll do our best to accommodate you."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="anythingElse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is there anything else you&apos;d like us to know?</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </>
            )}

            <CardContent className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
                Back
              </Button>
              {step < totalSteps - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              )}
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  )
}
