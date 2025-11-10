import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { cache } from 'react'

import { fetchEventBySlug, fetchPublishedEvents } from '@/lib/firebase-api-events'
import { EventPageClient } from '@/components/clients/EventPageClient'
import { getServerSideURL } from '@/utilities/getURL'
import { getCurrentUser } from '@/lib/custom-auth'
import { getUserRegistrationStatus, getEventRegistrationCount } from './actions'
import { logError } from '@/utilities/error-logging'

type RouteParams = Promise<{ slug: string }>

// Cache event fetch to avoid duplicate queries
const getCachedEvent = cache(async (slug: string) => {
  return await fetchEventBySlug(slug)
})

/**
 * Helper to extract image URL from featuredImage
 */
function getImageUrl(
  featuredImage?: string | { url: string; alt?: string } | null,
): string | undefined {
  if (!featuredImage) return undefined
  if (typeof featuredImage === 'string') return featuredImage
  if ('url' in featuredImage) return featuredImage.url
  return undefined
}

// --- SEO ---
export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params

  const event = await getCachedEvent(slug)
  if (!event) return { title: 'Event Not Found', robots: { index: false } }

  const title = event.name || 'Event'
  const description = event.summary || 'Event details'
  const image = getImageUrl(event.featuredImage)
  const canonical = `${getServerSideURL()}/events/${encodeURIComponent(slug)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function EventPage({ params }: { params: RouteParams }) {
  const { slug } = await params

  const event = await getCachedEvent(slug)
  if (!event) return notFound()

  // Get current user
  const user = await getCurrentUser()

  // Fetch registration data in parallel for better performance
  const [registrationStatusResult, registrationCountResult] = await Promise.allSettled([
    user ? getUserRegistrationStatus(event.id).catch(() => null) : Promise.resolve(null),
    user?.role === 'admin' ? getEventRegistrationCount(event.id).catch(() => null) : Promise.resolve(null),
  ])

  const registrationStatus =
    registrationStatusResult.status === 'fulfilled' ? registrationStatusResult.value : null
  const registrationCount =
    registrationCountResult.status === 'fulfilled' ? registrationCountResult.value : null

  // Log errors if any occurred
  if (registrationStatusResult.status === 'rejected') {
    logError('Error fetching registration status', registrationStatusResult.reason, {
      eventId: event.id,
      userId: user?.id,
    })
  }
  if (registrationCountResult.status === 'rejected') {
    logError('Error fetching registration count', registrationCountResult.reason, { eventId: event.id })
  }

  return (
    <EventPageClient
      event={event}
      user={user}
      registrationStatus={registrationStatus}
      registrationCount={registrationCount}
    />
  )
}

export const revalidate = 60

// --- Static params generation ---
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const events = await fetchPublishedEvents()
    return events
      .map((event) => event.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      .map((slug) => ({ slug }))
  } catch (error) {
    logError('Error generating static params for events', error)
    return []
  }
}
