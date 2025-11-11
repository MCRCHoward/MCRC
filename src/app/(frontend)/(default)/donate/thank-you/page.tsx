import Link from 'next/link'
import { Timestamp } from 'firebase-admin/firestore'

import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, Share2, Users, ArrowRight, Mail } from 'lucide-react'
import { getServerSideURL } from '@/utilities/getURL'
import { formatPaymentAmount } from '@/utilities/payment-helpers'

interface ThankYouPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

interface DonationDocument {
  amount?: number
  currency?: string
  frequency?: string
  donorName?: string
  donorEmail?: string
  donorPhone?: string
  emailMarketingConsent?: boolean
  paymentId?: string
  paymentStatus?: string
  paymentDate?: string
  donationDate?: string
  notes?: string
  createdAt?: Timestamp | string
  updatedAt?: Timestamp | string
}

interface DonationViewModel {
  id: string
  amount: number
  currency: string
  frequency: 'one-time' | 'monthly'
  donorName: string
  donorEmail: string
  donorPhone?: string
  emailMarketingConsent: boolean
  paymentId: string
  paymentStatus: string
  paymentDate?: string
  donationDate?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

function toISOString(value?: Timestamp | string | null): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  try {
    return value.toDate().toISOString()
  } catch {
    return undefined
  }
}

async function getDonationById(donationId: string): Promise<DonationViewModel | null> {
  try {
    const snapshot = await adminDb.doc(`donations/${donationId}`).get()

    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data() as DonationDocument | undefined

    if (!data || typeof data.amount !== 'number' || data.amount <= 0) {
      return null
    }

    const frequency = data.frequency === 'monthly' ? 'monthly' : 'one-time'

    return {
      id: donationId,
      amount: data.amount,
      currency: data.currency || 'USD',
      frequency,
      donorName: data.donorName?.trim() || 'Friend of MCRC',
      donorEmail: data.donorEmail || '',
      donorPhone: data.donorPhone,
      emailMarketingConsent: Boolean(data.emailMarketingConsent),
      paymentId: data.paymentId || '',
      paymentStatus: data.paymentStatus || 'completed',
      paymentDate: data.paymentDate || toISOString(data.createdAt) || toISOString(data.updatedAt),
      donationDate: data.donationDate || data.paymentDate || toISOString(data.createdAt) || toISOString(data.updatedAt),
      notes: data.notes,
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
    }
  } catch (error) {
    console.error('[donation/thank-you] Failed to load donation', error)
    return null
  }
}

function buildShareLinks() {
  const baseUrl = getServerSideURL()
  const donateUrl = `${baseUrl.replace(/\/$/, '')}/donate`
  const encodedUrl = encodeURIComponent(donateUrl)
  const encodedText = encodeURIComponent('I just supported MCRC! Join me in powering mediation and restorative justice in our community.')

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedText}`,
  }
}

export default async function ThankYouPage(props: ThankYouPageProps) {
  const searchParams = await props.searchParams
  const donationIdParam = searchParams.id
  const donationId = Array.isArray(donationIdParam) ? donationIdParam[0] : donationIdParam

  if (!donationId) {
    return <MissingDonationState />
  }

  const donation = await getDonationById(donationId)

  if (!donation) {
    return <MissingDonationState />
  }

  const formattedAmount = formatPaymentAmount(donation.amount, donation.currency)
  const frequencyLabel = donation.frequency === 'monthly' ? 'Monthly Supporter' : 'One-Time Gift'
  const shareLinks = buildShareLinks()

  return (
    <main className="min-h-screen bg-muted">
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <Badge className="mx-auto w-fit gap-2 py-1.5 px-4 text-sm">
                <Heart className="h-4 w-4" /> Your generosity matters
              </Badge>
              <CardTitle className="text-3xl md:text-4xl">
                Thank you, {donation.donorName.split(' ')[0]}!
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                Your {frequencyLabel.toLowerCase()} of <span className="font-semibold text-foreground">{formattedAmount}</span>{' '}
                powers free mediation, restorative justice, and conflict resolution training throughout Howard County.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border bg-accent/5 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Donation Summary</h3>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd className="font-semibold text-foreground">{formattedAmount}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Frequency</dt>
                      <dd className="font-semibold text-foreground">{frequencyLabel}</dd>
                    </div>
                    {donation.donationDate && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Gift Date</dt>
                        <dd>{new Date(donation.donationDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</dd>
                      </div>
                    )}
                    {donation.paymentId && (
                      <div className="flex items-center justify-between text-xs">
                        <dt className="text-muted-foreground">Transaction ID</dt>
                        <dd className="font-mono">{donation.paymentId}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="rounded-lg border p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Receipt & Questions</h3>
                  <p className="mt-4 text-sm text-muted-foreground">
                    A confirmation email has been sent to <span className="font-medium text-foreground">{donation.donorEmail || 'your inbox'}</span>.
                    Keep it for your records. If you have any questions, our team is ready to help.
                  </p>
                  <Button asChild variant="outline" className="mt-4 w-full gap-2">
                    <a href="mailto:info@mcrchoward.org">
                      <Mail className="h-4 w-4" /> Contact our team
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="flex h-full flex-col justify-between gap-4 pt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Help Us Spread the Word</h3>
                      <p className="text-sm text-muted-foreground">
                        Your story inspires others to act. Share why you support MCRC and invite friends to join you.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline" className="flex-1 min-w-[150px] gap-2">
                        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Share2 className="h-4 w-4" /> Share on Facebook
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 min-w-[150px] gap-2">
                        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Share2 className="h-4 w-4" /> Share on X
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1 min-w-[150px] gap-2">
                        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Share2 className="h-4 w-4" /> Share on LinkedIn
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex h-full flex-col justify-between gap-4 pt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Double Your Impact</h3>
                      <p className="text-sm text-muted-foreground">
                        Explore volunteer opportunities, host a community conversation, or invite your workplace to partner with us.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button asChild className="flex-1 gap-2">
                        <Link href="/volunteer">
                          <Users className="h-4 w-4" /> Become a volunteer
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1 gap-2">
                        <Link href="/donate">
                          <ArrowRight className="h-4 w-4" /> Make another gift
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="rounded-lg border bg-background p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Your Gift Creates Ripple Effects</h3>
                <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
                  Because of you, neighbors will resolve conflicts peacefully, young people will learn restorative practices, and families will find healing pathways forward. Thank you for believing in community-led solutions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function MissingDonationState() {
  return (
    <main className="min-h-screen bg-muted">
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">We can’t find that donation</CardTitle>
              <CardDescription>
                Your donation confirmation may have expired or the link is invalid. If you reached this page in error, please contact us and we’ll be happy to help.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
                Have your confirmation email handy when you reach out—it helps us locate your gift quickly.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/donate">Return to Donate Page</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href="mailto:info@mcrchoward.org">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
