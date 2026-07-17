import Link from 'next/link'
import { Play, ArrowRight } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { HatchSays } from '@/components/redesign/HatchSays'
import { difficultyLabel } from '@/lib/utils'
import type { ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'

export interface WeeklyGoalData {
  done: number
  goal: number
}

export interface DashboardHeroProps {
  displayName: string
  action: ResumeOrStartAction
  /** Curated first-rep scenario opener (flow challenges only) — null falls back to a generic day-0 line. */
  firstRepScenario?: {
    context: string
    difficulty: string | null
  } | null
  /** Present only for the resume/next states — absent on day 0 (no week exists yet). */
  weeklyGoal?: WeeklyGoalData | null
  hatchMessage: string
  hatchCtaLabel?: string
  hatchCtaHref?: string
}

function highlightWord(headline: string, word: string): React.ReactNode {
  const idx = headline.toLowerCase().indexOf(word.toLowerCase())
  if (idx === -1) return headline
  const before = headline.slice(0, idx)
  const match = headline.slice(idx, idx + word.length)
  const after = headline.slice(idx + word.length)
  return (
    <>
      {before}
      <span className="hl-word">{match}</span>
      {after}
    </>
  )
}

/**
 * Dense dark hero, per spec §1 "heroes: dense or dead" and previews/round4/
 * dashboard*.html. Renders three distinct layouts driven by resumeOrStartAction.kind:
 * resume (3-col: headline+focus / weekly ring / HatchSays), first (2-col: eyebrow+
 * scenario+CTA / HatchSays, no ring — no week exists yet), next (same 3-col shape
 * as resume, one-line headline; the challenge title lives in the dot+title block).
 */
export function DashboardHero({
  displayName,
  action,
  firstRepScenario,
  weeklyGoal,
  hatchMessage,
  hatchCtaLabel,
  hatchCtaHref,
}: DashboardHeroProps) {
  if (action.kind === 'first') {
    const title = action.title ?? 'Your first rep'
    return (
      <div
        data-hatch-target="dashboard-hero"
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
        <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex min-w-0 flex-col">
            <div className="mb-2 font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-white/55">
              Your first rep
            </div>
            <h1 className="mb-3 max-w-[36ch] font-headline text-[27px] font-semibold leading-[1.22] text-on-hero-strong">
              {highlightWord(title, extractHighlightWord(title))}
            </h1>
            {firstRepScenario?.context && (
              <p className="mb-3.5 max-w-[62ch] text-[13px] leading-[1.55] text-white/72">
                {firstRepScenario.context}
              </p>
            )}
            <div>
              {/* Same anchor contract as the resume/next CTA below — see the
                  comment there. A brand-new user still needs this marker
                  present on first paint. */}
              <Link
                href={action.href}
                data-hatch-target="dashboard-session"
                className="inline-flex items-center gap-2 rounded-[10px] border border-white/16 bg-forest-600 px-[18px] py-[11px] text-[13.5px] font-extrabold text-white no-underline shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
              >
                Start your first rep
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </div>
          </div>

          <div className="relative flex items-end">
            <HatchSays message={hatchMessage} tint="mint" className="relative z-10 w-full" />
            {/* Mascot pose: in front of the card (behind it, the bubble cut the
                image off), smaller, tucked into the card's bottom-right corner.
                Hidden at narrow widths per the preview's media query. */}
            <div className="pointer-events-none absolute -bottom-4 -right-3 z-20 hidden w-[84px] lg:block">
              <HatchImage state="thinking" size={84} priority className="drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // resume | next — same dense 3-column shape.
  const isResume = action.kind === 'resume'
  const headline = isResume ? 'Pick up where you left off.' : 'Your next rep is ready.'
  const highlight = isResume ? 'left off' : 'ready'

  return (
    <div
      data-hatch-target="dashboard-hero"
      className="relative overflow-hidden rounded-2xl px-[26px] py-4 text-white"
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
      <div className="relative z-10 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_190px]">
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 text-[13.5px] font-bold text-white/85">Welcome back, {displayName}</div>
          <h1 className="mb-2.5 max-w-[32ch] font-headline text-[26px] font-semibold leading-[1.2] text-on-hero-strong">
            {highlightWord(headline, highlight)}
          </h1>

          {isResume && (
            <div className="mb-1 font-label text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-white/55">
              In Progress
            </div>
          )}
          <div className="mb-1 flex items-center gap-2">
            <span className="size-[7px] shrink-0 rounded-full bg-on-hero-accent" />
            <span className="font-body text-[16.5px] font-bold text-white">{action.title}</span>
          </div>
          <div className="mb-2.5 text-[12.5px] leading-[1.45] text-white/68">
            {isResume
              ? `${capitalize(inferStepMove(action))}, step ${action.step ?? 1} of ${action.totalSteps ?? 4}. ${remainingMoves(action)} follow.`
              : (action.domain ? `${action.domain} · ` : '') + (action.difficulty ? difficultyLabel(action.difficulty) : '')}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* data-hatch-target="dashboard-session" is a real anchor: the
                main Shepherd tour's "session" step AND e2e/proactive-hatch.spec.ts
                both require this exact marker attached on the dashboard's
                primary CTA. Do not rename. */}
            <Link
              href={action.href}
              data-hatch-target="dashboard-session"
              className="inline-flex items-center gap-2 rounded-lg bg-forest-600 px-[18px] py-2.5 text-[13px] font-extrabold text-white no-underline shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
            >
              <Play size={13} strokeWidth={0} fill="currentColor" />
              {isResume ? `Resume ${capitalize(inferStepMove(action))} step` : 'Start challenge'}
            </Link>
          </div>
        </div>

        {weeklyGoal && (
          <div className="flex items-center gap-3.5">
            <div
              className="relative flex size-[72px] shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-gold) 0deg ${Math.min(360, (weeklyGoal.done / Math.max(1, weeklyGoal.goal)) * 360)}deg, rgba(255,255,255,.14) ${Math.min(360, (weeklyGoal.done / Math.max(1, weeklyGoal.goal)) * 360)}deg 360deg)`,
              }}
            >
              <div className="flex size-[57px] flex-col items-center justify-center rounded-full bg-forest-900">
                <span className="font-body text-sm font-extrabold tabular-nums text-white">
                  {weeklyGoal.done}/{weeklyGoal.goal}
                </span>
                <span className="text-[8px] text-white/60">Weekly Goal</span>
              </div>
            </div>
          </div>
        )}

        {/* lg:col-start-3 pins this to the 190px column even when the weekly
            goal ring is absent — without it the grid auto-places the HatchSays
            card (and the mascot) into the middle column. */}
        <div className="relative flex items-center lg:col-start-3">
          <div className="relative z-10 w-full rounded-xl bg-note-mint px-[15px] py-[13px]">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-forest-800">
              <HatchImage state="avatar" size={16} className="rounded-full" />
              Hatch says
            </div>
            <div className="mb-2.5 text-xs leading-[1.45] text-ink-strong">{hatchMessage}</div>
            {hatchCtaHref && hatchCtaLabel && (
              <Link
                href={hatchCtaHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest-800 px-[11px] py-1.5 text-[11.5px] font-bold text-white no-underline"
              >
                {hatchCtaLabel}
              </Link>
            )}
          </div>
          {/* Mascot pose: IN FRONT of the card (it used to sit behind at z-[2],
              which read as the bubble cutting the image off), smaller and
              tucked into the card's empty bottom-right corner. Hidden at
              narrow widths per the preview's media query. */}
          <div className="pointer-events-none absolute -bottom-4 -right-3 z-20 hidden w-[84px] lg:block">
            <HatchImage state="thinking" size={84} priority className="drop-shadow-[0_10px_18px_rgba(0,0,0,.35)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const FLOW_ORDER = ['frame', 'list', 'optimize', 'win']

function inferStepMove(action: ResumeOrStartAction): string {
  if (action.kind === 'resume' && action.step) {
    return FLOW_ORDER[Math.max(0, Math.min(3, action.step - 1))]
  }
  return 'frame'
}

function remainingMoves(action: ResumeOrStartAction): string {
  if (action.kind !== 'resume' || !action.step) return 'List, Optimize, and Win'
  const remaining = FLOW_ORDER.slice(action.step).map(capitalize)
  if (remaining.length === 0) return 'Nothing else'
  if (remaining.length === 1) return remaining[0]
  return `${remaining.slice(0, -1).join(', ')}, and ${remaining[remaining.length - 1]}`
}

function extractHighlightWord(title: string): string {
  const words = title.trim().split(/\s+/)
  return words[words.length - 1] ?? title
}
