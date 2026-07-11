'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { HatchSays } from '@/components/redesign/HatchSays'
import { ProTipStrip } from '@/components/redesign/ProTipStrip'
import type { StudyPlanWithItems } from '@/lib/types'
import { DisciplineTile, type Discipline } from '@/components/redesign/DisciplineTile'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_STUDY_PLAN_VIEWED } from '@/lib/posthog/events'

interface Props {
  studyPlans: StudyPlanWithItems[]
  enrolledPlans: StudyPlanWithItems[]
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

  // Hero HatchSays: names the specific enrolled plan and where the user left
  // off, with a working Continue CTA. Without a real enrollment it falls back
  // to a starter line pointing at the plans grid — no invented state.
  const remaining = continuePlan ? continuePlan.item_count - continuePlan.completed_count : 0
  const hatchMessage = continuePlan
    ? `${continuePlan.title} is ${continuePlan.progress_percentage}% done. ${
        remaining === 1 ? 'One challenge left to finish it.' : `${remaining} challenges left to finish it.`
      }`
    : 'Pick one plan and run it to the end. Sequenced reps compound; scattered ones stall.'

  const continueDiscipline = continuePlan ? disciplineForPlan(continuePlan) : null
  const nextStep = continuePlan ? Math.min(continuePlan.completed_count + 1, continuePlan.item_count) : 0

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 sm:py-5">
      {/* ── Compact dense dark hero band (spec §1 amendment: library hubs keep
          the approved previews' dark heroes; study-plans-1440.png) ── */}
      <div
        data-tour-target="study-plans-hero"
        className="relative overflow-hidden rounded-2xl px-[26px] py-6 text-white"
        style={{
          background:
            'linear-gradient(120deg, var(--color-forest-950) 0%, var(--color-forest-900) 45%, var(--color-forest-850) 75%, var(--color-forest-700) 130%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(30,71,45,.55) 0%, rgba(30,71,45,0) 70%)' }}
        />
        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="min-w-0 lg:pr-32">
            <div className="mb-2 font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-mint-glow">
              Study plans
            </div>
            <h1 className="mb-2 max-w-[26ch] font-headline text-[30px] font-semibold leading-[1.18] text-[#f9faf5]">
              Follow a path. Ship a skill.
            </h1>
            <p className="max-w-[52ch] text-[13px] leading-[1.5] text-white/72">
              Structured, multi-day sequences that build one capability at a time, so practice compounds instead of scattering.
            </p>
          </div>

          <div className="relative flex items-center lg:col-start-2">
            {/* Pointing mascot sits between the copy and the HatchSays card,
                per study-plans-1440.png (hidden at narrow widths). */}
            <div className="pointer-events-none absolute -left-[150px] bottom-[-28px] z-[1] hidden w-[132px] lg:block">
              <HatchImage state="pointing" size={132} priority className="drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
            </div>
            <HatchSays
              className="relative z-10 w-full"
              tint="mint"
              message={hatchMessage}
              ctaLabel={continuePlan ? 'Continue plan' : 'Browse plans'}
              ctaHref={continuePlan ? `/explore/plans/${continuePlan.slug}` : '#all-plans'}
            />
          </div>
        </div>
      </div>

      {/* ── Continue-your-plan strip (icon tile + name + progress + step chip
          + Continue button; real enrollment only) ── */}
      {continuePlan && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-hairline bg-card-bright px-4 py-3.5">
          {continueDiscipline && <DisciplineTile discipline={continueDiscipline} />}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.05em] text-ink-muted">
                Continue your plan
              </span>
              <span className="whitespace-nowrap text-[15px] font-bold text-ink-strong">
                {continuePlan.title}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-hairline">
                <div
                  className="h-full rounded-full bg-forest-600"
                  style={{ width: `${Math.max(0, Math.min(100, continuePlan.progress_percentage))}%` }}
                />
              </div>
              <span className="whitespace-nowrap text-[13px] font-extrabold tabular-nums text-forest-700">
                {continuePlan.progress_percentage}%
              </span>
              {continuePlan.item_count > 0 && (
                <span className="whitespace-nowrap rounded-full border border-hairline bg-page-field px-2.5 py-[3px] text-[11.5px] font-bold tabular-nums text-ink-secondary">
                  Step {nextStep} of {continuePlan.item_count}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/explore/plans/${continuePlan.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-950 px-[18px] py-[9px] text-[12.5px] font-extrabold text-white no-underline max-sm:w-full max-sm:justify-center"
          >
            {continuePlan.progress_percentage > 0 ? 'Continue' : 'Start plan'}
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
          <div id="all-plans" className="mb-1 mt-5 flex items-baseline justify-between">
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

          {/* Preview shows the loop-tracks section below the grid on the
              default view; the Interview loops tab is a focused shortcut. */}
          {hasLoops && (
            <>
              <div className="mb-1 mt-6 flex items-baseline justify-between">
                <div>
                  <div className="font-body text-[17px] font-bold text-ink-strong">Interview loop tracks</div>
                  <div className="mt-0.5 text-[12.5px] text-ink-muted">Multi-round sequences matched to a target role</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tracks.loopRows.map(loop => (
                  <LoopCard key={loop.id} loop={loop} />
                ))}
              </div>
            </>
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

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.loopRows.map(loop => (
              <LoopCard key={loop.id} loop={loop} />
            ))}
          </div>
        </>
      )}

      <ProTipStrip
        lead="One plan at a time."
        tip="Two plans in parallel stall both. Pick the capability you need next, finish the sequence, then enroll in the next one."
        ctaLabel="See your progress"
        ctaHref="/progress"
      />
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
      {/* Icon tile treatment per study-plans-1440.png plan cards (spec §9.3:
          the 44px tile is allowed on featured/plan/loop cards). Only rendered
          when the plan carries a real discipline signal. */}
      {discipline && <DisciplineTile discipline={discipline} className="mb-3" />}
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

/**
 * Interview-loop card per study-plans-1440.png: icon tile + "Interview loop"
 * eyebrow + loop name, with a working Start/Resume link on the right.
 */
function LoopCard({ loop }: { loop: StudyPlanWithItems }) {
  const discipline = disciplineForPlan(loop)
  const hasProgress = loop.progress_percentage > 0
  const ctaLabel = hasProgress ? 'Resume' : 'Start loop'

  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-hairline bg-card-bright p-4">
      {discipline && <DisciplineTile discipline={discipline} />}
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-forest-700">
          Interview loop
        </div>
        <div className="mt-0.5 truncate text-[14px] font-bold text-ink-strong">{loop.title}</div>
        {hasProgress && (
          <div className="mt-0.5 text-[11.5px] font-bold tabular-nums text-ink-muted">
            {loop.completed_count} of {loop.item_count} done · {loop.progress_percentage}%
          </div>
        )}
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
