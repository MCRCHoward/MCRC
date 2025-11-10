'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, X, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cancelRegistration } from '@/app/(frontend)/(default)/events/[slug]/actions'
import type { EventRegistration } from '@/types/event-registration'

interface MyEventsClientProps {
  upcomingEvents: (EventRegistration & { id: string })[]
  pastEvents: (EventRegistration & { id: string })[]
  formatDateTime: (date: string) => string
  formatDate: (date: string) => string
}

export function MyEventsClient({
  upcomingEvents,
  pastEvents,
  formatDateTime,
  formatDate,
}: MyEventsClientProps) {
  const router = useRouter()
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set())

  const handleCancelRegistration = async (registrationId: string) => {
    setCancellingIds((prev) => new Set(prev).add(registrationId))
    try {
      await cancelRegistration(registrationId)
      toast.success('Registration cancelled successfully')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel registration. Please try again.'
      toast.error(errorMessage)
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev)
        next.delete(registrationId)
        return next
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You don&apos;t have any upcoming event registrations.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/events">Browse Events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingEvents.map((registration) => {
              const isCancelling = cancellingIds.has(registration.id)
              return (
                <Card key={registration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          <Link
                            href={`/events/${registration.eventSlug}`}
                            className="hover:underline"
                          >
                            {registration.eventName}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={registration.eventDate}>
                              {formatDateTime(registration.eventDate)}
                            </time>
                          </div>
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-success/10 text-success-foreground">
                        Registered
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong>Service Interest:</strong> {registration.serviceInterest}
                        </p>
                        {registration.emailMarketingConsent && (
                          <p className="mt-1">
                            <strong>Marketing Consent:</strong> Yes
                          </p>
                        )}
                      </div>
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCancelRegistration(registration.id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Cancel Registration
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Past Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
        {pastEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You don&apos;t have any past event registrations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pastEvents.map((registration) => {
              const statusBadge =
                registration.status === 'attended' ? (
                  <Badge variant="default" className="bg-success/10 text-success-foreground">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Attended
                  </Badge>
                ) : registration.status === 'cancelled' ? (
                  <Badge variant="secondary">Cancelled</Badge>
                ) : (
                  <Badge variant="outline">Past</Badge>
                )

              return (
                <Card key={registration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          <Link
                            href={`/events/${registration.eventSlug}`}
                            className="hover:underline"
                          >
                            {registration.eventName}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={registration.eventDate}>
                              {formatDate(registration.eventDate)}
                            </time>
                          </div>
                        </CardDescription>
                      </div>
                      {statusBadge}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>Service Interest:</strong> {registration.serviceInterest}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

