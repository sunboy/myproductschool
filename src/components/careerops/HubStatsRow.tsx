'use client'

import { MotionList, MotionListItem } from '@/components/motion/primitives'
import { CountUp } from '@/components/careerops/report/CountUp'
import { gradeClasses } from '@/components/careerops/grade'
import type { Application } from '@/components/careerops/useCareerApplications'
import type { FitGrade } from '@/lib/careerops/types'

interface HubStatsRowProps {
  applications: Application[]
  loading: boolean
}

const STATUS_LABEL: Record<string, string> = {
  saved: 'saved',
  applied: 'applied',
  interviewing: 'interviewing',
  offer: 'offer',
}

const PIPELINE_STATUSES = ['interviewing', 'offer'] as const

function PipelineSummary({ applications }: { applications: Application[] }) {
  const counts = PIPELINE_STATUSES.map((s) => ({
    label: STATUS_LABEL[s],
    count: applications.filter((a) => a.status === s).length,
  })).filter((c) => c.count > 0)

  if (counts.length === 0) {
    return <span className="font-body text-sm text-on-surface-variant">No active pipeline</span>
  }

  return (
    <span className="font-body text-sm text-on-surface">
      {counts.map((c, i) => (
        <span key={c.label}>
          {i > 0 && <span className="mx-1 text-on-surface-variant">·</span>}
          <strong className="font-semibold">{c.count}</strong> {c.label}
        </span>
      ))}
    </span>
  )
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-surface-container-low p-4">
      <div className="mb-2 h-3 w-24 rounded-full bg-surface-container-highest" />
      <div className="h-8 w-16 rounded-full bg-surface-container-highest" />
    </div>
  )
}

export function HubStatsRow({ applications, loading }: HubStatsRowProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  const activeCount = applications.filter(
    (a) => a.status !== 'rejected' && a.status !== 'archived',
  ).length

  const graded = applications.filter((a) => a.fit_grade != null)
  let bestGrade: string | null = null
  if (graded.length > 0) {
    const ORDER: FitGrade[] = ['A', 'B', 'C', 'D', 'F']
    for (const g of ORDER) {
      if (graded.some((a) => a.fit_grade === g)) {
        bestGrade = g
        break
      }
    }
  }

  return (
    <MotionList className="grid gap-3 sm:grid-cols-3">
      {/* Active applications */}
      <MotionListItem className="rounded-2xl bg-surface-container-low p-4">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Active applications
        </p>
        <p className="mt-1 font-headline text-3xl font-bold text-on-surface">
          <CountUp value={activeCount} />
        </p>
      </MotionListItem>

      {/* Best fit score */}
      <MotionListItem className="rounded-2xl bg-surface-container-low p-4">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Best fit grade
        </p>
        <div className="mt-1 flex items-center gap-2">
          {bestGrade ? (
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl font-headline text-xl font-bold ${gradeClasses(bestGrade as FitGrade)}`}
            >
              {bestGrade}
            </span>
          ) : (
            <span className="font-headline text-3xl font-bold text-on-surface-variant">—</span>
          )}
        </div>
      </MotionListItem>

      {/* Pipeline summary */}
      <MotionListItem className="rounded-2xl bg-surface-container-low p-4">
        <p className="font-label text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Pipeline
        </p>
        <div className="mt-2">
          <PipelineSummary applications={applications} />
        </div>
      </MotionListItem>
    </MotionList>
  )
}
