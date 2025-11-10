import { Skeleton } from '@/components/ui/skeleton'

export default function EventPageLoading() {
  return (
    <div className="container max-w-7xl py-16 md:py-24">
      <div className="mb-12 space-y-6 text-center">
        <Skeleton className="mx-auto h-6 w-24" />
        <Skeleton className="mx-auto h-12 w-3/4 max-w-3xl" />
        <Skeleton className="mx-auto h-6 w-1/2 max-w-2xl" />
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <Skeleton className="mb-12 aspect-video w-full rounded-lg" />

      <div className="grid gap-12 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6 rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
      </div>
    </div>
  )
}
