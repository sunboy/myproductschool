import Link from 'next/link'
import type { StudyPlanWithItems } from '@/lib/types'

interface EnrolledPlansCardProps {
  plans: StudyPlanWithItems[]
}

export function EnrolledPlansCard({ plans }: EnrolledPlansCardProps) {
  if (plans.length === 0) return null

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline font-semibold text-base text-on-surface">My Study Plans</h3>
        <Link href="/explore/plans" className="text-xs text-primary font-bold hover:underline">View all →</Link>
      </div>
      <div className="space-y-3">
        {plans.slice(0, 3).map(plan => (
          <Link
            key={plan.id}
            href={`/explore/plans/${plan.slug}`}
            className="flex items-center gap-3 hover:bg-surface-container-high rounded-lg p-2 -mx-2 transition-colors group"
          >
            <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                {plan.icon ?? 'school'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-label text-sm font-bold text-on-surface truncate">{plan.title}</div>
              <div className="mt-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${plan.progress_percentage}%` }} />
              </div>
              <div className="text-[10px] text-on-surface-variant mt-0.5">
                {plan.completed_count}/{plan.item_count} done · {plan.progress_percentage}%
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
