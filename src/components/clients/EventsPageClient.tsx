'use client'

import { FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Event, Media } from '@/types'

interface EventsPageClientProps {
  events: Event[]
  badges: string[]
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
      <div className="col-span-full mt-32 flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" strokeWidth={1} />
        <h3 className="text-xl font-semibold">No events found</h3>
        <p className="mt-2 text-muted-foreground">
          There are no events matching your current filter. Try selecting a different category.
        </p>
      </div>
    )
  }

  return (
    <section className="mt-32 bg-muted/60 py-16">
      <div className="container mx-auto">
        <div className="relative mx-auto flex max-w-screen-xl flex-col gap-12 lg:flex-row lg:gap-20">
          {/* Filters */}
          <header className="top-24 flex h-fit flex-col items-center gap-5 text-center lg:sticky lg:max-w-xs lg:items-start lg:gap-8 lg:text-left">
            <FileText className="h-14 w-14" strokeWidth={1} />
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
            >
              <button
                role="radio"
                aria-checked={selectedBadge === 'all'}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  selectedBadge === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => selectType('all')}
                disabled={isPending}
              >
                All {events.length ? `(${events.length})` : ''}
              </button>

              {badges.map((badge) => (
                <button
                  key={badge}
                  role="radio"
                  aria-checked={selectedBadge === badge}
                  className={`rounded-full px-3 py-1 capitalize transition-colors ${
                    selectedBadge === badge
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  onClick={() => selectType(badge)}
                  disabled={isPending}
                  title={badge.replace(/_/g, ' ')}
                >
                  {badge.replace(/_/g, ' ')}
                  {counts.get(badge) ? ` (${counts.get(badge)})` : ''}
                </button>
              ))}
            </nav>
          </header>

          {/* Event grid */}
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2" data-events-grid>
            {filteredEvents.length === 0 ? (
              <EmptyState />
            ) : (
              filteredEvents.map((event) => {
                // Handle featuredImage which can be string, Media, or { url, alt } object
                const getImageUrl = () => {
                  if (!event.featuredImage) return null
                  if (typeof event.featuredImage === 'string') return event.featuredImage
                  if ('url' in event.featuredImage) return event.featuredImage.url
                  return null
                }

                const getImageAlt = () => {
                  if (!event.featuredImage) return event.name
                  if (typeof event.featuredImage === 'string') return event.name
                  if ('alt' in event.featuredImage) return event.featuredImage.alt || event.name
                  return event.name
                }

                const imageUrl = getImageUrl()
                const imageAlt = getImageAlt()
                const slug = getSlug(event)
                const href = `/events/${encodeURIComponent(slug)}`

                return (
                  <Link
                    href={href}
                    key={event.id}
                    className="group relative isolate h-80 w-full rounded-lg bg-background"
                  >
                    <div className="z-10 flex h-full flex-col justify-between p-6">
                      <div className="flex justify-between">
                        <time
                          dateTime={event.eventStartTime || undefined}
                          className="text-muted-foreground transition-colors duration-500 group-hover:text-background"
                        >
                          {event.eventStartTime
                            ? new Date(event.eventStartTime).toLocaleDateString(undefined, {
                                dateStyle: 'medium',
                              })
                            : ''}
                        </time>
                        <Badge
                          variant={event.modality === 'online' ? 'secondary' : 'default'}
                          className="capitalize"
                        >
                          {event.modality?.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2">
                        <h2 className="line-clamp-2 text-xl font-medium transition-colors duration-500 group-hover:text-background">
                          {event.name}
                        </h2>
                      </div>
                    </div>

                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="absolute inset-0 -z-10 size-full rounded-lg object-cover brightness-50 transition-all duration-500 ease-custom-bezier [clip-path:inset(0_0_100%_0)] group-hover:[clip-path:inset(0_0_0%_0)]"
                        priority={false}
                      />
                    )}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
