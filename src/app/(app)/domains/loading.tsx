export default function DomainsLoading() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8" aria-busy="true">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="h-4 w-72 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    </div>
  )
}
