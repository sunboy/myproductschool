export default function ExploreLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-7 pb-24 sm:px-6 lg:px-8" aria-busy="true">
      {/* Hero header */}
      <div className="mb-8 h-44 animate-pulse rounded-[26px] bg-surface-container-low" />
      {/* Three-up row */}
      <div className="mb-9 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
      {/* Four-up row */}
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
    </div>
  )
}
