export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7" aria-busy="true">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-surface-container-high" />
          <div className="h-8 w-72 max-w-[70vw] animate-pulse rounded-lg bg-surface-container" />
        </div>
        <div className="hidden h-8 w-28 animate-pulse rounded-full bg-surface-container sm:block" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="h-[344px] animate-pulse rounded-[28px] bg-surface-container" />
        <div className="grid content-start gap-5">
          <div className="h-[244px] animate-pulse rounded-[24px] bg-surface-container" />
          <div className="h-[288px] animate-pulse rounded-[24px] bg-surface-container-high" />
        </div>
      </div>
      <div className="mt-5 grid gap-5">
        <div className="h-[104px] animate-pulse rounded-[22px] bg-surface-container" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.98fr)_minmax(340px,0.62fr)]">
          <div className="space-y-4">
            <div className="h-[248px] animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-[220px] animate-pulse rounded-2xl bg-surface-container" />
          </div>
          <div className="space-y-4">
            <div className="h-[188px] animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-[244px] animate-pulse rounded-2xl bg-surface-container" />
          </div>
        </div>
      </div>
    </div>
  )
}
