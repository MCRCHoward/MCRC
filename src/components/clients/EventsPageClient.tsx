'use client'

import { FileText, MapPin, DollarSign, Calendar, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import type { Event } from '@/types'

interface EventsPageClientProps {
  events: Event[]
  badges: string[]
}

/**
 * Formats date to a more readable format
 */
function formatEventDate(dateString?: string): string {
  if (!dateString) return 'Date TBD'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Formats time from date string
 */
function formatEventTime(dateString?: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

/**
 * Extracts image URL from various Event image formats
 */
function getImageUrl(image: string | { url: string; alt?: string } | undefined): string | null {
  if (!image) return null
  if (typeof image === 'string') return image
  if (typeof image === 'object' && 'url' in image) return image.url
  return null
}

/**
 * Extracts image alt text from various Event image formats
 */
function getImageAlt(
  image: string | { url: string; alt?: string } | undefined,
  fallback: string,
): string {
  if (!image) return fallback
  if (typeof image === 'string') return fallback
  if (typeof image === 'object' && 'alt' in image) return image.alt || fallback
  return fallback
}

export function EventsPageClient({ events, badges }: EventsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  type MaybeMeta = { meta?: { eventType?: string | null; slug?: string | null } }
  type MaybeTopLevel = { eventType?: string | null; slug?: string | null }

  const getType = useCallback(
    (e: Event & MaybeMeta & MaybeTopLevel) => e.eventType ?? e.meta?.eventType ?? null,
    [],
  )

  const getSlug = useCallback(
    (e: Event & MaybeMeta & MaybeTopLevel) => e.slug ?? e.meta?.slug ?? String(e.id),
    [],
  )

  // Valid types set
  const validTypes = useMemo(() => new Set(badges), [badges])

  // Read current type from URL; default 'all'
  const selectedFromURL = useMemo(() => {
    const t = searchParams.get('type')
    if (!t) return 'all'
    return validTypes.has(t) ? t : 'all'
  }, [searchParams, validTypes])

  // Controlled state, initialized from URL
  const [selectedBadge, setSelectedBadge] = useState<string>(selectedFromURL)

  // Keep state in sync with URL (back/forward)
  useEffect(() => {
    setSelectedBadge(selectedFromURL)
  }, [selectedFromURL])

  const replaceUrl = useCallback(
    (type: string) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (type === 'all') sp.delete('type')
      else sp.set('type', type)
      router.replace(`?${sp.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const selectType = useCallback(
    (type: string) => {
      startTransition(() => {
        setSelectedBadge(type)
        replaceUrl(type)
        // smooth scroll to the grid
        requestAnimationFrame(() => {
          document.querySelector('[data-events-grid]')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      })
    },
    [replaceUrl],
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSelectedBadge('all')
      replaceUrl('all')
    })
  }, [replaceUrl])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) {
      const t = getType(e)
      if (!t) continue
      map.set(t, (map.get(t) ?? 0) + 1)
    }
    return map
  }, [events, getType])

  const filteredEvents =
    selectedBadge === 'all' ? events : events.filter((e) => getType(e) === selectedBadge)

  function EmptyState() {
    return (
      <div className="col-span-full mt-8 flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-16 w-16 text-muted-foreground" strokeWidth={1} />
        <h3 className="text-2xl font-semibold">No events found</h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          {selectedBadge !== 'all'
            ? 'There are no events matching your current filter. Try selecting a different category or clear the filter to see all events.'
            : "We don't have any events scheduled at the moment. Check back soon for upcoming workshops and events."}
        </p>
        {selectedBadge !== 'all' && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mt-4"
            aria-label="Clear filters and show all events"
          >
            Clear Filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <section className="mt-32 bg-muted/60 py-16" aria-label="Events listing">
      <div className="container mx-auto">
        <div className="relative mx-auto flex max-w-screen-xl flex-col gap-12 lg:flex-row lg:gap-20">
          {/* Filters */}
          <header className="top-24 flex h-fit flex-col items-center gap-5 text-center lg:sticky lg:max-w-xs lg:items-start lg:gap-8 lg:text-left">
            <FileText className="h-14 w-14" strokeWidth={1} aria-hidden="true" />
            <h1 className="text-4xl font-extrabold lg:text-5xl">Our Events</h1>
            <p className="text-muted-foreground lg:text-lg">
              Join our in-person and online workshops to build mediation skills, strengthen
              connections, and turn conflict into community.
            </p>
            <Separator />

            <nav
              className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:flex-col lg:items-start lg:gap-2"
              aria-label="Event filters"
              role="radiogroup"
              aria-live="polite"
              aria-atomic="true"
            >
              <button
                role="radio"
                aria-checked={selectedBadge === 'all'}
                className={`rounded-full px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  selectedBadge === 'all'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => selectType('all')}
                disabled={isPending}
                aria-label={`Show all events${events.length ? ` (${events.length} total)` : ''}`}
              >
                All {events.length ? `(${events.length})` : ''}
              </button>

              {badges.map((badge) => {
                const count = counts.get(badge) || 0
                return (
                  <button
                    key={badge}
                    role="radio"
                    aria-checked={selectedBadge === badge}
                    className={`rounded-full px-4 py-2 capitalize transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      selectedBadge === badge
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => selectType(badge)}
                    disabled={isPending}
                    title={badge.replace(/_/g, ' ')}
                    aria-label={`Filter events by ${badge.replace(/_/g, ' ')}${count ? ` (${count} events)` : ''}`}
                  >
                    {badge.replace(/_/g, ' ')}
                    {count ? ` (${count})` : ''}
                  </button>
                )
              })}
            </nav>
          </header>

          {/* Event grid */}
          <div
            className="grid w-full grid-cols-1 gap-6 md:grid-cols-2"
            data-events-grid
            role="list"
            aria-label="Events list"
          >
            {filteredEvents.length === 0 ? (
              <EmptyState />
            ) : (
              filteredEvents.map((event, index) => {
                const primaryImageUrl = getImageUrl(event.featuredImage)
                const secondaryImageUrl = getImageUrl(event.secondaryImage) || primaryImageUrl
                const primaryImageAlt = getImageAlt(event.featuredImage, event.name)
                const secondaryImageAlt = getImageAlt(
                  event.secondaryImage,
                  `${event.name} - additional view`,
                )
                const slug = getSlug(event)
                const href = `/events/${encodeURIComponent(slug)}`
                const isAboveFold = index < 4 // First 4 events are above the fold

                // Format date and time
                const formattedDate = formatEventDate(event.eventStartTime)
                const formattedTime = formatEventTime(event.eventStartTime)

                return (
                  <article
                    key={event.id}
                    role="listitem"
                    className="group relative isolate min-h-[400px] w-full overflow-hidden rounded-lg bg-background shadow-sm transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  >
                    <Link
                      href={href}
                      className="flex h-full flex-col"
                      aria-label={`View event: ${event.name}`}
                    >
                      {/* Image Container with Dual Image System */}
                      {primaryImageUrl && (
                        <div className="relative h-64 w-full overflow-hidden">
                          {/* Check if we have a valid secondary image */}
                          {secondaryImageUrl && secondaryImageUrl !== primaryImageUrl ? (
                            <>
                              {/* Primary Image - Fades out on hover when secondary exists */}
                              <Image
                                src={primaryImageUrl}
                                alt={primaryImageAlt}
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="absolute inset-0 object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
                                priority={isAboveFold}
                                loading={isAboveFold ? undefined : 'lazy'}
                              />
                              {/* Secondary Image - Fades in on hover */}
                              <Image
                                src={secondaryImageUrl}
                                alt={secondaryImageAlt}
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
                                loading="lazy"
                              />
                            </>
                          ) : (
                            /* Primary Image - Zoom effect on hover when no secondary image */
                            <Image
                              src={primaryImageUrl}
                              alt={primaryImageAlt}
                              fill
                              sizes="(min-width: 768px) 50vw, 100vw"
                              className="absolute inset-0 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                              priority={isAboveFold}
                              loading={isAboveFold ? undefined : 'lazy'}
                            />
                          )}
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="flex flex-1 flex-col p-6">
                        {/* Header: Date and Badge */}
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <time
                              dateTime={event.eventStartTime || undefined}
                              className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                            >
                              <Calendar className="h-4 w-4" aria-hidden="true" />
                              <span>{formattedDate}</span>
                            </time>
                            {formattedTime && (
                              <span className="text-xs text-muted-foreground">{formattedTime}</span>
                            )}
                          </div>
                          <Badge
                            variant={event.modality === 'online' ? 'secondary' : 'default'}
                            className="shrink-0 capitalize"
                            aria-label={`Event type: ${event.modality?.replace('_', ' ')}`}
                          >
                            {event.modality?.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h2 className="mb-3 line-clamp-2 text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                          {event.name}
                        </h2>

                        {/* Summary/Excerpt */}
                        {event.summary && (
                          <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
                            {event.summary}
                          </p>
                        )}

                        {/* Additional Info */}
                        <div className="mt-auto space-y-2 border-t pt-4">
                          {/* Location */}
                          {event.location && event.modality !== 'online' && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="line-clamp-1">
                                {event.location.venueName || event.location.address}
                              </span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="h-4 w-4" aria-hidden="true" />
                            <span>
                              {event.isFree
                                ? 'Free Event'
                                : `$${event.cost?.amount || '0'} ${event.cost?.currency || 'USD'}`}
                            </span>
                          </div>
                        </div>

                        {/* CTA Indicator */}
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          <span>Learn More</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </div>
                      </div>
                    </Link>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
