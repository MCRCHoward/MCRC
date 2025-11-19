import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, CheckCircle2, Mail, Phone } from 'lucide-react'
import { getCalendlyLink } from '@/lib/actions/calendly-actions'
import { CalendlyWidget } from '@/components/CalendlyWidget'
import Link from 'next/link'

interface ThankYouPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ThankYouPage(props: ThankYouPageProps) {
  const searchParams = await props.searchParams
  const serviceAreaParam = searchParams.serviceArea
  const inquiryIdParam = searchParams.inquiryId

  const serviceArea = Array.isArray(serviceAreaParam) ? serviceAreaParam[0] : serviceAreaParam
  const inquiryId = Array.isArray(inquiryIdParam) ? inquiryIdParam[0] : inquiryIdParam

  if (!serviceArea || !inquiryId) {
    return <MissingParamsState />
  }

  try {
    const { calendlyUrl, participantName } = await getCalendlyLink(inquiryId, serviceArea)

    const firstName = participantName.split(' ')[0] || participantName

    return (
      <main className="min-h-screen bg-muted">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <Card className="shadow-lg">
              <CardHeader className="space-y-4 text-center">
                <Badge className="mx-auto w-fit gap-2 py-1.5 px-4 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Form submitted successfully
                </Badge>
                <CardTitle className="text-3xl md:text-4xl">
                  Thank you, {firstName}!
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  We&apos;ve received your inquiry and our team will be in touch soon. Please schedule
                  your intake call below to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Calendly Widget */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Schedule Your Intake Call
                      </CardTitle>
                      <CardDescription>
                        Choose a time that works best for you. The call will take about 30 minutes.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CalendlyWidget calendlyUrl={calendlyUrl} height={700} />
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>What Happens Next?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">1. Schedule Your Call</h4>
                          <p className="text-sm text-muted-foreground">
                            Use the calendar on the left to pick a time for your intake call. You&apos;ll
                            receive a confirmation email with call details.
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold">2. Intake Call</h4>
                          <p className="text-sm text-muted-foreground">
                            During the call, we&apos;ll learn more about your situation and discuss how
                            we can help. This typically takes 30 minutes.
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="font-semibold">3. Next Steps</h4>
                          <p className="text-sm text-muted-foreground">
                            After the call, we&apos;ll outline the next steps and connect you with the
                            appropriate resources or services.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Need Help?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            If you have questions or need to reschedule, please contact us:
                          </p>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href="mailto:info@mcrchoward.org"
                                className="text-sm text-primary hover:underline"
                              >
                                info@mcrchoward.org
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a
                                href="tel:+14107550000"
                                className="text-sm text-primary hover:underline"
                              >
                                (410) 755-0000
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg border bg-background p-6 text-center">
                  <h3 className="text-xl font-semibold mb-4">Your Journey Starts Here</h3>
                  <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
                    We&apos;re here to support you every step of the way. Thank you for taking the first
                    step toward resolution and healing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('[ThankYouPage] Error loading Calendly link:', error)
    return <ErrorState error={error instanceof Error ? error.message : 'Unknown error'} />
  }
}

function MissingParamsState() {
  return (
    <main className="min-h-screen bg-muted">
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <CardTitle className="text-3xl md:text-4xl">Missing Information</CardTitle>
              <CardDescription className="text-base md:text-lg">
                We couldn&apos;t find the necessary information to display this page. Please make sure
                you accessed this page from a completed form submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                <p className="text-sm text-destructive">
                  If you just submitted a form, please check your email for a confirmation message. If
                  you continue to see this error, please contact us at{' '}
                  <a href="mailto:info@mcrchoward.org" className="underline">
                    info@mcrchoward.org
                  </a>
                  .
                </p>
              </div>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/getting-started">Return to Getting Started</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function ErrorState({ error }: { error: string }) {
  const isSettingsError = error.includes('Calendly settings') || error.includes('event type mapping')
  const isInquiryError = error.includes('Inquiry not found')

  return (
    <main className="min-h-screen bg-muted">
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <Badge className="mx-auto w-fit gap-2 py-1.5 px-4 text-sm bg-amber-600/10 text-amber-600 border-amber-600/20">
                <CheckCircle2 className="h-4 w-4" /> Form submitted successfully
              </Badge>
              <CardTitle className="text-3xl md:text-4xl">Thank You!</CardTitle>
              <CardDescription className="text-base md:text-lg">
                We&apos;ve received your inquiry and our team will be in touch soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSettingsError ? (
                <div className="rounded-lg border bg-background p-6">
                  <h3 className="font-semibold mb-2">Scheduling Setup in Progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our scheduling system is being configured. A team member will contact you directly
                    to schedule your intake call.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">What to expect:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>You&apos;ll receive an email confirmation within 24 hours</li>
                      <li>A team member will call you to schedule your intake call</li>
                      <li>The intake call typically takes about 30 minutes</li>
                    </ul>
                  </div>
                </div>
              ) : isInquiryError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                  <h3 className="font-semibold mb-2 text-destructive">Unable to Load Inquiry</h3>
                  <p className="text-sm text-muted-foreground">
                    We couldn&apos;t find your inquiry in our system. Please contact us directly if you
                    have any questions.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-background p-6">
                  <h3 className="font-semibold mb-2">Next Steps</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    A team member will contact you within 24 hours to schedule your intake call and
                    discuss next steps.
                  </p>
                </div>
              )}

              <Separator />

              <div className="rounded-lg border bg-background p-6">
                <h3 className="font-semibold mb-4">Contact Us</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href="mailto:info@mcrchoward.org"
                      className="text-sm text-primary hover:underline"
                    >
                      info@mcrchoward.org
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href="tel:+14107550000" className="text-sm text-primary hover:underline">
                      (410) 755-0000
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/getting-started">Return to Getting Started</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

