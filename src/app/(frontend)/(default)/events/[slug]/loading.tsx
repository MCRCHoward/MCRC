import { Calendar, Clock, MapPin, Globe, CreditCard } from 'lucide-react'

export default function EventLoading() {
  return (
    <article className="py-16 md:py-24">
      <div className="container max-w-7xl">
        {/* Hero Section Skeleton */}
        <header className="mb-12 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-3">
            <div className="mx-auto h-12 w-full max-w-3xl animate-pulse rounded-md bg-muted md:h-16" />
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded-md bg-muted" />
          </div>

          {/* Event Details Bar Skeleton */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </header>

        {/* Featured Image Skeleton */}
        <div className="mb-12 overflow-hidden rounded-lg border">
          <div className="aspect-video w-full animate-pulse bg-muted" />
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Content Column Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6 rounded-lg border bg-card p-6">
              <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              <div className="h-px bg-border" />

              {/* Date & Time Skeleton */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>

              {/* Location Skeleton */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>

              {/* Pricing Skeleton */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* CTA Button Skeleton */}
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted/60" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}
