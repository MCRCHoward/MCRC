export default function RoadmapLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-64 bg-muted animate-pulse rounded" />
          <div className="h-5 w-96 bg-muted animate-pulse rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-8">
        <section>
          <div className="h-7 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="h-96 bg-muted animate-pulse rounded" />
        </section>
        <section>
          <div className="h-7 w-40 bg-muted animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

