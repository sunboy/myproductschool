'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import type { StudyPlanWithItems } from '@/lib/types'
import type { Discipline } from '@/components/redesign/DisciplineTile'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_STUDY_PLAN_VIEWED } from '@/lib/posthog/events'

interface Props {
  studyPlans: StudyPlanWithItems[]
  enrolledPlans: StudyPlanWithItems[]
}

const EYEBROW_FG_CLASS: Record<Discipline, string> = {
  'system-design': 'text-sd-fg',
  'product-sense': 'text-ps-fg',
  'data-modeling': 'text-dm-fg',
  sql: 'text-sql-fg',
  'ai-ml': 'text-aiml-fg',
}

const DISCIPLINE_LABEL: Record<Discipline, string> = {
  'system-design': 'System design',
  'product-sense': 'Product sense',
  'data-modeling': 'Data modeling',
  sql: 'SQL & tooling',
  'ai-ml': 'AI / ML',
}

/**
 * study_plans.disciplines / move_tag has no dedicated taxonomy for the
 * study-plan grid — most rows carry an empty disciplines[] array (see
 * getStudyPlanSummaries live check). Derive a real eyebrow from whatever
 * signal the row actually has (first discipline tag, else move_tag), and
 * omit the eyebrow entirely rather than invent one.
 */
function disciplineForPlan(plan: StudyPlanWithItems): Discipline | null {
  const first = plan.disciplines?.[0]
  if (first) {
    if (first === 'system_design') return 'system-design'
    if (first === 'data_modeling') return 'data-modeling'
    if (first === 'coding') return 'sql'
    if (first === 'product_sense') return 'product-sense'
  }
  switch (plan.move_tag) {
    case 'frame':
    case 'list':
    case 'optimize':
    case 'win':
      return 'product-sense'
    default:
      return null
  }
}

function planMetaLine(plan: StudyPlanWithItems): string {
  const bits: string[] = []
  if (plan.chapter_count > 0) bits.push(`${plan.chapter_count} ${plan.chapter_count === 1 ? 'chapter' : 'chapters'}`)
  if ((plan.item_count ?? 0) > 0) bits.push(`${plan.item_count} ${plan.item_count === 1 ? 'challenge' : 'challenges'}`)
  if (plan.difficulty) bits.push(plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1))
  return bits.join(' · ')
}

export function StudyPlansClient({ studyPlans, enrolledPlans }: Props) {
  const [activeTab, setActiveTab] = useState<'study_plan' | 'loop'>('study_plan')

  useEffect(() => {
    trackEvent(EVENT_STUDY_PLAN_VIEWED, { plan_slug: 'all' })
  }, [])

  const tracks = useMemo(() => {
    const studyPlanRows = studyPlans.filter(p => (p.track_type ?? 'study_plan') === 'study_plan')
    const loopRows = studyPlans.filter(p => p.track_type === 'loop')
    return { studyPlanRows, loopRows }
  }, [studyPlans])

  const hasLoops = tracks.loopRows.length > 0

  // Continue band: most-recently-active enrolled plan with real progress.
  // getEnrolledPlans already orders by last_active_at desc.
  const continuePlan = enrolledPlans.find(p => p.progress_percentage > 0) ?? enrolledPlans[0] ?? null

  // Hatch header note: names the specific enrolled plan and where the user
  // left off. Falls back to nothing (omitted) if there's no real enrollment
  // to reference — no generic filler per spec §4.
  const headerNote = continuePlan
    ? `${continuePlan.completed_count} of ${continuePlan.item_count} challenges done in ${continuePlan.title}. ${
        continuePlan.item_count - continuePlan.completed_count === 1
          ? 'One left to finish it.'
          : `${continuePlan.item_count - continuePlan.completed_count} left to finish it.`
      }`
    : null

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 sm:py-5">
      {/* ── Compact light page header (spec §1) ── */}
      <div
        data-tour-target="study-plans-hero"
        className="flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-headline text-[28px] font-bold leading-tight text-ink-strong">
            Study <span className="hl-word">plans</span>
          </h1>
          <p className="mt-1 max-w-[480px] text-[13.5px] leading-[1.45] text-ink-secondary">
            Sequenced reps with a fixed order and an end.
          </p>
        </div>

        {headerNote && (
          <div className="note-mint flex max-w-[320px] shrink-0 items-center gap-2.5 px-3 py-2.5">
            <HatchImage state="avatar" size={28} className="rounded-full" />
            <p className="text-[12.5px] leading-[1.4] text-ink-secondary">
              <b className="font-extrabold text-ink-strong">Hatch:</b> {headerNote}
            </p>
          </div>
        )}
      </div>

      {/* ── Continue band (slim amber note, real progress) ── */}
      {continuePlan && (
        <div className="note-amber mt-3.5 flex flex-wrap items-center gap-4 px-4 py-2.5">
          <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.05em] text-ink-muted">
            Continue
          </span>
          <span className="shrink-0 whitespace-nowrap text-[14.5px] font-bold text-ink-strong">
            {continuePlan.title}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[12.5px] font-bold tabular-nums text-ink-secondary">
            {continuePlan.completed_count} of {continuePlan.item_count} done
          </span>
          <div className="h-2 max-w-[220px] flex-1 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-forest-600"
              style={{ width: `${Math.max(0, Math.min(100, continuePlan.progress_percentage))}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-[13px] font-extrabold tabular-nums text-forest-700">
            {continuePlan.progress_percentage}%
          </span>
          <div className="flex-1 max-sm:hidden" />
          <Link
            href={`/explore/plans/${continuePlan.slug}`}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-950 px-[18px] py-[9px] text-[12.5px] font-extrabold text-white no-underline max-sm:ml-0 max-sm:w-full max-sm:justify-center"
          >
            Continue {continuePlan.title}
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* ── Track tabs ── */}
      {hasLoops && (
        <div className="mt-5 flex items-center gap-6 overflow-x-auto border-b border-hairline">
          <button
            type="button"
            onClick={() => setActiveTab('study_plan')}
            className={`shrink-0 whitespace-nowrap border-b-[2.5px] px-0.5 py-2.5 text-[13.5px] font-bold ${
              activeTab === 'study_plan'
                ? 'border-forest-700 text-forest-700'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Study plans
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loop')}
            className={`shrink-0 whitespace-nowrap border-b-[2.5px] px-0.5 py-2.5 text-[13.5px] font-bold ${
              activeTab === 'loop'
                ? 'border-forest-700 text-forest-700'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Interview loops
          </button>
        </div>
      )}

      {/* ── Plans grid ── */}
      {activeTab === 'study_plan' && (
        <>
          <div className="mb-1 mt-5 flex items-baseline justify-between">
            <div>
              <div className="font-body text-[17px] font-bold text-ink-strong">All study plans</div>
              <div className="mt-0.5 text-[12.5px] text-ink-muted">
                {tracks.studyPlanRows.length} {tracks.studyPlanRows.length === 1 ? 'plan' : 'plans'}, one capability each
              </div>
            </div>
          </div>

          {tracks.studyPlanRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-muted">No study plans yet.</div>
          ) : (
            <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.studyPlanRows.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Loop tracks ── */}
      {activeTab === 'loop' && hasLoops && (
        <>
          <div className="mb-1 mt-5 flex items-baseline justify-between">
            <div>
              <div className="font-body text-[17px] font-bold text-ink-strong">Interview loop tracks</div>
              <div className="mt-0.5 text-[12.5px] text-ink-muted">Multi-round sequences matched to a target role</div>
            </div>
          </div>

          <div className="mt-2.5 flex flex-col border-t border-hairline">
            {tracks.loopRows.map(loop => (
              <LoopRow key={loop.id} loop={loop} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PlanCard({ plan }: { plan: StudyPlanWithItems }) {
  const discipline = disciplineForPlan(plan)
  const isEnrolled = plan.is_enrolled ?? false
  const hasProgress = plan.progress_percentage > 0
  const meta = planMetaLine(plan)

  // Day-dots only render when the plan's chapter count is small enough to
  // read as a day sequence (per task: "day-dots only where chapter counts
  // exist"). Cap at 10 so an unrelated 30-chapter plan doesn't render an
  // unreadable dot strip.
  const showDayDots = plan.chapter_count > 0 && plan.chapter_count <= 10
  const doneDays = showDayDots
    ? Math.min(plan.chapter_count, Math.round((plan.progress_percentage / 100) * plan.chapter_count))
    : 0

  const ctaLabel = hasProgress
    ? showDayDots
      ? `Start Day ${Math.min(doneDays + 1, plan.chapter_count)}`
      : 'Continue'
    : isEnrolled
    ? 'Begin'
    : 'Start'

  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-card-bright p-4">
      {discipline && (
        <div className={`mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.04em] ${EYEBROW_FG_CLASS[discipline]}`}>
          {DISCIPLINE_LABEL[discipline]}
        </div>
      )}
      <div className="mb-1.5 min-h-[40px] font-body text-[15.5px] font-bold leading-[1.32] text-ink-strong">
        {plan.title}
      </div>
      {meta && <div className="mb-2 text-xs font-bold tabular-nums text-ink-muted">{meta}</div>}
      {plan.description && (
        <p className="mb-3 flex-1 text-[12.5px] leading-[1.45] text-ink-secondary">{plan.description}</p>
      )}

      {showDayDots ? (
        <div className="mb-3 flex gap-1.5">
          {Array.from({ length: plan.chapter_count }).map((_, i) => (
            <div
              key={i}
              className={
                i < doneDays
                  ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-forest-600'
                  : 'size-3.5 shrink-0 rounded-full border-[1.4px] border-ink-muted/40'
              }
            >
              {i < doneDays && <Check size={13} strokeWidth={2.2} className="text-white" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-forest-600"
              style={{ width: `${Math.max(0, Math.min(100, plan.progress_percentage))}%` }}
            />
          </div>
          <span className="text-[11px] font-extrabold tabular-nums text-forest-700">{plan.progress_percentage}%</span>
        </div>
      )}

      <Link
        href={`/explore/plans/${plan.slug}`}
        className="mt-auto flex w-full items-center justify-center rounded-lg bg-forest-950 py-2.5 text-[13px] font-extrabold text-white no-underline"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}

function LoopRow({ loop }: { loop: StudyPlanWithItems }) {
  const isEnrolled = loop.is_enrolled ?? false
  const hasProgress = loop.progress_percentage > 0
  const meta = hasProgress
    ? `${loop.completed_count} of ${loop.item_count} done · ${loop.progress_percentage}%`
    : isEnrolled
    ? 'Enrolled · not started'
    : 'Not started'
  const ctaLabel = hasProgress ? 'Resume' : 'Start loop'

  return (
    <div className="flex items-center gap-3.5 border-b border-hairline py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-[13.5px] font-extrabold text-ink-strong">{loop.title}</span>
        <span className="text-xs font-bold tabular-nums text-ink-muted">{meta}</span>
      </div>
      <Link
        href={`/explore/plans/${loop.slug}`}
        className="shrink-0 whitespace-nowrap rounded-lg border border-hairline bg-white px-3.5 py-2 text-xs font-extrabold text-ink-strong no-underline"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
