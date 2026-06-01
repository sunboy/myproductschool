export default function ChallengesLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6" aria-busy="true">
      {/* Title + filter bar */}
      <div className="mb-6 space-y-3">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-container-high" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-surface-container" />
          ))}
        </div>
      </div>
      {/* Challenge card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    </div>
  )
}
