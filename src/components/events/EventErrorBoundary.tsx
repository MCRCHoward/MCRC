'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { logError } from '@/utilities/error-logging'

type ErrorContext = 'list' | 'detail' | 'registration' | 'form' | 'registrations'

interface EventErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  context?: ErrorContext
}

export const contextConfig: Record<
  ErrorContext,
  {
    title: string
    description: string
    backLink: string
    backLabel: string
  }
> = {
  list: {
    title: 'Unable to load events',
    description:
      'We had trouble loading the events list. This might be a temporary issue.',
    backLink: '/',
    backLabel: 'Go to Homepage',
  },
  detail: {
    title: 'Unable to load event',
    description:
      'We had trouble loading this event. It may have been removed or there was a temporary issue.',
    backLink: '/events',
    backLabel: 'Back to Events',
  },
  registration: {
    title: 'Registration error',
    description:
      'We had trouble processing your registration. Please try again.',
    backLink: '/events',
    backLabel: 'Back to Events',
  },
  form: {
    title: 'Form error',
    description:
      'We had trouble with the event form. Your changes may not have been saved.',
    backLink: '/dashboard/events',
    backLabel: 'Back to Events List',
  },
  registrations: {
    title: 'Unable to load registrations',
    description:
      'We had trouble loading the registrations for this event.',
    backLink: '/dashboard/events',
    backLabel: 'Back to Events List',
  },
}

export function EventErrorFallback({
  error,
  reset,
  context = 'detail',
}: EventErrorFallbackProps) {
  const config = contextConfig[context]

  useEffect(() => {
    logError(`Event ${context} error boundary triggered`, error, {
      digest: error.digest,
      context,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    })
  }, [error, context])

  return (
    <div className="container max-w-lg py-16">
      <Card className="border-destructive/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle
              className="h-7 w-7 text-destructive"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <Button onClick={reset} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full" size="lg">
            <Link href={config.backLink}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {config.backLabel}
            </Link>
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 rounded-md bg-muted p-4 text-xs">
              <summary className="cursor-pointer font-medium text-sm mb-2">
                Developer Info (hidden in production)
              </summary>
              <div className="space-y-2 mt-3">
                <div>
                  <span className="font-semibold">Error:</span>
                  <pre className="mt-1 overflow-auto whitespace-pre-wrap text-destructive">
                    {error.message}
                  </pre>
                </div>
                {error.digest && (
                  <div>
                    <span className="font-semibold">Digest:</span>
                    <code className="ml-2 text-muted-foreground">
                      {error.digest}
                    </code>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <span className="font-semibold">Stack:</span>
                    <pre className="mt-1 overflow-auto whitespace-pre-wrap text-muted-foreground max-h-48">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function EventErrorInline({
  error,
  reset,
  message = 'Something went wrong',
}: {
  error: Error
  reset: () => void
  message?: string
}) {
  useEffect(() => {
    logError('Inline event error', error)
  }, [error])

  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">{message}</p>
          <Button
            variant="link"
            size="sm"
            onClick={reset}
            className="h-auto p-0 text-destructive hover:text-destructive/80"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
