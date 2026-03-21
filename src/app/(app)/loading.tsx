export default function AppLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Skeleton header */}
      <div className="h-8 w-48 bg-surface-container-high rounded-lg animate-pulse" />
      <div className="h-4 w-64 bg-surface-container-high rounded animate-pulse" />
      {/* Skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-32 bg-surface-container rounded-2xl border border-outline-variant animate-pulse" />
        ))}
      </div>
    </div>
  )
}
