'use client'

import { useState } from 'react'
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
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  Share2,
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
import { Textarea } from '@/components/ui/textarea'
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
  emailMarketingConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to email marketing to proceed',
  }),
  amount: z.number().min(1, 'Donation amount must be at least $1.00'),
  frequency: z.enum(['one-time', 'monthly']),
  currency: z.string().default('USD').optional(),
})

type DonationFormValues = z.infer<typeof donationSchema>

const PRESET_AMOUNTS = [25, 50, 100, 250] as const

export default function DonatePage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
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

  const amount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0)
  const watchFrequency = form.watch('frequency')

  const handleAmountSelect = (presetAmount: number) => {
    setSelectedAmount(presetAmount)
    setCustomAmount('')
    form.setValue('amount', presetAmount)
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      form.setValue('amount', numValue)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger([
        'donorName',
        'donorEmail',
        'donorPhone',
        'emailMarketingConsent',
      ])
      if (isValid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      if (amount >= 1) {
        setCurrentStep(3)
      } else {
        toast.error('Please select or enter a donation amount')
      }
    } else if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)
    }
  }

  const getDonationData = (): DonationInput => {
    const values = form.getValues()
    return {
      donorName: values.donorName,
      donorEmail: values.donorEmail,
      donorPhone: values.donorPhone || undefined,
      emailMarketingConsent: values.emailMarketingConsent,
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
                src="/images/donate-placeholder.jpg"
                alt="Support Your Community"
                fill
                className="rounded-full border-4 border-primary/20 object-cover shadow-lg"
                priority
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Support Your Community
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Your gift helps MCRC provide free mediation, restorative justice, and conflict
              resolution training to families, neighbors, and community members in Howard County.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Donation Form */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
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
                              <Input type="tel" placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormDescription>
                              We'll only use this to contact you about your donation if needed.
                            </FormDescription>
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
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Email Marketing Consent *</FormLabel>
                              <FormDescription>
                                I consent to receive email updates about MCRC's programs and impact.
                                You can unsubscribe at any time.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="button" onClick={handleNext}>
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Giving Level */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Select an Amount</h3>
                        <ToggleGroup
                          type="single"
                          value={selectedAmount?.toString()}
                          onValueChange={(value) => {
                            if (value) handleAmountSelect(parseFloat(value))
                          }}
                          className="flex-wrap gap-3"
                        >
                          {PRESET_AMOUNTS.map((preset) => (
                            <ToggleGroupItem
                              key={preset}
                              value={preset.toString()}
                              aria-label={`Donate $${preset}`}
                              className="min-w-[100px]"
                            >
                              ${preset}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="custom-amount" className="text-sm font-medium">
                          Or enter a custom amount
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            id="custom-amount"
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Minimum donation: $1.00</p>
                      </div>
                      {amount >= 1 && (
                        <div className="rounded-lg border bg-accent/5 p-4">
                          <p className="text-sm text-muted-foreground">Your donation:</p>
                          <p className="text-2xl font-bold text-foreground">
                            {formatPaymentAmount(amount, 'USD')}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="button" onClick={handleNext} disabled={amount < 1}>
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Frequency */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Donation Frequency</h3>
                        <ToggleGroup
                          type="single"
                          value={watchFrequency}
                          onValueChange={(value) => {
                            if (value === 'one-time' || value === 'monthly') {
                              form.setValue('frequency', value)
                            }
                          }}
                          className="flex-wrap gap-3"
                        >
                          <ToggleGroupItem
                            value="one-time"
                            aria-label="One-time donation"
                            className="min-w-[150px]"
                          >
                            One-Time
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="monthly"
                            aria-label="Monthly donation (coming soon)"
                            disabled
                            className="min-w-[150px] opacity-50 cursor-not-allowed"
                          >
                            Monthly{' '}
                            <Badge variant="secondary" className="ml-2">
                              Coming Soon
                            </Badge>
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <p className="text-sm text-muted-foreground mt-2">
                          Monthly recurring donations will be available soon. Thank you for your
                          patience!
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button type="button" onClick={handleNext}>
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
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{form.watch('donorName')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{form.watch('donorEmail')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">
                              {formatPaymentAmount(amount, 'USD')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frequency:</span>
                            <span className="font-medium capitalize">{watchFrequency}</span>
                          </div>
                        </div>
                      </div>
                      <DonationPayPalButton amount={amount} donationData={getDonationData()} />
                      <div className="flex justify-start">
                        <Button type="button" variant="outline" onClick={handleBack}>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                "MCRC helped our family navigate a difficult situation with compassion and
                professionalism. Their free services made all the difference when we needed it
                most."
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
                We're here to help. Contact us with any questions about donations or giving.
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
