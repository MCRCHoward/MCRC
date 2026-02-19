'use client'

import { EventErrorFallback } from '@/components/events/EventErrorBoundary'

export default function CMSEventRegistrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <EventErrorFallback
      error={error}
      reset={reset}
      context="registrations"
    />
  )
}
