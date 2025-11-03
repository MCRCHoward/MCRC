'use client'

import { Calendar, Clock, MapPin, Globe, CreditCard, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Event } from '@/types'

interface EventPageClientProps {
  event: Event & { descriptionHtml?: string }
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
 * Format date and time for display
 */
function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  } catch {
    return dateString
  }
}

/**
 * Format date only for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      dateStyle: 'long',
    })
  } catch {
    return dateString
  }
}

/**
 * Format time only for display
 */
function formatTime(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

const EventPageClient = ({ event }: EventPageClientProps) => {
  const {
    name,
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

  const imageData = getImageData(featuredImage)
  const isSameDay =
    eventStartTime && eventEndTime
      ? new Date(eventStartTime).toDateString() === new Date(eventEndTime).toDateString()
      : false
  return (
    <article className="py-16 md:py-24">
      <div className="container max-w-7xl">
        {/* Hero Section */}
        <header className="mb-12 space-y-6 text-center">
          <div className="flex justify-center">
            <Badge variant={modality === 'online' ? 'secondary' : 'default'} className="capitalize">
              {modality?.replace('_', ' ')}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{name}</h1>
          {summary && <p className="mx-auto max-w-3xl text-lg text-muted-foreground">{summary}</p>}

          {/* Event Details Bar */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-6 text-sm">
            {eventStartTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <time dateTime={eventStartTime}>
                  {isSameDay
                    ? `${formatDate(eventStartTime)} • ${formatTime(eventStartTime)} - ${formatTime(eventEndTime || '')}`
                    : `${formatDateTime(eventStartTime)} - ${formatDateTime(eventEndTime || '')}`}
                </time>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {location.venueName && <strong>{location.venueName}</strong>}
                  {location.venueName && location.address && ' • '}
                  {location.address}
                </span>
              </div>
            )}

            {modality === 'online' && onlineMeeting?.url && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>Online Event</span>
              </div>
            )}

            {cost && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>
                  {cost.currency} {cost.amount.toFixed(2)}
                  {cost.description && ` • ${cost.description}`}
                </span>
              </div>
            )}

            {isFree && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-green-600 dark:text-green-400">Free</span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {imageData.url && (
          <div className="mb-12 overflow-hidden rounded-lg border">
            <Image
              src={imageData.url}
              alt={imageData.alt || name}
              width={1200}
              height={675}
              className="aspect-video w-full object-cover"
              priority
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Content Column */}
          <div className="lg:col-span-3">
            {descriptionHtml ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
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
            <div className="sticky top-24 space-y-6 rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold">Event Details</h2>
              <Separator />

              {/* Date & Time */}
              {eventStartTime && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Date & Time</p>
                      <time dateTime={eventStartTime} className="block text-muted-foreground">
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
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Location</p>
                      <address className="not-italic text-muted-foreground">
                        {location.venueName && (
                          <span className="block font-medium text-foreground">
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
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Online Meeting</p>
                      <a
                        href={onlineMeeting.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary hover:underline"
                      >
                        Join online
                      </a>
                      {onlineMeeting.details && (
                        <p className="text-muted-foreground">{onlineMeeting.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Price</p>
                    <p className="text-muted-foreground">
                      {isFree ? (
                        <span className="font-medium text-green-600 dark:text-green-400">Free</span>
                      ) : cost ? (
                        <>
                          {cost.currency} {cost.amount.toFixed(2)}
                          {cost.description && <span className="block">{cost.description}</span>}
                        </>
                      ) : (
                        'TBD'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Registration CTA */}
              <div className="space-y-3">
                {externalRegistrationLink ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href={externalRegistrationLink} target="_blank" rel="noopener noreferrer">
                      Register Now
                    </Link>
                  </Button>
                ) : isRegistrationRequired ? (
                  <Button className="w-full" size="lg" disabled>
                    Registration Required
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" variant="outline" disabled>
                    Registration Not Available
                  </Button>
                )}

                {modality === 'online' && onlineMeeting?.url && (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={onlineMeeting.url} target="_blank" rel="noopener noreferrer">
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
