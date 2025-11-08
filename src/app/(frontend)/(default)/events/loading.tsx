import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { FileText } from 'lucide-react'

export default function EventsLoading() {
  return (
    <section className="mt-32 bg-muted/60 py-16">
      <div className="container mx-auto">
        <div className="relative mx-auto flex max-w-screen-xl flex-col gap-12 lg:flex-row lg:gap-20">
          {/* Filters Skeleton */}
          <header className="top-24 flex h-fit flex-col items-center gap-5 text-center lg:sticky lg:max-w-xs lg:items-start lg:gap-8 lg:text-left">
            <FileText className="h-14 w-14" strokeWidth={1} aria-hidden="true" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Separator />

            <nav className="mt-2 flex flex-wrap items-center justify-center gap-2 lg:flex-col lg:items-start lg:gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </nav>
          </header>

          {/* Event Grid Skeleton */}
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function EventCardSkeleton() {
  return (
    <article className="relative isolate min-h-[400px] w-full overflow-hidden rounded-lg bg-background shadow-sm">
      {/* Image Skeleton */}
      <Skeleton className="h-64 w-full" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="mb-3 h-7 w-full" />
        <Skeleton className="mb-1 h-6 w-5/6" />

        <div className="mt-auto space-y-2 border-t pt-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <Skeleton className="mt-4 h-4 w-24" />
      </div>
    </article>
  )
}
