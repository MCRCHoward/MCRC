import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { fetchEventBySlug, fetchPublishedEvents } from '@/lib/firebase-api-events'
import { EventPageClient } from '@/components/clients/EventPageClient'
import { getServerSideURL } from '@/utilities/getURL'
import { getCurrentUser } from '@/lib/custom-auth'
import { getUserRegistrationStatus, getEventRegistrationCount } from './actions'

type RouteParams = Promise<{ slug: string }>

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

  const event = await fetchEventBySlug(slug)
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

  const event = await fetchEventBySlug(slug)
  if (!event) return notFound()

  // Get current user and registration status
  const user = await getCurrentUser()
  let registrationStatus = null
  let registrationCount = null

  if (user) {
    try {
      registrationStatus = await getUserRegistrationStatus(event.id)
    } catch (error) {
      // User might not be registered, which is fine
      console.error('Error fetching registration status:', error)
    }
  }

  // Get registration count if user is admin
  if (user?.role === 'admin') {
    try {
      registrationCount = await getEventRegistrationCount(event.id)
    } catch (error) {
      console.error('Error fetching registration count:', error)
    }
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
    console.error('Error generating static params for events:', error)
    return []
  }
}
