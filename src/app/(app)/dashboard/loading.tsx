export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-7 px-4 py-5 sm:px-7 sm:py-7 lg:px-9" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-[270px] animate-pulse rounded-[28px] bg-surface-container" />
      <div className="space-y-3">
        <div className="h-7 w-44 animate-pulse rounded bg-surface-container" />
        <div className="h-[116px] animate-pulse rounded-2xl bg-surface-container" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]">
        <div className="h-[250px] animate-pulse rounded-2xl bg-surface-container" />
        <div className="h-[250px] animate-pulse rounded-2xl bg-surface-container" />
      </div>
    </div>
  )
}
