'use client'

import {
  Calendar,
  MapPin,
  Globe,
  CreditCard,
  CheckCircle2,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { Event } from '@/types'
import type { User } from '@/types'
import { EventRegistrationForm } from '@/components/events/EventRegistrationForm'
import { cancelRegistration } from '@/app/(frontend)/(default)/events/[slug]/actions'
import type { EventRegistration } from '@/types/event-registration'
import { formatDateTime, formatDate, formatTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

interface EventPageClientProps {
  event: Event & { descriptionHtml?: string }
  user?: User | null
  registrationStatus?: {
    registrationId: string
    status: EventRegistration['status']
  } | null
  registrationCount?: number | null
}

/**
 * Helper to get image URL and alt from featuredImage
 */
function getImageData(featuredImage?: string | { url: string; alt?: string } | null) {
  if (!featuredImage) return { url: null, alt: null }
  if (typeof featuredImage === 'string') return { url: featuredImage, alt: null }
  if ('url' in featuredImage) return { url: featuredImage.url, alt: featuredImage.alt || null }
  return { url: null, alt: null }
}

/**
 * Determines the primary registration action to display
 */
type RegistrationAction = 'cancel' | 'external' | 'register' | 'signin' | null

function getRegistrationAction(
  user: User | null | undefined,
  isRegistered: boolean,
  externalLink?: string,
  isRequired?: boolean,
): RegistrationAction {
  if (isRegistered) return 'cancel'
  if (externalLink) return 'external'
  if (!isRequired) return null
  if (!user) return 'signin'
  return 'register'
}

const EventPageClient = ({
  event,
  user,
  registrationStatus,
  registrationCount,
}: EventPageClientProps) => {
  const {
    id: eventId,
    name,
    slug: eventSlug,
    summary,
    descriptionHtml,
    featuredImage,
    modality,
    location,
    onlineMeeting,
    eventStartTime,
    eventEndTime,
    isFree,
    cost,
    isRegistrationRequired,
    externalRegistrationLink,
  } = event

  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const imageData = getImageData(featuredImage)
  const isSameDay =
    eventStartTime && eventEndTime
      ? new Date(eventStartTime).toDateString() === new Date(eventEndTime).toDateString()
      : false

  const isRegistered = registrationStatus?.status === 'registered'
  const registrationId = registrationStatus?.registrationId
  const isArchived = event.isArchived === true

  const handleCancelRegistration = async () => {
    if (!registrationId) return

    setIsCancelling(true)
    try {
      await cancelRegistration(registrationId)
      toast.success('Registration cancelled successfully')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel registration. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleSignInClick = () => {
    const returnUrl = `/events/${eventSlug}`
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  const registrationAction = getRegistrationAction(
    user,
    isRegistered,
    externalRegistrationLink,
    isRegistrationRequired,
  )

  return (
    <article className="py-32 md:py-24">
      <div className="container max-w-7xl">
        {/* Hero Section */}
        <header className="mb-12 space-y-6 text-center">
          <div className="flex justify-center">
            <Badge
              variant={modality === 'online' ? 'secondary' : 'default'}
              className="capitalize text-xs font-semibold"
            >
              {modality?.replace('_', ' ')}
            </Badge>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            <h1
              className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl"
              id="event-title"
            >
              {name}
            </h1>
            {summary && (
              <p className="text-xl leading-relaxed text-black" aria-describedby="event-title">
                {summary}
              </p>
            )}
          </div>

          {/* Event Details Bar */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 bg-muted/30 rounded-lg px-6 py-4 text-sm md:text-base">
            {eventStartTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <time
                  dateTime={eventStartTime}
                  className="text-foreground"
                  aria-current={new Date(eventStartTime) > new Date() ? 'date' : undefined}
                >
                  {isSameDay
                    ? `${formatDate(eventStartTime)} • ${formatTime(eventStartTime)} - ${formatTime(eventEndTime || '')}`
                    : `${formatDateTime(eventStartTime)} - ${formatDateTime(eventEndTime || '')}`}
                </time>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-foreground">
                  {location.venueName && (
                    <strong className="font-semibold">{location.venueName}</strong>
                  )}
                  {location.venueName && location.address && ' • '}
                  {location.address}
                </span>
              </div>
            )}

            {modality === 'online' && onlineMeeting?.url && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-foreground">Online Event</span>
              </div>
            )}

            {cost && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-foreground font-mono">
                  {cost.currency} {cost.amount.toFixed(2)}
                  {cost.description && ` • ${cost.description}`}
                </span>
              </div>
            )}

            {isFree && (
              <div className="inline-flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold text-sm text-success-foreground bg-success/15 dark:bg-success/25 px-3 py-1 rounded-md">
                  Free
                </span>
              </div>
            )}
            {isArchived && (
              <Badge variant="secondary" className="capitalize">
                Archived
              </Badge>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {imageData.url && (
          <div className="mb-16 overflow-hidden rounded-lg border shadow-sm">
            <div className="relative w-full min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] max-h-[600px]">
              <Image
                src={imageData.url}
                alt={imageData.alt || name}
                width={1200}
                height={675}
                className="w-full h-full object-cover object-center"
                style={{ aspectRatio: '16/9' }}
                priority
              />
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-16 lg:gap-20 lg:grid-cols-4">
          {/* Content Column */}
          <div className="lg:col-span-3 px-2 md:px-0">
            {descriptionHtml ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none [&_p]:leading-7 [&_p]:text-base md:[&_p]:text-lg transition-all duration-200"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-muted-foreground">Event details coming soon.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 space-y-8 rounded-lg border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <h2 className="text-lg font-semibold">Event Details</h2>
              <Separator />

              {/* Date & Time */}
              {eventStartTime && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Calendar
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="space-y-1 text-sm md:text-base">
                      <p className="font-semibold text-foreground">Date & Time</p>
                      <time
                        dateTime={eventStartTime}
                        className="block text-muted-foreground leading-relaxed"
                      >
                        {isSameDay ? (
                          <>
                            {formatDate(eventStartTime)}
                            <br />
                            {formatTime(eventStartTime)} - {formatTime(eventEndTime || '')}
                          </>
                        ) : (
                          <>
                            {formatDateTime(eventStartTime)}
                            {eventEndTime && (
                              <>
                                <br />
                                to {formatDateTime(eventEndTime)}
                              </>
                            )}
                          </>
                        )}
                      </time>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {location && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="space-y-1 text-sm md:text-base">
                      <p className="font-semibold text-foreground">Location</p>
                      <address className="not-italic text-muted-foreground leading-relaxed">
                        {location.venueName && (
                          <span className="block font-semibold text-foreground">
                            {location.venueName}
                          </span>
                        )}
                        {location.address}
                      </address>
                    </div>
                  </div>
                </div>
              )}

              {/* Online Meeting */}
              {modality === 'online' && onlineMeeting?.url && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Globe
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="space-y-1 text-sm md:text-base">
                      <p className="font-semibold text-foreground">Online Meeting</p>
                      <a
                        href={onlineMeeting.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary hover:underline focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none rounded transition-all duration-200"
                        aria-label="Join online meeting (opens in new tab)"
                      >
                        Join online
                      </a>
                      {onlineMeeting.details && (
                        <p className="text-muted-foreground leading-relaxed">
                          {onlineMeeting.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CreditCard
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="space-y-1 text-sm md:text-base">
                    <p className="font-semibold text-foreground">Price</p>
                    <div className="text-muted-foreground">
                      {isFree ? (
                        <span
                          className="inline-flex items-center font-semibold text-sm text-success-foreground bg-success/15 dark:bg-success/25 px-3 py-1.5 rounded-md"
                          aria-label="This event is free"
                        >
                          Free
                        </span>
                      ) : cost ? (
                        <div className="space-y-1">
                          <span className="font-mono text-base font-semibold text-foreground">
                            {cost.currency} {cost.amount.toFixed(2)}
                          </span>
                          {cost.description && (
                            <span className="block text-sm leading-relaxed">
                              {cost.description}
                            </span>
                          )}
                        </div>
                      ) : (
                        'TBD'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Registration Section */}
              <div className="space-y-4" aria-live="polite">
                {isArchived && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    This event is archived. Registration is closed.
                  </div>
                )}
                {/* Registration Count (Admin only) */}
                {registrationCount !== null && registrationCount !== undefined && (
                  <div className="text-sm md:text-base text-muted-foreground">
                    <span className="font-semibold text-foreground">{registrationCount}</span>{' '}
                    registration{registrationCount !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Registration Status - Registered */}
                {registrationAction === 'cancel' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-md bg-success/10 p-4 dark:bg-success/20 transition-all duration-200">
                      <CheckCircle2
                        className="h-6 w-6 shrink-0 text-success-foreground animate-in fade-in zoom-in duration-300"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-success-foreground">
                        You are registered for this event
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                      onClick={handleCancelRegistration}
                      disabled={isCancelling}
                      aria-label={`Cancel your registration for ${name}`}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" aria-hidden="true" />
                          Cancel Registration
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Registration Form - Authenticated User */}
                {registrationAction === 'register' && user && !isArchived && (
                  <EventRegistrationForm
                    eventId={eventId}
                    userEmail={user.email || ''}
                    userName={user.name || ''}
                    isFree={isFree}
                    eventCost={
                      cost ? { amount: cost.amount, currency: cost.currency || 'USD' } : undefined
                    }
                    onSuccess={() => {
                      toast.success(`Successfully registered for ${name}`)
                      router.refresh()
                    }}
                  />
                )}

                {/* Sign In Button - Unauthenticated User */}
                {registrationAction === 'signin' && !isArchived && (
                  <Button
                    size="lg"
                    className="w-full gap-2 h-12 focus-visible:ring-4 focus-visible:ring-primary/20"
                    onClick={handleSignInClick}
                    aria-label={`Sign in to register for ${name}`}
                  >
                    Sign in to Register
                  </Button>
                )}

                {/* External Registration Link */}
                {registrationAction === 'external' && externalRegistrationLink && !isArchived && (
                  <Button
                    asChild
                    size="lg"
                    className="w-full gap-2 h-12 focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <a
                      href={externalRegistrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Register for ${name} (opens in new tab)`}
                    >
                      <span>Register here</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                )}

                {/* Online Meeting Link */}
                {modality === 'online' && onlineMeeting?.url && (
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="w-full gap-2 h-12 focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <Link
                      href={onlineMeeting.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Join online meeting for ${name} (opens in new tab)`}
                    >
                      <Globe className="h-4 w-4" aria-hidden="true" />
                      Join Online Meeting
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}

export { EventPageClient }
