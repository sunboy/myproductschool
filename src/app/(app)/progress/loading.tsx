export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6" aria-busy="true">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-surface-container-high" />
      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
        ))}
      </div>
      {/* Radar / hexagon + ladder */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-surface-container" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface-container" />
      </div>
    </div>
  )
}
