'use client'

import { LearningPageHeading } from '@/components/redesign/LearningPageHeading'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight, Minus, Share2, TrendingDown, TrendingUp } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { NoteCard } from '@/components/redesign/NoteCard'
import { StatStrip } from '@/components/redesign/StatStrip'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { Md } from '@/components/ui/Md'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'
import { formatChallengeNumber } from '@/lib/challenges/challengeNumber'
import { levelFromXp } from '@/lib/utils'
import { normalizeToTen } from '@/lib/feedback/score'
import { useLearnerDNAData } from './LearnerDNASection'

/* ── Humanize snake_case archetype labels ─────────────────────────── */


/** Interview history returns the stored /5 score; match the debrief's /10 display. */
function formatInterviewScore(score: number | null | undefined): string | null {
  if (score == null || !Number.isFinite(score)) return null
  return `${normalizeToTen(score, 5).toFixed(1)}/10`
}

/* ── Event label map for activity feed ────────────────────────────── */

const EVENT_LABELS: Record<string, { label: (p: Record<string, unknown>) => string }> = {
  chapter_complete: { label: (p) => `Completed chapter in ${p.module_slug ?? ''}` },
  quick_take_submit: { label: (p) => `Quick take · ${p.move ?? ''}` },
  note_saved: { label: () => 'Saved a note' },
  challenge_complete: { label: () => 'Completed a challenge' },
  live_interview_end: { label: () => 'Finished a live interview' },
}

/* ── FLOW rows — dot colors per previews/round4/progress.html ─────── */

const FLOW_ROWS = [
  { k: 'Frame', move: 'frame', desc: 'Name the real problem before the fix', dotClass: 'bg-sd-fg', barClass: 'bg-sd-fg' },
  { k: 'List', move: 'list', desc: 'Map every stakeholder and option', dotClass: 'bg-ps-fg', barClass: 'bg-ps-fg' },
  { k: 'Optimize', move: 'optimize', desc: 'Pick a criterion and name the tradeoff', dotClass: 'bg-dm-fg', barClass: 'bg-dm-fg' },
  { k: 'Win', move: 'win', desc: 'Name the metric that proves it worked', dotClass: 'bg-sql-fg', barClass: 'bg-sql-fg' },
] as const

interface RecentAttempt {
  id: string
  challenge_id: string
  challenge_title: string
  challenge_type?: string | null
  display_number?: number | null
  pattern_name: string | null
  submitted_at: string
}

interface RecentInterview {
  id: string
  companyName: string
  roleId: string
  status: string
  overallScore: number | null
  grade: string | null
  durationSeconds: number | null
  endedAt: string | null
}

type TrajectoryMove = 'frame' | 'list' | 'optimize' | 'win'
type TrajectoryTrend = 'improving' | 'declining' | 'steady' | 'insufficient_data'

interface TrajectoryCell {
  score: number | null
  trend: TrajectoryTrend
  delta: number
  sampleSize: number
  confidence: number
  history: number[]
  latestEvidence: string | null
}

interface TrajectoryDiscipline {
  key: string
  label: string
  shortLabel: string
  icon: string
  color: string
  href: string
  score: number | null
  sampleSize: number
  confidence: number
  trend: TrajectoryTrend
  delta: number
  cells: Record<TrajectoryMove, TrajectoryCell>
}

interface TrajectoryEvidence {
  id: string
  discipline: string
  move: TrajectoryMove
  score: number
  sourceLabel: string
  title: string
  evidence: string | null
  href: string
  occurredAt: string
}

interface ReasoningTrajectory {
  moves: TrajectoryMove[]
  disciplines: TrajectoryDiscipline[]
  evidence: TrajectoryEvidence[]
  nextFocus: {
    disciplineLabel: string
    moveLabel: string
    href: string
    reason: string
  }
  summary: {
    challengeReps: number
    interviewReps: number
    lowSignalCells: number
    totalSignals: number
  }
}

const TRAJECTORY_MOVE_LABELS: Record<TrajectoryMove, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

/* ── Shared chrome ───────────────────────────────────────────────── */

const CARD_CLASS =
  'rounded-2xl border border-hairline bg-card-bright p-4 shadow-[0_1px_2px_rgba(30,27,20,.04),0_12px_32px_-24px_rgba(30,27,20,.18)]'

function CardTitle({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-body text-[15px] font-bold text-ink-strong">{children}</div>
}

function ViewLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-forest-700 no-underline">
      {children}
      <ChevronRight size={13} strokeWidth={2.2} />
    </Link>
  )
}

/* ── Four-week activity heatmap (user_streaks) ───────────────────── */

function FourWeekHeatmap({ activeDates }: { activeDates: string[] }) {
  const activeSet = new Set(activeDates)
  const today = new Date()
  const dayIdx = (today.getDay() + 6) % 7 // Monday = 0
  const monday = new Date(today)
  monday.setDate(monday.getDate() - dayIdx)

  const rows: { label: string; cells: { iso: string; active: boolean; future: boolean }[] }[] = []
  for (let w = 3; w >= 0; w--) {
    const cells: { iso: string; active: boolean; future: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday)
      day.setDate(day.getDate() - w * 7 + d)
      const iso = day.toISOString().split('T')[0]
      cells.push({ iso, active: activeSet.has(iso), future: day > today })
    }
    rows.push({ label: w === 0 ? 'This week' : `Week ${4 - w}`, cells })
  }

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-[52px_repeat(7,1fr)] gap-1">
        <span />
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-center text-[10px] font-bold text-ink-muted">{d}</span>
        ))}
      </div>
      {rows.map(row => (
        <div key={row.label} className="mb-1 grid grid-cols-[52px_repeat(7,1fr)] items-center gap-1">
          <span className="text-[10.5px] font-bold text-ink-secondary">{row.label}</span>
          {row.cells.map(cell =>
            cell.future ? (
              <span key={cell.iso} className="aspect-square rounded-[5px] border border-hairline/70" />
            ) : (
              <span
                key={cell.iso}
                title={cell.iso}
                className={
                  cell.active
                    ? 'aspect-square scale-[1.08] rounded-[7px] bg-forest-600'
                    : 'aspect-square rounded-[5px] bg-hairline/70'
                }
              />
            )
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Competency radar (learner_competencies via useLearnerDNA) ───── */

function CompetencyRadarSvg({ competencies }: { competencies: { label: string; score: number }[] }) {
  const n = competencies.length
  const cx = 180
  const cy = 140
  const r = 88

  const point = (i: number, radius: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  }
  const ringPoints = (radius: number) =>
    Array.from({ length: n }, (_, i) => point(i, radius).map(v => v.toFixed(1)).join(',')).join(' ')
  const dataPoints = competencies
    .map((c, i) => point(i, (Math.max(0, Math.min(100, c.score)) / 100) * r).map(v => v.toFixed(1)).join(','))
    .join(' ')

  return (
    <svg viewBox="0 0 360 300" className="w-full max-w-[320px]">
      {[1, 0.75, 0.5, 0.25].map(f => (
        <polygon key={f} points={ringPoints(r * f)} fill="none" stroke="var(--color-hairline)" strokeWidth="1" />
      ))}
      {competencies.map((_, i) => {
        const [x, y] = point(i, r)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-hairline)" strokeWidth="1" />
      })}
      <polygon points={dataPoints} fill="var(--color-forest-600)" fillOpacity="0.32" stroke="var(--color-forest-600)" strokeWidth="2" />
      {competencies.map((c, i) => {
        const [x, y] = point(i, (Math.max(0, Math.min(100, c.score)) / 100) * r)
        return <circle key={c.label} cx={x} cy={y} r="3.2" fill="var(--color-forest-600)" />
      })}
      {competencies.map((c, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const lx = cx + (r + 22) * cos
        const ly = cy + (r + 22) * sin
        const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
        return (
          <g key={c.label}>
            <text x={lx} y={ly + (sin > 0.5 ? 8 : sin < -0.5 ? 0 : 4)} textAnchor={anchor} fontSize="11" fontWeight="700" fill="var(--color-ink-strong)" fontFamily="var(--font-body), sans-serif">
              {c.label}
            </text>
            <text x={lx} y={ly + (sin > 0.5 ? 21 : sin < -0.5 ? 13 : 17)} textAnchor={anchor} fontSize="10.5" fontWeight="700" fill="var(--color-ink-secondary)" fontFamily="var(--font-body), sans-serif">
              {Math.round(c.score)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ── Trajectory pieces (restyled, logic unchanged) ───────────────── */

const TREND_META: Record<TrajectoryTrend, { label: string; color: string }> = {
  improving: { label: 'Improving', color: '#266235' },
  declining: { label: 'Needs attention', color: '#b83230' },
  steady: { label: 'Steady', color: '#5b685e' },
  insufficient_data: { label: 'Low signal', color: '#5b685e' },
}

function TrendIcon({ trend, delta, size = 12 }: { trend: TrajectoryTrend; delta: number; size?: number }) {
  if (trend === 'insufficient_data') return <Minus size={size} strokeWidth={2} />
  // Bind icon to delta sign with ±2 deadband, override API trend label
  if (delta >= 2) return <TrendingUp size={size} strokeWidth={2} />
  if (delta <= -2) return <TrendingDown size={size} strokeWidth={2} />
  return <Minus size={size} strokeWidth={2} />
}

function TrendDot({ trend, delta }: { trend: TrajectoryTrend; delta: number }) {
  const meta = TREND_META[trend]
  return (
    <span className="inline-flex items-center gap-1 tabular-nums" style={{ color: meta.color }}>
      <TrendIcon trend={trend} delta={delta} />
      {trend === 'insufficient_data' ? meta.label : `${delta > 0 ? '+' : ''}${delta}`}
    </span>
  )
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="mt-2 h-[22px] rounded-md bg-hairline/50" />
  }
  const width = 88
  const height = 22
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width
    const y = height - (Math.max(0, Math.min(100, value)) / 100) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <svg className="mt-2 h-[22px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrajectoryCellCard({
  cell,
  color,
  move,
  discipline,
}: {
  cell: TrajectoryCell
  color: string
  move: TrajectoryMove
  discipline: string
}) {
  const trend = TREND_META[cell.trend]
  const tooltip = cell.sampleSize === 0
    ? `${discipline} ${TRAJECTORY_MOVE_LABELS[move]} has no completed signal yet.`
    : `${discipline} ${TRAJECTORY_MOVE_LABELS[move]}: ${cell.sampleSize} signal${cell.sampleSize === 1 ? '' : 's'}, ${cell.confidence}% confidence.`

  return (
    <AppTooltip label={tooltip} side="bottom" className="flex">
      <div className="w-full rounded-xl border border-hairline bg-card-bright p-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-headline text-[17px] font-bold leading-none tabular-nums"
            style={{ color: cell.score === null ? 'var(--color-ink-muted)' : color }}
          >
            {cell.score === null ? '-' : cell.score}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums" style={{ color: trend.color }}>
            <TrendIcon trend={cell.trend} delta={cell.delta} />
            {cell.trend === 'insufficient_data' ? 'Low' : `${cell.delta > 0 ? '+' : ''}${cell.delta}`}
          </span>
        </div>
        <MiniSparkline values={cell.history} color={color} />
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums text-ink-secondary">
          <span>{cell.sampleSize} challenges</span>
          <span>{cell.confidence}% conf</span>
        </div>
      </div>
    </AppTooltip>
  )
}

function TrajectoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-card-bright p-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-muted">{label}</div>
      <div className="mt-1 font-headline text-[18px] font-bold leading-none tabular-nums text-ink-strong">{value}</div>
    </div>
  )
}

function ReasoningTrajectorySection({
  trajectory,
  loading,
}: {
  trajectory: ReasoningTrajectory | null
  loading: boolean
}) {
  const lowSignal = trajectory?.summary.lowSignalCells ?? 0
  const totalSignals = trajectory?.summary.totalSignals ?? 0

  // Show the full matrix only when there is meaningful signal.
  // Threshold: at least 3 disciplines must have at least one cell with sampleSize > 0.
  const hasEnoughSignal = (() => {
    if (!trajectory) return false
    if (totalSignals === 0) return false
    const disciplinesWithAnySignal = trajectory.disciplines.filter(d =>
      Object.values(d.cells).some(cell => cell.sampleSize > 0)
    ).length
    return disciplinesWithAnySignal >= 3
  })()

  // Dedupe evidence by href (same challenge can appear multiple times across moves)
  const dedupedEvidence = (() => {
    if (!trajectory) return []
    const seen = new Set<string>()
    return trajectory.evidence.filter(item => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    }).slice(0, 4)
  })()

  if (loading) {
    return (
      <section className={`${CARD_CLASS} mb-4`}>
        <CardTitle>Reasoning trajectory</CardTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-hairline/60" />
          ))}
        </div>
      </section>
    )
  }

  if (!trajectory) return null

  return (
    <section className={`${CARD_CLASS} mb-4`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-body text-[15px] font-bold text-ink-strong">Reasoning trajectory</div>
        <Link
          href={trajectory.nextFocus.href}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-forest-700 no-underline"
        >
          Next challenge
          <ChevronRight size={13} strokeWidth={2.2} />
        </Link>
      </div>

      {hasEnoughSignal ? (
        <>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_280px]">
            <p className="m-0 self-center text-[12px] font-semibold leading-snug text-ink-secondary">
              Each cell blends recent challenge, workspace, and interview evidence. Low signal is shown instead of faked confidence.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <TrajectoryStat label="Signals" value={String(totalSignals)} />
              <TrajectoryStat label="Challenges" value={String(trajectory.summary.challengeReps)} />
              <TrajectoryStat label="Gaps" value={String(lowSignal)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <p className="mb-2 px-1 text-xs font-semibold text-ink-secondary">
                Score · Δ vs last week · challenges · confidence
              </p>
              <div
                className="mb-1 grid items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-[0.10em] text-ink-muted"
                style={{ gridTemplateColumns: '170px repeat(4, minmax(132px, 1fr))' }}
              >
                <div>Discipline</div>
                {trajectory.moves.map(move => (
                  <div key={move}>{TRAJECTORY_MOVE_LABELS[move]}</div>
                ))}
              </div>
              <div className="space-y-1.5">
                {trajectory.disciplines.map(discipline => (
                  <div
                    key={discipline.key}
                    className="grid items-stretch gap-1.5"
                    style={{ gridTemplateColumns: '170px repeat(4, minmax(132px, 1fr))' }}
                  >
                    <Link
                      href={discipline.href}
                      className="flex min-w-0 items-center gap-2.5 rounded-xl border border-hairline bg-card-bright p-2 no-underline transition-transform hover:-translate-y-0.5"
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ background: discipline.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-extrabold text-ink-strong">
                          {discipline.label}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-bold tabular-nums text-ink-secondary">
                          {discipline.score === null ? 'No score' : `${discipline.score}%`}
                          <TrendDot trend={discipline.trend} delta={discipline.delta} />
                        </span>
                      </span>
                    </Link>
                    {trajectory.moves.map(move => (
                      <TrajectoryCellCard
                        key={`${discipline.key}-${move}`}
                        cell={discipline.cells[move]}
                        color={discipline.color}
                        move={move}
                        discipline={discipline.label}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="m-0 mb-3 text-[12.5px] font-semibold text-ink-secondary">
          This fills in as you complete challenges across disciplines.
        </p>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <NoteCard tint="mint" className="rounded-xl p-3">
          <div className="mb-1 flex items-center gap-2">
            <HatchImage state="avatar" size={20} className="rounded-full" />
            <div className="text-[10.5px] font-black uppercase tracking-[0.10em] text-forest-800">
              Hatch read
            </div>
          </div>
          <h3 className="m-0 font-body text-[15px] font-bold leading-tight text-ink-strong">
            {trajectory.nextFocus.disciplineLabel} · {trajectory.nextFocus.moveLabel}
          </h3>
          <p className="m-0 mt-1 text-[12.5px] font-semibold leading-snug text-ink-secondary">
            {trajectory.nextFocus.reason}
          </p>
          <Link
            href={trajectory.nextFocus.href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] bg-forest-800 px-3 py-1.5 text-[11.5px] font-extrabold text-white no-underline"
          >
            Start focused challenge
            <ArrowRight size={12} strokeWidth={2.2} />
          </Link>
        </NoteCard>
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="text-[10.5px] font-black uppercase tracking-[0.10em] text-ink-muted">
              Evidence ledger
            </div>
            <span className="text-[10.5px] font-bold tabular-nums text-ink-secondary">
              Latest {dedupedEvidence.length}
            </span>
          </div>
          {dedupedEvidence.length > 0 ? (
            <div>
              {dedupedEvidence.map((item, i) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`block py-2 no-underline ${i < dedupedEvidence.length - 1 ? 'border-b border-hairline' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12.5px] font-bold text-ink-strong">{item.title}</span>
                    <span className="shrink-0 text-[11px] font-black tabular-nums text-forest-700">{item.score}%</span>
                  </div>
                  <div className="mt-0.5 truncate text-[10.5px] font-semibold text-ink-secondary">
                    {item.sourceLabel} · {TRAJECTORY_MOVE_LABELS[item.move]}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="m-0 text-[12px] font-semibold text-ink-secondary">
              No evidence yet. Hatch will fill this after your first completed challenge.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Timeline (attempts + interviews + activity events) ──────────── */

interface TimelineItem {
  key: string
  ts: number
  title: ReactNode
  meta: string
  done: boolean
  href?: string
  cta?: string
}

function TimelineRow({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  return (
    <div className={`flex min-h-[44px] items-center gap-3 py-2.5 ${isLast ? '' : 'border-b border-hairline'}`}>
      {item.done ? (
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
          <Check size={12} strokeWidth={2.6} />
        </span>
      ) : (
        <span className="ml-[7px] mr-[7px] size-2 shrink-0 rounded-full bg-forest-600/50" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-ink-strong">{item.title}</div>
        <div className="mt-px text-[11.5px] font-semibold tabular-nums text-ink-secondary">{item.meta}</div>
      </div>
      {item.href && item.cta && (
        <Link
          href={item.href}
          className="shrink-0 rounded-[10px] border border-hairline bg-card-bright px-3.5 py-1.5 text-[12px] font-bold text-ink-strong no-underline hover:bg-note-mint/40"
        >
          {item.cta}
        </Link>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()
  const { profile, isLoading: profileLoading } = useProfile()
  const { data: dna } = useLearnerDNAData()
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([])
  const [masteryEntries, setMasteryEntries] = useState<Array<{ challenge_id: string; score: number | null; is_completed: boolean; is_catalogued?: boolean }>>([])
  const [masteryStatus, setMasteryStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const loadMastery = useCallback(async () => {
    setMasteryStatus('loading')
    try {
      const response = await fetch('/api/challenges/mastery')
      if (!response.ok) throw new Error('Mastery unavailable')
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error('Invalid mastery response')
      setMasteryEntries(data)
      setMasteryStatus('ready')
    } catch {
      setMasteryStatus('error')
    }
  }, [])
  useEffect(() => { void loadMastery() }, [loadMastery])
  const [reflection, setReflection] = useState<string | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(true)
  const [trajectory, setTrajectory] = useState<ReasoningTrajectory | null>(null)
  const [trajectoryLoading, setTrajectoryLoading] = useState(true)
  const [learnUnavailable, setLearnUnavailable] = useState(false)
  const [learnModules, setLearnModules] = useState<Array<{
    module_id: string; module_title: string; module_slug: string;
    total_chapters: number; completed_chapters: number;
  }>>([])
  const [streakDates, setStreakDates] = useState<string[]>([])
  const [activityEvents, setActivityEvents] = useState<Array<{
    id: string; event_type: string; payload: Record<string, unknown>; created_at: string;
  }>>([])
  const [shieldCount, setShieldCount] = useState(0)
  const [attemptsLoaded, setAttemptsLoaded] = useState(false)
  const [feedLoaded, setFeedLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/attempts?limit=5&include_patterns=true')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setRecentAttempts(data) })
      .catch(() => {})
      .finally(() => setAttemptsLoaded(true))
    fetch('/api/live-interview/history?limit=3')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.sessions) setRecentInterviews(data.sessions) })
      .catch(() => {})
    fetch('/api/hatch/growth-reflection', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.reflection) setReflection(data.reflection) })
      .catch(() => {})
      .finally(() => setReflectionLoading(false))
    fetch('/api/progress/reasoning-trajectory')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTrajectory(data) })
      .catch(() => {})
      .finally(() => setTrajectoryLoading(false))
    Promise.all([
      fetch('/api/progress/learn-progress').then(r => r.ok ? r.json() : { modules: [], unavailable: true }).catch(() => ({ modules: [], unavailable: true })),
      fetch('/api/progress/streak-history').then(r => r.ok ? r.json() : { dates: [] }),
      fetch('/api/progress/activity-feed').then(r => r.ok ? r.json() : { events: [] }),
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
    ]).then(([learnData, streakData, feedData, profileData]) => {
      setLearnModules(learnData.modules ?? [])
      setLearnUnavailable(Boolean(learnData.unavailable))
      setStreakDates(streakData.dates ?? [])
      setActivityEvents((feedData.events ?? []).map((ev: { id: string; event_type: string; payload: unknown; created_at: string }) => ({
        ...ev,
        payload: (ev.payload ?? {}) as Record<string, unknown>,
      })))
      setShieldCount(profileData?.streak_shield_count ?? 0)
    }).catch(() => {}).finally(() => setFeedLoaded(true))
  }, [])

  const flowMoves = FLOW_ROWS.map(m => {
    const row = moves.find(mv => (mv.move as string) === m.move)
    return {
      ...m,
      level: row?.level ?? 1,
      pct: row?.progress_pct ?? 0,
      hasReps: row !== undefined,
    }
  })

  // Mastery stats
  const catalogEntries = masteryEntries.filter(e => e.is_catalogued !== false)
  const total = catalogEntries.length
  const attempted = masteryEntries.filter(e => e.is_completed).length
  const mastered = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 80).length
  const catalogCompleted = catalogEntries.filter(e => e.is_completed).length
  const attemptedPct = total > 0 ? Math.round((catalogCompleted / total) * 100) : 0

  const streakDays = profile?.streak_days ?? 0
  const xpTotal = profile?.xp_total ?? 0
  const level = levelFromXp(xpTotal)
  const hasActivity = recentAttempts.length > 0 || recentInterviews.length > 0

  const coreLoaded = attemptsLoaded && feedLoaded && !profileLoading
  const isDayZero =
    coreLoaded && !hasActivity && activityEvents.length === 0 && attempted === 0 && streakDays === 0 && xpTotal === 0

  // Hero headline from real state: slowest FLOW move among moves with evidence.
  const movesWithEvidence = flowMoves.filter(m => m.hasReps)
  const weakest = movesWithEvidence.length > 0
    ? movesWithEvidence.reduce((min, m) => (m.pct < min.pct ? m : min), movesWithEvidence[0])
    : null

  // Merged activity timeline: attempts + interviews + feed events, newest first.
  const timeline: TimelineItem[] = (() => {
    const items: TimelineItem[] = []
    // Count occurrences per challenge_id to label repeated attempts
    const idCount = new Map<string, number>()
    const idSeen = new Map<string, number>()
    for (const a of recentAttempts) {
      idCount.set(a.challenge_id, (idCount.get(a.challenge_id) ?? 0) + 1)
    }
    for (const a of recentAttempts) {
      const repeatTotal = idCount.get(a.challenge_id) ?? 1
      const attemptN = (idSeen.get(a.challenge_id) ?? 0) + 1
      idSeen.set(a.challenge_id, attemptN)
      const attemptSuffix = repeatTotal > 1 ? ` · Attempt ${attemptN}` : ''
      const numberLabel = formatChallengeNumber(a.challenge_type, a.display_number)
      items.push({
        key: `attempt-${a.id ?? a.challenge_id}-${attemptN}`,
        ts: new Date(a.submitted_at).getTime(),
        title: <>{a.challenge_title}{attemptSuffix}</>,
        meta: [numberLabel, a.pattern_name, new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })]
          .filter(Boolean).join(' · '),
        done: true,
        href: `/challenges/${a.challenge_id}/feedback${a.id ? `?attempt=${a.id}` : ''}`,
        cta: 'Review',
      })
    }
    for (const s of recentInterviews) {
      const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
      const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
      const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : null
      const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null
      const displayName = s.companyName && s.companyName !== 'Unknown' ? s.companyName : 'Practice interview'
      const formattedScore = formatInterviewScore(s.overallScore)
      items.push({
        key: `interview-${s.id}`,
        ts: s.endedAt ? new Date(s.endedAt).getTime() : 0,
        title: <>Mock interview: {displayName}</>,
        meta: [
          s.roleId,
          duration,
          date,
          s.status === 'completed' && formattedScore != null ? formattedScore : s.status === 'abandoned' ? 'Incomplete' : null,
        ].filter(Boolean).join(' · '),
        done: s.status === 'completed',
        href: s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '/live-interviews',
        cta: s.status === 'completed' ? 'View feedback' : 'Resume',
      })
    }
    for (const ev of activityEvents) {
      const labelDef = EVENT_LABELS[ev.event_type]
      items.push({
        key: `event-${ev.id}`,
        ts: new Date(ev.created_at).getTime(),
        title: labelDef ? labelDef.label(ev.payload) : ev.event_type,
        meta: new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        done: false,
      })
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 8)
  })()

  const activeDays28 = (() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 27)
    const cutoffIso = cutoff.toISOString().split('T')[0]
    return streakDates.filter(d => d >= cutoffIso).length
  })()

  if (!coreLoaded) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-5 pb-12">
        <div className="mb-4 h-[160px] animate-pulse rounded-2xl bg-hairline/60" />
        <div className="mb-4 h-[90px] animate-pulse rounded-2xl bg-hairline/50" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-[260px] animate-pulse rounded-2xl bg-hairline/50" />)}
        </div>
      </div>
    )
  }

  /* ── Day 0: single centered invitation + FLOW explainer, no empty charts (spec §3) ── */
  if (isDayZero) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-10 pb-12">
        <section className={`${CARD_CLASS} flex flex-col items-center p-8 text-center`}>
          <HatchImage state="wave" size={120} priority />
          <h1 className="mb-2 mt-4 font-headline text-[28px] font-semibold leading-[1.2] text-ink-strong">
            One <span className="hl-word">challenge</span> starts the map.
          </h1>
          <p className="mb-5 max-w-[44ch] text-[13.5px] leading-[1.55] text-ink-secondary">
            This page fills in after your first completed challenge. About 5 minutes, no setup.
          </p>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 rounded-[10px] bg-forest-950 px-[18px] py-[11px] text-[13.5px] font-extrabold text-white no-underline shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
          >
            Start your first challenge
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
        </section>

        <section className={`${CARD_CLASS} mt-4`}>
          <CardTitle>The FLOW method</CardTitle>
          {FLOW_ROWS.map((m, i) => (
            <div key={m.k} className={`flex items-start gap-3 py-2.5 ${i < FLOW_ROWS.length - 1 ? 'border-b border-hairline' : 'pb-1'}`}>
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.dotClass}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-extrabold text-ink-strong">{m.k}</div>
                <div className="text-[11.5px] leading-[1.4] text-ink-secondary">{m.desc}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-5 pb-12">
      <LearningPageHeading eyebrow="Your progress" title="See how far you’ve come.">Your completed work, feedback, and learning history in one place.</LearningPageHeading>
      {weakest && <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-card-bright p-6"><div><p className="text-xs uppercase tracking-wide text-ink-secondary">Your next focus</p><h2 className="mt-2 font-headline text-2xl font-medium text-forest-950">Build confidence in {weakest.k.toLowerCase()}.</h2></div><Link href="/challenges" className="inline-flex min-h-11 items-center rounded-xl bg-forest-950 px-5 text-sm font-semibold text-white">Find a challenge →</Link></section>}

      {/* ── Stat strip (all values real; no invented deltas) ────────── */}
      <StatStrip
        className="mb-4"
        cells={[
          { key: 'completed', label: 'Challenges completed', value: masteryStatus === 'ready' ? String(attempted) : '—' },
          { key: 'mastered', label: 'Scored 80+', value: masteryStatus === 'ready' ? String(mastered) : '—' },
          { key: 'coverage', label: 'Practice coverage', value: masteryStatus === 'ready' ? `${attemptedPct}%` : '—' },
          {
            key: 'xp',
            label: 'Total XP',
            value: <span className="text-flame">{xpTotal.toLocaleString()}</span>,
            valueSuffix: `Level ${level}`,
          },
        ]}
      />

      {masteryStatus === 'error' && (
        <p role="status" className="mb-4 text-sm text-ink-secondary">
          Your challenge totals could not be loaded.{' '}
          <button type="button" onClick={() => void loadMastery()} className="min-h-11 font-semibold text-forest-950 underline">Try again</button>
        </p>
      )}

      {/* ── Row 1: FLOW moves / skill profile / four-week activity ── */}
      <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.05fr_1.05fr_1fr]">
        <section className={CARD_CLASS}>
          <CardTitle>FLOW moves</CardTitle>
          {flowMoves.map(m => (
            <div key={m.k} className="py-2">
              <div className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-ink-strong">
                <span className={`size-2 rounded-full ${m.dotClass}`} />
                {m.k}
                <span className="ml-auto text-[10px] font-black uppercase tracking-[0.04em] text-ink-muted">Lv {m.level}</span>
              </div>
              <div className="text-[11.5px] text-ink-secondary">{m.desc}</div>
              {m.hasReps ? (
                <div className="mt-1.5 flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
                    <span className={`block h-full rounded-full ${m.barClass}`} style={{ width: `${m.pct}%` }} />
                  </div>
                  <span className="w-[34px] shrink-0 text-right text-[12px] font-extrabold tabular-nums text-ink-strong">{m.pct}%</span>
                </div>
              ) : (
                <div className="mt-1.5 inline-flex rounded-full border border-hairline px-2 py-0.5 text-[10px] font-bold text-ink-muted">
                  Building evidence
                </div>
              )}
            </div>
          ))}
          <ViewLink href="/progress/skill-ladder">View FLOW progress</ViewLink>
        </section>

        <section className={`${CARD_CLASS} flex flex-col`}>
          <CardTitle>Skill profile</CardTitle>
          {dna ? (
            <>
              <div className="flex flex-1 items-center justify-center">
                <CompetencyRadarSvg competencies={dna.competencies} />
              </div>
              {dna.weakest_link_label && (
                <p className="m-0 mt-1 text-center text-[11.5px] font-semibold text-ink-secondary">
                  Focus area: <span className="font-extrabold text-ink-strong">{dna.weakest_link_label}</span>
                </p>
              )}
              <Link
                href="/progress/skill-ladder"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-[10px] border border-hairline bg-card-bright py-2 text-[13px] font-bold text-ink-strong no-underline"
              >
                View full breakdown
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </>
          ) : (
            <p className="m-0 flex flex-1 items-center justify-center text-center text-[12.5px] font-semibold text-ink-secondary">
              Your skill profile appears after Hatch grades a few challenges.
            </p>
          )}
        </section>

        <section data-testid="streak-heatmap" className={CARD_CLASS}>
          <CardTitle>Last four weeks</CardTitle>
          <FourWeekHeatmap activeDates={streakDates} />
          <div className="mt-3 grid grid-cols-3 gap-2.5 border-t border-hairline pt-3">
            <div>
              <div className="mb-0.5 text-[11px] text-ink-secondary">Active days</div>
              <div className="font-headline text-[18px] font-bold tabular-nums text-ink-strong">{activeDays28}</div>
            </div>
            <div>
              <div className="mb-0.5 text-[11px] text-ink-secondary">Streak</div>
              <div className="font-headline text-[18px] font-bold tabular-nums text-ink-strong">
                {streakDays} day{streakDays === 1 ? '' : 's'}
              </div>
            </div>
            {shieldCount > 0 && (
              <div>
                <div className="mb-0.5 text-[11px] text-ink-secondary">Shields</div>
                <div className="font-headline text-[18px] font-bold tabular-nums text-ink-strong">{shieldCount}</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Row 2: recent work timeline + learn progress ────────────── */}
      <div className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section data-testid="activity-feed" className={CARD_CLASS}>
          <CardTitle>Recent work</CardTitle>
          {timeline.length > 0 ? (
            <>
              {timeline.map((item, i) => (
                <TimelineRow key={item.key} item={item} isLast={i === timeline.length - 1} />
              ))}
              <ViewLink href="/history">View full history</ViewLink>
            </>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <HatchImage state="idle" size={40} />
              <div>
                <p className="m-0 text-[13px] font-bold text-ink-strong">No activity yet.</p>
                <p className="m-0 mt-0.5 text-[12px] text-ink-secondary">
                  Start a challenge or mock interview to give Hatch a signal.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={CARD_CLASS}>
          <CardTitle>Learn progress</CardTitle>
          {learnModules.length > 0 ? (
            learnModules.map((mod, i) => (
              <div key={mod.module_id} className={`py-2.5 ${i < learnModules.length - 1 ? 'border-b border-hairline' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-ink-strong"><Link href={`/explore/modules/${mod.module_slug}`}>{mod.module_title}</Link></span>
                  <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-ink-secondary">
                    {mod.completed_chapters}/{mod.total_chapters} chapters
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline">
                  <div
                    className="h-full rounded-full bg-forest-600"
                    style={{ width: mod.total_chapters > 0 ? `${Math.round((mod.completed_chapters / mod.total_chapters) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="m-0 text-[12.5px] font-semibold text-ink-secondary">{learnUnavailable ? 'Learning progress is temporarily unavailable.' : 'No chapters completed yet.'}</p>
          )}
        </section>
      </div>

      <ReasoningTrajectorySection trajectory={trajectory} loading={trajectoryLoading} />

      {/* ── Hatch's read (growth reflection) ─────────────────────────── */}
      <NoteCard tint="mint" as="section" className="grid grid-cols-1 items-center gap-4 rounded-2xl px-5 py-4 sm:grid-cols-[auto_1fr_auto]">
        <HatchImage state="presenting" size={64} />
        <div className="min-w-0">
          <div className="mb-1 text-[15px] font-extrabold text-ink-strong">Hatch&rsquo;s read</div>
          {reflectionLoading ? (
            <div className="flex max-w-[560px] flex-col gap-1.5">
              <div className="h-2 w-[90%] rounded bg-forest-800/10" />
              <div className="h-2 w-[66%] rounded bg-forest-800/10" />
            </div>
          ) : reflection ? (
            <div className="max-w-[62ch] text-[13px] leading-[1.5] text-ink-secondary">
              <Md variant="chat" tone="inherit">{reflection}</Md>
            </div>
          ) : (
            <p className="m-0 text-[13px] leading-[1.5] text-ink-secondary">
              Complete a challenge to see your first read.
            </p>
          )}
        </div>
        {profile?.archetype && (
          <button
            onClick={() => router.push('/profile/share')}
            className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-forest-950 px-4 py-2.5 text-[13px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
          >
            <Share2 size={14} strokeWidth={2} />
            Share your archetype
          </button>
        )}
      </NoteCard>
    </div>
  )
}
