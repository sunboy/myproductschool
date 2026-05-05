import Link from 'next/link'
import type { StudyPlanWithItems } from '@/lib/types'

interface EnrolledPlansCardProps {
  plans: StudyPlanWithItems[]
}

const PLAN_TONES = [
  {
    bar: 'bg-primary',
    marker: 'bg-primary',
  },
  {
    bar: 'bg-tertiary',
    marker: 'bg-tertiary',
  },
  {
    bar: 'bg-flow-frame',
    marker: 'bg-flow-frame',
  },
]

export function EnrolledPlansCard({ plans }: EnrolledPlansCardProps) {
  if (plans.length === 0) return null

  const visiblePlans = plans.slice(0, 2)
  const hiddenCount = plans.length - visiblePlans.length

  return (
    <div className="relative overflow-hidden rounded-2xl border border-tertiary/20 bg-[#f7ecd2] p-4 shadow-[0_18px_46px_-38px_rgba(112,92,48,0.82)]">
      <svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-44 opacity-[0.17]" viewBox="0 0 220 150" fill="none" aria-hidden="true">
        <path d="M48 116 C72 72, 104 102, 132 66 S164 34, 190 52" stroke="#c9933a" strokeWidth="7" strokeLinecap="round" />
        <path d="M92 46 H184 M92 76 H154 M92 106 H176" stroke="#2e3230" strokeWidth="1.5" strokeDasharray="5 8" />
        <circle cx="64" cy="110" r="22" fill="#c9933a" opacity="0.22" />
        <rect x="148" y="36" width="42" height="42" rx="14" fill="#4a7c59" opacity="0.20" />
      </svg>

      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-8 w-1.5 shrink-0 rounded-full bg-tertiary shadow-[0_10px_20px_-14px_rgba(201,147,58,0.95)]" />
          <h3 className="truncate font-headline text-[17px] font-semibold leading-tight text-on-surface">
            Study plans
          </h3>
        </div>
        <Link
          href="/explore/plans"
          className="flex shrink-0 items-center gap-1 rounded-md bg-white/55 px-2 py-1 text-[11px] font-label font-bold text-primary ring-1 ring-tertiary/10 transition-colors hover:bg-white"
        >
          View all
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
      </div>

      <div className="relative space-y-2">
        {visiblePlans.map((plan, index) => {
          const tone = PLAN_TONES[index % PLAN_TONES.length]

          return (
            <Link
              key={plan.id}
              href={`/explore/plans/${plan.slug}`}
              className="group grid grid-cols-[3px_1fr_auto] items-center gap-3 rounded-xl bg-white/62 px-3 py-2.5 shadow-[0_12px_24px_-22px_rgba(112,92,48,0.82)] ring-1 ring-tertiary/10 transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_30px_-23px_rgba(112,92,48,0.95)]"
            >
              <span className={`h-8 rounded-full ${tone.marker}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-label text-[13px] font-extrabold leading-tight text-on-surface">{plan.title}</div>
                  <span className="shrink-0 font-label text-[11px] font-bold text-on-surface-variant tabular-nums">
                    {plan.progress_percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${plan.progress_percentage}%` }} />
                </div>
                <div className="mt-0.5 text-[10px] font-label font-semibold text-on-surface-variant">
                  {plan.completed_count}/{plan.item_count} reps done
                </div>
              </div>
              <span className="material-symbols-outlined text-sm text-on-surface-variant transition-transform group-hover:translate-x-0.5">arrow_forward</span>
            </Link>
          )
        })}
      </div>

      {hiddenCount > 0 && (
        <div className="relative mt-2 pl-1 font-label text-[11px] font-bold text-on-surface-variant">
          +{hiddenCount} more active {hiddenCount === 1 ? 'plan' : 'plans'}
        </div>
      )}
    </div>
  )
}
