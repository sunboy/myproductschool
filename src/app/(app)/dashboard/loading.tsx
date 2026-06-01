export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8" aria-busy="true">
      {/* Greeting hero */}
      <div className="mb-6 space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-4 w-80 animate-pulse rounded bg-surface-container" />
      </div>
      {/* Stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    </div>
  )
}
