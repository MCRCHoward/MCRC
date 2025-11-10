import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/custom-auth'
import { getUserRegistrations } from '@/app/(frontend)/(default)/events/[slug]/actions'
import type { EventRegistration } from '@/types/event-registration'
import { MyEventsClient } from './MyEventsClient'
import { formatDateTime, formatDate } from '@/utilities/formatDateTime'
import { logError } from '@/utilities/error-logging'

export default async function MyEventsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?returnUrl=/dashboard/my-events')
  }

  let registrations: (EventRegistration & { id: string })[] = []
  try {
    registrations = await getUserRegistrations(user.id)
  } catch (error) {
    logError('Error fetching user registrations', error, { userId: user.id })
  }

  const today = new Date().toISOString()

  // Separate upcoming and past events
  const upcomingEvents = registrations.filter(
    (reg) => reg.eventDate >= today && reg.status === 'registered',
  )
  const pastEvents = registrations.filter(
    (reg) => reg.eventDate < today || reg.status === 'attended' || reg.status === 'cancelled',
  )

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your event registrations
        </p>
      </div>

      <MyEventsClient
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        formatDateTime={formatDateTime}
        formatDate={formatDate}
      />
    </div>
  )
}

