'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Heart,
  Users,
  GraduationCap,
  Handshake,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Edit2,
  X,
  Info,
  Check,
  TrendingUp,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { DonationPayPalButton } from '@/components/payments/DonationPayPalButton'
import type { DonationInput } from '@/types/donation'
import { formatPaymentAmount } from '@/utilities/payment-helpers'

// Form schema
const donationSchema = z.object({
  donorName: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  donorEmail: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  donorPhone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-()\+]+$/.test(val),
      'Phone number can only contain digits, spaces, dashes, parentheses, and plus sign',
    ),
  emailMarketingConsent: z.boolean().default(false),
  amount: z.number().min(1, 'Donation amount must be at least $1.00'),
  frequency: z.enum(['one-time', 'monthly']),
  currency: z.string().default('USD').optional(),
})

type DonationFormValues = z.infer<typeof donationSchema>

const PRESET_AMOUNTS = [25, 50, 100, 250] as const

// Impact messages for each donation amount
const IMPACT_MESSAGES: Record<number, string> = {
  25: 'Provides 1 hour of family mediation services',
  50: 'Helps train 1 volunteer mediator',
  100: 'Supports 2 complete mediation sessions',
  250: 'Funds a full day of restorative justice programs',
}

// Donation tiers
const DONATION_TIERS = {
  friend: { min: 25, max: 49, label: 'Friend', icon: Heart },
  supporter: { min: 50, max: 99, label: 'Supporter', icon: Users },
  champion: { min: 100, max: 249, label: 'Champion', icon: TrendingUp },
  benefactor: { min: 250, max: Infinity, label: 'Benefactor', icon: GraduationCap },
}

// Helper function to format phone numbers
const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}

// Helper function to get donation tier
const getDonationTier = (amount: number) => {
  for (const [key, tier] of Object.entries(DONATION_TIERS)) {
    if (amount >= tier.min && amount <= tier.max) {
      return { key, ...tier }
    }
  }
  return null
}

// Helper function to get impact message
const getImpactMessage = (amount: number): string => {
  if (IMPACT_MESSAGES[amount]) return IMPACT_MESSAGES[amount]
  if (amount >= 250)
    return `Funds ${Math.floor(amount / 250)} full days of restorative justice programs`
  if (amount >= 100) return `Supports ${Math.floor(amount / 50)} complete mediation sessions`
  if (amount >= 50) return `Helps train volunteer mediators and support programs`
  if (amount >= 25) return `Provides mediation services to families in need`
  return 'Every dollar makes a difference in our community'
}

export default function DonatePage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustomAmount, setIsCustomAmount] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      emailMarketingConsent: false,
      amount: 0,
      frequency: 'one-time',
      currency: 'USD',
    },
  })

  const amount = form.watch('amount') || 0
  const watchFrequency = form.watch('frequency')
  const donorName = form.watch('donorName') || ''
  const donorEmail = form.watch('donorEmail') || ''

  // Simplified amount selection - use form state as single source
  const handleAmountSelect = (presetAmount: number) => {
    setIsCustomAmount(false)
    setCustomAmount('')
    form.setValue('amount', presetAmount, { shouldValidate: true })
  }

  const handleCustomAmountChange = (value: string) => {
    setIsCustomAmount(true)
    setCustomAmount(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      form.setValue('amount', numValue, { shouldValidate: true })
    } else if (value === '') {
      form.setValue('amount', 0)
    }
  }

  const clearCustomAmount = () => {
    setCustomAmount('')
    setIsCustomAmount(false)
    form.setValue('amount', 0)
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      if (currentStep === 1) {
        const isValid = await form.trigger(['donorName', 'donorEmail', 'donorPhone'])
        if (isValid) {
          setCurrentStep(2)
        }
      } else if (currentStep === 2) {
        const isValid = await form.trigger(['amount'])
        if (isValid && amount >= 1) {
          setCurrentStep(3)
        } else {
          toast.error('Please select or enter a donation amount of at least $1.00')
        }
      } else if (currentStep === 3) {
        setCurrentStep(4)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)
    }
  }

  const handleJumpToStep = (step: 1 | 2 | 3 | 4) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    form.setValue('donorPhone', formatted)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'TEXTAREA' && activeElement?.tagName !== 'BUTTON') {
          e.preventDefault()
          handleNext()
        }
      } else if (e.key === 'Escape') {
        if (currentStep > 1) {
          handleBack()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, amount])

  const getDonationData = (): DonationInput => {
    const values = form.getValues()
    return {
      donorName: values.donorName,
      donorEmail: values.donorEmail,
      donorPhone: values.donorPhone || undefined,
      emailMarketingConsent: values.emailMarketingConsent || false,
      amount: amount,
      frequency: values.frequency,
      currency: values.currency || 'USD',
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Section 1: Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative w-32 h-32">
              <Image
                src="/images/community-hands.jpg"
                alt="Community members working together in mediation"
                fill
                className="rounded-full border-4 border-primary/20 object-cover shadow-lg"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/donate-placeholder.jpg'
                }}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Support Your Community
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Your gift helps MCRC provide free mediation, restorative justice, and conflict
              resolution training to families, neighbors, and community members in Howard County.
            </p>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-2xl mt-8">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <div className="text-2xl md:text-3xl font-bold text-primary">127+</div>
                <div className="text-xs md:text-sm text-muted-foreground">Donors This Year</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <div className="text-2xl md:text-3xl font-bold text-primary">$75</div>
                <div className="text-xs md:text-sm text-muted-foreground">Average Gift</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                <div className="text-2xl md:text-3xl font-bold text-primary">350+</div>
                <div className="text-xs md:text-sm text-muted-foreground">Families Served</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Donation Form */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { num: 1, label: 'Info', icon: Users },
                { num: 2, label: 'Amount', icon: Heart },
                { num: 3, label: 'Frequency', icon: TrendingUp },
                { num: 4, label: 'Payment', icon: Check },
              ].map((step, idx) => {
                const StepIcon = step.icon
                const isCompleted = currentStep > step.num
                const isCurrent = currentStep === step.num

                return (
                  <div key={step.num} className="flex items-center flex-1">
                    <button
                      onClick={() => isCompleted && handleJumpToStep(step.num as 1 | 2 | 3 | 4)}
                      disabled={!isCompleted}
                      className={`flex flex-col items-center ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent
                              ? 'bg-primary/20 text-primary border-2 border-primary'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                          <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 ${isCurrent ? 'font-semibold' : ''} hidden sm:block`}
                      >
                        {step.label}
                      </span>
                    </button>
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 md:mx-2 transition-all ${
                          isCompleted ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Make a Donation</CardTitle>
              <CardDescription>
                Step {currentStep} of 4: {currentStep === 1 && 'Your Information'}
                {currentStep === 2 && 'Giving Level'}
                {currentStep === 3 && 'Frequency'}
                {currentStep === 4 && 'Payment'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  {/* Step 1: User Info */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="donorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="donorEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="donorPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="(123) 456-7890"
                                {...field}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value)
                                  field.onChange(formatted)
                                }}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormDescription>
                              We&apos;ll only use this to contact you about your donation if needed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailMarketingConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal">
                                Keep me updated about MCRC&apos;s programs and impact
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Optional. You can unsubscribe at any time.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={isLoading}
                          className="min-w-[120px]"
                        >
                          {isLoading ? 'Validating...' : 'Continue'}{' '}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Giving Level */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Select an Amount</h3>
                          <Badge variant="secondary" className="text-xs">
                            Most donors give $75
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {PRESET_AMOUNTS.map((preset) => {
                            const isSelected = !isCustomAmount && amount === preset
                            const impact = IMPACT_MESSAGES[preset]
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleAmountSelect(preset)}
                                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all min-h-[120px] ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                                }`}
                              >
                                <span className="text-2xl font-bold mb-2">${preset}</span>
                                {impact && (
                                  <span className="text-xs text-center text-muted-foreground leading-tight">
                                    {impact}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="custom-amount" className="text-sm font-medium">
                          Or enter a custom amount
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            $
                          </div>
                          <Input
                            id="custom-amount"
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                            className={`pl-8 pr-10 text-lg ${isCustomAmount && amount >= 1 ? 'border-primary' : ''}`}
                          />
                          {customAmount && (
                            <button
                              type="button"
                              onClick={clearCustomAmount}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label="Clear custom amount"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum donation: $1.00</p>
                      </div>

                      {amount >= 1 && (
                        <>
                          <div className="rounded-lg border bg-accent/5 p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm text-muted-foreground">Your donation:</p>
                                <p className="text-2xl font-bold text-foreground">
                                  {formatPaymentAmount(amount, 'USD')}
                                </p>
                              </div>
                              {getDonationTier(amount) && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  {(() => {
                                    const tier = getDonationTier(amount)!
                                    const TierIcon = tier.icon
                                    return (
                                      <>
                                        <TierIcon className="w-3 h-3" />
                                        {tier.label}
                                      </>
                                    )
                                  })()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p>{getImpactMessage(amount)}</p>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          disabled={isLoading}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={amount < 1 || isLoading}
                          className="min-w-[120px]"
                        >
                          {isLoading ? 'Validating...' : 'Continue'}{' '}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Frequency */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Donation Frequency</h3>
                        <div className="rounded-lg border-2 border-primary bg-primary/5 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-lg">One-Time Donation</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Make a single donation of {formatPaymentAmount(amount, 'USD')}
                              </p>
                            </div>
                            <Check className="w-6 h-6 text-primary" />
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-4 mt-4">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium mb-1">Monthly Giving Coming Soon</p>
                              <p className="text-xs text-muted-foreground">
                                We&apos;re working on enabling recurring monthly donations. For now,
                                you can make a one-time gift and return to donate again anytime.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          disabled={isLoading}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={isLoading}
                          className="min-w-[120px]"
                        >
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Payment */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="rounded-lg border bg-accent/5 p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Donation Summary</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center group">
                            <span className="text-muted-foreground">Name:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{donorName}</span>
                              <button
                                type="button"
                                onClick={() => handleJumpToStep(1)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                aria-label="Edit name"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center group">
                            <span className="text-muted-foreground">Email:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium break-all">{donorEmail}</span>
                              <button
                                type="button"
                                onClick={() => handleJumpToStep(1)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                aria-label="Edit email"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center group">
                            <span className="text-muted-foreground">Amount:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatPaymentAmount(amount, 'USD')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleJumpToStep(2)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                                aria-label="Edit amount"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Frequency:</span>
                            <span className="font-medium capitalize">{watchFrequency}</span>
                          </div>
                        </div>
                      </div>

                      {/* Thank You Preview */}
                      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm space-y-2">
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              What happens next?
                            </p>
                            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                  You&apos;ll receive a tax receipt via email within 24 hours
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Your payment is processed securely through PayPal</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Questions? Contact us at info@mcrchoward.org</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <DonationPayPalButton amount={amount} donationData={getDonationData()} />
                      <div className="flex justify-start">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleBack}
                          disabled={isLoading}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Impact Justification */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8">Where Your Money Goes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Free Mediation Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Support free conflict resolution services for families and neighbors in Howard
                  County.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <GraduationCap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Training Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fund restorative justice and conflict resolution training for community members.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Handshake className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community Building</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enable community circles and dialogue programs that strengthen neighborhoods.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Restorative Justice</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Support programs that help repair harm and restore relationships in our community.
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <blockquote className="text-lg italic text-foreground">
                &quot;MCRC helped our family navigate a difficult situation with compassion and
                professionalism. Their free services made all the difference when we needed it
                most.&quot;
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">
                — Community Member, Howard County
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Alternatives */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">Other Ways to Support</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Become a Volunteer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Share your time and skills to help build a more peaceful community.
                </p>
                <Button asChild>
                  <Link href="/volunteer">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>In-Kind Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Interested in making an in-kind donation? Contact us to discuss how you can
                  contribute.
                </p>
                <Button asChild variant="outline">
                  <a href="mailto:info@mcrchoward.org">
                    <Mail className="mr-2 h-4 w-4" /> Contact Us
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 5: Trust & Legal */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6 text-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">501(c)(3) Tax-Exempt Organization</h3>
              <p className="text-sm text-muted-foreground">
                MCRC is a registered 501(c)(3) nonprofit organization. Your donation may be
                tax-deductible to the full extent allowed by law.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-2">Privacy & Security</h3>
              <p className="text-sm text-muted-foreground">
                Your personal information is secure and will never be shared with third parties. All
                payments are processed securely through PayPal.
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="text-xl font-semibold mb-2">Questions About Giving?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;re here to help. Contact us with any questions about donations or giving.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline">
                  <a href="mailto:info@mcrchoward.org">
                    <Mail className="mr-2 h-4 w-4" /> Email Us
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:+14101234567">
                    <Phone className="mr-2 h-4 w-4" /> Call Us
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
