'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Calendar, Archive as ArchiveIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Event } from '@/types'
import { EventListActions } from './EventListActions'

interface CmsEventInfo extends Event {
  capacity?: number
  registrationCount: number
}

interface EventListClientProps {
  events: CmsEventInfo[]
  view: 'active' | 'archived'
  query: string
  nextCursor?: string
  hasMore: boolean
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'TBD'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function EventListClient({ events, view, query, nextCursor, hasMore }: EventListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState(query)

  const normalizedQuery = searchValue.trim().toLowerCase()

  const currentList = events.filter((event) => {
    if (!normalizedQuery) return true
    return (
      event.name.toLowerCase().includes(normalizedQuery) ||
      event.slug.toLowerCase().includes(normalizedQuery)
    )
  })

  const isSearching = Boolean(normalizedQuery)
  const hasCursor = Boolean(searchParams.get('cursor'))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target !== searchInputRef.current && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams()
    if (value === 'archived') {
      params.set('view', 'archived')
    }
    if (searchValue) {
      params.set('q', searchValue)
    }
    router.push(`/dashboard/events?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (view === 'archived') {
      params.set('view', 'archived')
    }
    if (searchValue) {
      params.set('q', searchValue)
    }
    router.push(`/dashboard/events?${params.toString()}`)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    const params = new URLSearchParams()
    if (view === 'archived') {
      params.set('view', 'archived')
    }
    router.push(`/dashboard/events?${params.toString()}`)
  }

  const handleFirstPage = () => {
    const params = new URLSearchParams()
    if (view === 'archived') {
      params.set('view', 'archived')
    }
    router.push(`/dashboard/events?${params.toString()}`)
  }

  const handleNextPage = () => {
    if (!nextCursor) return
    const params = new URLSearchParams()
    if (view === 'archived') {
      params.set('view', 'archived')
    }
    params.set('cursor', nextCursor)
    router.push(`/dashboard/events?${params.toString()}`)
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-foreground">Events</h1>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <form onSubmit={handleSearch} className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search title or slug... (Press / to focus)"
              className="w-full pl-10 pr-20 md:w-80"
              aria-label="Search events"
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-12 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 h-8 -translate-y-1/2"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <Tabs value={view} onValueChange={handleTabChange} className="w-auto">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button asChild>
            <Link href="/dashboard/events/new">New Event</Link>
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {normalizedQuery && `${currentList.length} ${currentList.length === 1 ? 'event' : 'events'} found`}
        {!normalizedQuery && `Showing ${currentList.length} ${view === 'archived' ? 'archived' : 'active'} ${currentList.length === 1 ? 'event' : 'events'}`}
      </div>

      {normalizedQuery && (
        <div className="mb-3 text-sm text-muted-foreground">
          {currentList.length} {currentList.length === 1 ? 'result' : 'results'} for &quot;{searchValue}&quot;
        </div>
      )}

      {currentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {normalizedQuery ? (
              <>
                <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No events match &quot;{searchValue}&quot;</p>
                <Button variant="link" onClick={handleClearSearch} className="mt-2">
                  Clear search
                </Button>
              </>
            ) : view === 'archived' ? (
              <>
                <ArchiveIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No archived events</p>
              </>
            ) : (
              <>
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No events yet</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/events/new">Create Your First Event</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {currentList.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        event.capacity && event.registrationCount >= event.capacity
                          ? 'destructive'
                          : 'outline'
                      }
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <Users className="h-3 w-3" />
                      {event.registrationCount}
                      {event.capacity ? `/${event.capacity}` : ''}
                    </Badge>
                    <Badge variant={event.meta?.status === 'published' ? 'default' : 'secondary'}>
                      {event.meta?.status ?? 'draft'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {event.slug ? `/${event.slug}` : ''} &middot; {formatDate(event.eventStartTime)}
                  {event.meta?.eventType && ` \u00B7 ${event.meta.eventType}`}
                  {event.capacity != null && ` \u00B7 Capacity: ${event.capacity}`}
                  {!event.listed && ' \u2022 Unlisted'}
                  {event.isArchived && ' \u2022 Archived'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventListActions event={event} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isSearching && currentList.length >= 100 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing first 100 matches. Refine your search for more specific results.
        </p>
      )}

      {!isSearching && (hasMore || hasCursor) && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!hasCursor}
            onClick={handleFirstPage}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            First Page
          </Button>

          <span className="text-sm text-muted-foreground">
            Showing {currentList.length} events
          </span>

          <Button
            variant="outline"
            disabled={!hasMore}
            onClick={handleNextPage}
          >
            Next Page
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  )
}
