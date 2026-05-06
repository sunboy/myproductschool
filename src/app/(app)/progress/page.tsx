'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { AppTooltip } from '@/components/ui/AppTooltip'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'

/* ── FLOW paradigm palette - matches /explore FLOW strip ─────────── */

const FLOW_MOVES = [
  { k: 'Frame',    move: 'frame',    sub: 'Define the right problem',  color: '#4a7c59', bg: '#cfe3d3', icon: 'center_focus_strong' },
  { k: 'List',     move: 'list',     sub: 'Generate quality options',  color: '#6b8275', bg: '#dfe7e1', icon: 'format_list_bulleted' },
  { k: 'Optimize', move: 'optimize', sub: 'Pick and sharpen the best', color: '#c9933a', bg: '#f3e2b9', icon: 'tune' },
  { k: 'Win',      move: 'win',      sub: 'Drive durable outcomes',    color: '#a878d6', bg: '#ecdeff', icon: 'emoji_events' },
] as const

interface RecentAttempt {
  challenge_id: string
  challenge_title: string
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

const READINESS_CHALLENGE_QUOTA = 10
const READINESS_MOVE_LEVEL = 3
const READINESS_MOVES: string[] = ['frame', 'list', 'optimize', 'win']

const DISCIPLINE_LENSES = [
  {
    title: 'Product sense',
    href: '/challenges?discipline=product_sense',
    icon: 'psychology',
    accent: '#4a7c59',
    bg: '#dfe7e1',
    frame: 'User job + business outcome',
    list: 'Segments, options, counter-moves',
    optimize: 'Metric tradeoffs',
    win: 'Decision narrative',
  },
  {
    title: 'System design',
    href: '/challenges?discipline=system_design',
    icon: 'hub',
    accent: '#7a5c2e',
    bg: '#f3e2b9',
    frame: 'Scale, latency, consistency',
    list: 'Components + data flows',
    optimize: 'Reliability vs. cost',
    win: 'Defensible architecture',
  },
  {
    title: 'Data modeling',
    href: '/challenges?discipline=data_modeling',
    icon: 'account_tree',
    accent: '#5b6f4d',
    bg: '#d8e4cf',
    frame: 'Entities and grain',
    list: 'Facts, dimensions, events',
    optimize: 'Read/write tradeoffs',
    win: 'Model contract clarity',
  },
  {
    title: 'SQL',
    href: '/challenges?discipline=sql',
    icon: 'database',
    accent: '#5a3a7c',
    bg: '#ecdeff',
    frame: 'Question and dataset shape',
    list: 'Joins, filters, edge cases',
    optimize: 'Correctness then speed',
    win: 'Explainable query path',
  },
  {
    title: 'Coding',
    href: '/challenges?discipline=algorithm',
    icon: 'data_object',
    accent: '#3a5a7c',
    bg: '#e1ecff',
    frame: 'Constraints + examples',
    list: 'Approaches and invariants',
    optimize: 'Time/space tradeoff',
    win: 'Clean implementation',
  },
] as const

const TRAJECTORY_MOVE_LABELS: Record<TrajectoryMove, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const TREND_META: Record<TrajectoryTrend, { label: string; icon: string; color: string }> = {
  improving: { label: 'Improving', icon: 'trending_up', color: '#4a7c59' },
  declining: { label: 'Needs attention', icon: 'trending_down', color: '#b05a4d' },
  steady: { label: 'Steady', icon: 'trending_flat', color: '#6b8275' },
  insufficient_data: { label: 'Low signal', icon: 'fiber_manual_record', color: '#8a8175' },
}

function ReadinessMap({
  attemptedPct,
  masteredPct,
  overallPct,
  latestInterviewScore,
  hasActivity,
}: {
  attemptedPct: number
  masteredPct: number
  overallPct: number
  latestInterviewScore: number | null
  hasActivity: boolean
}) {
  const lanes = [
    {
      label: 'Practice coverage',
      value: `${attemptedPct}%`,
      sub: hasActivity ? 'Library touched' : 'Start with one challenge',
      href: '/challenges',
      icon: 'track_changes',
      color: '#4a7c59',
      pct: attemptedPct,
      help: 'How much of the full challenge library you have attempted.',
    },
    {
      label: 'Mastery signal',
      value: `${masteredPct}%`,
      sub: 'Challenges at 80+',
      href: '/progress/skill-ladder',
      icon: 'verified',
      color: '#c9933a',
      pct: masteredPct,
      help: 'The share of completed reps where Hatch scored you 80 or higher.',
    },
    {
      label: 'Interview pressure',
      value: latestInterviewScore != null ? `${latestInterviewScore}` : 'New',
      sub: latestInterviewScore != null ? 'Latest Hatch debrief' : 'Run a mock loop',
      href: '/live-interviews',
      icon: 'graphic_eq',
      color: '#8b46d4',
      pct: latestInterviewScore ?? 18,
      help: 'Your most recent mock interview score, or a prompt to start one.',
    },
    {
      label: 'Readiness score',
      value: `${overallPct}%`,
      sub: 'Blended signal',
      href: '/progress',
      icon: 'workspace_premium',
      color: '#3b6ed4',
      pct: overallPct,
      help: 'A blended signal from completed reps and FLOW move levels.',
    },
  ]

  return (
    <section className="mb-3 rounded-xl border border-outline-variant/65 bg-surface-container-low p-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)' }}>
            Readiness map
          </div>
          <h2 className="m-0 font-headline text-[16px] font-bold leading-tight text-on-surface">
            Where Hatch should push next.
          </h2>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-2.5 py-1 text-[11px] font-label font-bold text-primary no-underline hover:bg-primary-fixed"
        >
          Pick a path
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {lanes.map(lane => (
          <AppTooltip key={lane.label} label={lane.help} side="bottom" className="flex">
            <Link
              href={lane.href}
              className="w-full rounded-lg border border-outline-variant/45 bg-background p-2 no-underline transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${lane.color}18` }}>
                  <span className="material-symbols-outlined text-[17px]" style={{ color: lane.color, fontVariationSettings: "'FILL' 1" }}>
                    {lane.icon}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11.5px] font-label font-extrabold leading-tight text-on-surface">{lane.label}</span>
                    <span className="shrink-0 font-headline text-[17px] font-bold leading-none" style={{ color: lane.color }}>
                      {lane.value}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[10.5px] font-semibold leading-tight text-on-surface-variant">{lane.sub}</div>
                </div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, lane.pct))}%`, background: lane.color }}
                />
              </div>
            </Link>
          </AppTooltip>
        ))}
      </div>
    </section>
  )
}

function DisciplineLensStrip() {
  return (
    <section className="mb-3 rounded-xl border border-outline-variant/65 bg-background p-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: 4 }}>
            Disciplines
          </div>
          <h2 className="m-0 font-headline text-[16px] font-bold leading-tight text-on-surface">
            FLOW applies across the stack.
          </h2>
        </div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-2.5 py-1 text-[11px] font-label font-bold text-primary no-underline hover:bg-primary-fixed"
        >
          Practice
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-5">
        {DISCIPLINE_LENSES.map(discipline => {
          const moves = [
            ['F', discipline.frame],
            ['L', discipline.list],
            ['O', discipline.optimize],
            ['W', discipline.win],
          ] as const

          return (
            <AppTooltip
              key={discipline.title}
              label={`${discipline.title}: ${discipline.frame}; ${discipline.optimize}.`}
              side="bottom"
              className="flex"
            >
              <Link
                href={discipline.href}
                className="group flex w-full min-w-0 items-center gap-2 rounded-lg border border-outline-variant/45 px-2 py-1.5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-20px_rgba(46,50,48,0.55)]"
                style={{ background: `linear-gradient(135deg, ${discipline.bg} 0%, var(--color-background) 150%)` }}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white" style={{ background: discipline.accent }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {discipline.icon}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-label font-extrabold leading-tight text-on-surface">
                    {discipline.title}
                  </span>
                  <span className="mt-1 flex gap-1">
                    {moves.map(([move, text]) => (
                      <span
                        key={move}
                        aria-label={text}
                        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[4px] text-[8px] font-black leading-none"
                        style={{ color: discipline.accent, background: `${discipline.accent}18` }}
                      >
                        {move}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="material-symbols-outlined hidden text-[13px] text-on-surface-variant transition-transform group-hover:translate-x-0.5 sm:inline">
                  arrow_forward
                </span>
              </Link>
            </AppTooltip>
          )
        })}
      </div>
    </section>
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

  return (
    <>
      <SectionHeading
        eyebrow="Reasoning trajectory"
        title="How your judgment is changing."
        href={trajectory?.nextFocus.href ?? '/challenges'}
        linkLabel="Next best rep"
      />
      <section
        className="mb-5 overflow-hidden rounded-2xl border border-outline-variant/70 p-3.5"
        style={{ background: 'var(--color-surface-container)' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container-high" />
            ))}
          </div>
        ) : !trajectory ? (
          <div className="flex items-center gap-3 rounded-xl bg-background p-3">
            <HatchGlyph size={34} state="idle" className="shrink-0 text-primary" />
            <div>
              <h3 className="m-0 font-headline text-[16px] font-bold text-on-surface">No reasoning signal yet.</h3>
              <p className="m-0 mt-1 text-[12px] font-semibold text-on-surface-variant">
                Finish one challenge or interview and Hatch will start drawing the map.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-xl bg-background p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                  </span>
                  <div>
                    <h3 className="m-0 font-headline text-[17px] font-bold leading-tight text-on-surface">
                      Cross-discipline FLOW signal
                    </h3>
                    <p className="m-0 mt-0.5 text-[11.5px] font-semibold text-on-surface-variant">
                      Each cell blends recent challenge, workspace, and interview evidence. Low signal is shown instead of faked confidence.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <TrajectoryStat label="Signals" value={String(totalSignals)} />
                <TrajectoryStat label="Practice" value={String(trajectory.summary.challengeReps)} />
                <TrajectoryStat label="Gaps" value={String(lowSignal)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                <div
                  className="mb-1 grid items-center gap-1.5 px-1 text-[10px] font-label font-black uppercase tracking-[0.10em] text-on-surface-muted"
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
                        className="flex min-w-0 items-center gap-2 rounded-xl border border-outline-variant/55 bg-background p-2 no-underline transition-transform hover:-translate-y-0.5"
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: discipline.color }}>
                          <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {discipline.icon}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-label font-extrabold text-on-surface">
                            {discipline.label}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-bold text-on-surface-variant">
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

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-xl border border-primary/15 bg-primary-fixed p-3">
                <div className="mb-1 flex items-center gap-2">
                  <HatchGlyph size={26} state="reviewing" className="shrink-0 text-primary" />
                  <div className="text-[10.5px] font-label font-black uppercase tracking-[0.10em] text-primary">
                    Hatch read
                  </div>
                </div>
                <h3 className="m-0 font-headline text-[18px] font-bold leading-tight text-on-surface">
                  {trajectory.nextFocus.disciplineLabel} · {trajectory.nextFocus.moveLabel}
                </h3>
                <p className="m-0 mt-1 text-[12.5px] font-semibold leading-snug text-on-surface-variant">
                  {trajectory.nextFocus.reason}
                </p>
                <Link
                  href={trajectory.nextFocus.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11.5px] font-label font-extrabold text-on-primary no-underline"
                >
                  Start focused rep
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </Link>
              </div>
              <div className="rounded-xl bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[10.5px] font-label font-black uppercase tracking-[0.10em] text-on-surface-muted">
                    Evidence ledger
                  </div>
                  <span className="text-[10.5px] font-bold text-on-surface-variant">
                    Latest {Math.min(trajectory.evidence.length, 6)}
                  </span>
                </div>
                {trajectory.evidence.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                    {trajectory.evidence.slice(0, 4).map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="rounded-lg border border-outline-variant/50 bg-surface-container-low p-2 no-underline transition-colors hover:bg-surface-container"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] font-label font-extrabold text-on-surface">{item.title}</span>
                          <span className="shrink-0 text-[11px] font-black text-primary">{item.score}%</span>
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] font-semibold text-on-surface-variant">
                          {item.sourceLabel} · {TRAJECTORY_MOVE_LABELS[item.move]}
                        </div>
                        {item.evidence && (
                          <p className="m-0 mt-1 line-clamp-2 text-[10.5px] leading-snug text-on-surface-variant">
                            {item.evidence}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-[12px] font-semibold text-on-surface-variant">
                    No evidence yet. Hatch will fill this after your first completed rep.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  )
}

function TrajectoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/50 bg-background p-2">
      <div className="text-[9.5px] font-label font-black uppercase tracking-[0.08em] text-on-surface-muted">{label}</div>
      <div className="mt-1 font-headline text-[18px] font-bold leading-none text-on-surface">{value}</div>
    </div>
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
      <div className="w-full rounded-xl border border-outline-variant/45 bg-background p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-headline text-[17px] font-bold leading-none" style={{ color: cell.score === null ? 'var(--color-on-surface-muted)' : color }}>
            {cell.score === null ? '-' : cell.score}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-label font-black" style={{ background: `${trend.color}16`, color: trend.color }}>
            <span className="material-symbols-outlined text-[12px]">{trend.icon}</span>
            {cell.trend === 'insufficient_data' ? 'Low' : `${cell.delta > 0 ? '+' : ''}${cell.delta}`}
          </span>
        </div>
        <MiniSparkline values={cell.history} color={color} />
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-bold text-on-surface-variant">
          <span>{cell.sampleSize} reps</span>
          <span>{cell.confidence}% conf</span>
        </div>
      </div>
    </AppTooltip>
  )
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return (
      <div className="mt-2 h-[22px] rounded-md bg-surface-container-low" />
    )
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

function TrendDot({ trend, delta }: { trend: TrajectoryTrend; delta: number }) {
  const meta = TREND_META[trend]
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color: meta.color }}>
      <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
      {trend === 'insufficient_data' ? meta.label : `${delta > 0 ? '+' : ''}${delta}`}
    </span>
  )
}

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()
  const { profile } = useProfile()
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([])
  const [masteryEntries, setMasteryEntries] = useState<Array<{ challenge_id: string; score: number | null; is_completed: boolean }>>([])
  const [reflection, setReflection] = useState<string | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(true)
  const [trajectory, setTrajectory] = useState<ReasoningTrajectory | null>(null)
  const [trajectoryLoading, setTrajectoryLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attempts?limit=5&include_patterns=true')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setRecentAttempts(data) })
      .catch(() => {})
    fetch('/api/challenges/mastery')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setMasteryEntries(data) })
      .catch(() => {})
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
  }, [])

  const flowMoves = FLOW_MOVES.map(m => {
    const row = moves.find(mv => (mv.move as string) === m.move)
    return {
      ...m,
      level: row?.level ?? 1,
      pct: row?.progress_pct ?? 0,
    }
  })

  // Mastery stats
  const total = masteryEntries.length
  const attempted = masteryEntries.filter(e => e.is_completed).length
  const mastered = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 80).length
  const attemptedPct = total > 0 ? Math.round((attempted / total) * 100) : 0
  const masteredPct  = total > 0 ? Math.round((mastered / total) * 100) : 0

  // Readiness score
  const qualifiedChallenges = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 60).length
  const challengePct = Math.min(100, Math.round((qualifiedChallenges / READINESS_CHALLENGE_QUOTA) * 100))
  const moveLevelMap = new Map<string, number>(moves.map(m => [m.move as string, m.level]))
  const movesAtLevel = READINESS_MOVES.filter(m => (moveLevelMap.get(m) ?? 0) >= READINESS_MOVE_LEVEL).length
  const movePct = Math.round((movesAtLevel / READINESS_MOVES.length) * 100)
  const overallPct = Math.round((challengePct + movePct) / 2)

  const streakDays = profile?.streak_days ?? 0
  const hasActivity = recentAttempts.length > 0 || recentInterviews.length > 0

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1180px] px-4 py-4 pb-16 sm:px-6 lg:px-8">
      {/* ── HERO + FLOW (merged) ─────────────────────────────── */}
      <div
        className="relative mb-4 overflow-hidden rounded-2xl p-3.5 sm:p-4"
        style={{ background: 'linear-gradient(135deg, #1e3528 0%, #14241c 55%, #0e1a14 100%)' }}
      >
        {/* Dot grid bg */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 100% at 70% 50%, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 100% at 70% 50%, black 40%, transparent 80%)',
        }} />
        {/* Green glow anchored behind the FLOW grid (right side) */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(600px 500px at 80% 50%, rgba(78,180,120,0.18), transparent 60%)',
        }} />
        {/* Giant FLOW watermark, subtle */}
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'var(--font-headline)', fontSize: 132, fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: '#fff', opacity: 0.025,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
        }}>FLOW</div>

        <div className="relative grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Left - welcome + reflection + CTAs */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              padding: '4px 10px', borderRadius: 999,
              fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#9ee0b8',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7ee099', flexShrink: 0 }} />
              Your progress
              {streakDays > 0 && <span style={{ color: 'rgba(243,237,224,0.45)' }}>·</span>}
              {streakDays > 0 && <span>{streakDays} day streak</span>}
            </div>
            <h1 style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-headline)', fontWeight: 700,
              fontSize: 34, lineHeight: 1.02, letterSpacing: '-0.02em',
              color: '#f3ede0',
            }}>
              How you&rsquo;re{' '}
              <span style={{
                background: 'linear-gradient(90deg, #7ee099, #c9e86e)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>moving.</span>
            </h1>

            {/* Hatch reflection */}
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 14, padding: '11px 13px',
              marginBottom: 10,
            }}>
              <HatchGlyph size={32} state="speaking" className="shrink-0" />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase',
                  color: 'rgba(158,224,184,0.85)', marginBottom: 4,
                }}>
                  Hatch&rsquo;s reflection
                </div>
                {reflectionLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '90%' }} />
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '66%' }} />
                  </div>
                ) : reflection ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reflection.split('\n\n').map((para, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(243,237,224,0.82)' }}>
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'rgba(243,237,224,0.62)' }}>
                    Complete a challenge to unlock your first reflection.
                  </p>
                )}
              </div>
            </div>

            {/* Inline stat strip */}
            <div className="mb-3 grid grid-cols-3 gap-2">
              <HeroStat k="Readiness" v={`${overallPct}%`} />
              <HeroStat k="Mastered" v={total > 0 ? `${mastered}/${total}` : '-'} />
              <HeroStat
                k="Archetype"
                v={profile?.archetype ?? 'Not set'}
                small={!profile?.archetype}
              />
            </div>

          </div>

          {/* Right - FLOW move grid */}
          <div className="grid grid-cols-2 gap-2">
            {flowMoves.map(m => (
              <div key={m.k} style={{
                background: m.bg, borderRadius: 12, padding: '10px 10px',
                position: 'relative', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div aria-hidden style={{
                  position: 'absolute', right: -4, bottom: -8,
                  fontFamily: 'var(--font-headline)', fontSize: 52, fontWeight: 800,
                  color: m.color, opacity: 0.10, lineHeight: 1, userSelect: 'none',
                  letterSpacing: '-0.04em', pointerEvents: 'none',
                }}>{m.k[0]}</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 8, background: m.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 14, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>{m.icon}</span>
                    </div>
                    <div style={{
                      background: 'rgba(0,0,0,0.08)', color: m.color,
                      padding: '2px 8px', borderRadius: 999,
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
                    }}>
                      Lv {m.level}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{m.k}</div>
                  <div style={{ fontSize: 10.25, color: 'rgba(0,0,0,0.65)', marginTop: 1, marginBottom: 7 }}>{m.sub}</div>
                  <div style={{ height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 999, transition: 'width 700ms cubic-bezier(0.2,0.8,0.2,1)' }} />
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,0.55)', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{m.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReadinessMap
        attemptedPct={attemptedPct}
        masteredPct={masteredPct}
        overallPct={overallPct}
        latestInterviewScore={recentInterviews[0]?.overallScore ?? null}
        hasActivity={hasActivity}
      />

      <DisciplineLensStrip />

      <ReasoningTrajectorySection trajectory={trajectory} loading={trajectoryLoading} />

      {/* ── ACTIVITY ──────────────────────────────────────────── */}
      <SectionHeading
        eyebrow="Activity"
        title="Recent movement."
        href="/challenges"
        linkLabel="All history"
      />
      <div className="mb-5">
        <section style={{
          background: 'var(--color-surface-container-low)',
          borderRadius: 16,
          padding: 12,
          border: '1px solid var(--color-outline-variant)',
          overflow: 'hidden',
        }}>
          {hasActivity ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2" style={{ minWidth: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>target</span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700 }}>
                      Challenges
                    </h3>
                  </div>
                  <Link href="/challenges" style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none' }}>
                    All
                  </Link>
                </div>
                {recentAttempts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentAttempts.slice(0, 3).map((a, i) => (
                      <Link
                        key={i}
                        href={`/challenges/${a.challenge_id}/feedback`}
                        className="hover:bg-surface-container"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 9px', borderRadius: 10, textDecoration: 'none',
                          transition: 'background 150ms',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.challenge_title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--color-on-surface-variant)', marginTop: 1 }}>
                            {a.pattern_name ? `${a.pattern_name} · ` : ''}
                            {new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', opacity: 0.55 }}>
                          chevron_right
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', padding: '8px 9px', margin: 0 }}>
                    No practice challenges yet.
                  </p>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>mic</span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700 }}>
                      Interviews
                    </h3>
                  </div>
                  <Link href="/live-interviews" style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--color-primary)', textDecoration: 'none' }}>
                    All
                  </Link>
                </div>
                {recentInterviews.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {recentInterviews.slice(0, 3).map(s => {
                      const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
                      const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
                      const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '-'
                      const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                      return (
                        <Link
                          key={s.id}
                          href={s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '/live-interviews'}
                          className="hover:bg-surface-container"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            padding: '8px 9px', borderRadius: 10, textDecoration: 'none',
                            transition: 'background 150ms',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.companyName}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--color-on-surface-variant)', marginTop: 1 }}>
                              {s.roleId} · {duration} · {date}
                            </div>
                          </div>
                          {s.status === 'completed' && s.overallScore != null ? (
                            <span style={{
                              background: 'var(--color-primary-fixed)', color: 'var(--color-primary)',
                              padding: '2px 8px', borderRadius: 999,
                              fontSize: 10.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                            }}>
                              {s.overallScore}
                            </span>
                          ) : s.status === 'abandoned' ? (
                            <span style={{
                              background: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)',
                              padding: '2px 8px', borderRadius: 999,
                              fontSize: 10.5, fontWeight: 700,
                            }}>
                              Incomplete
                            </span>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', padding: '8px 9px', margin: 0 }}>
                    No live interviews yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
              <HatchGlyph size={34} state="idle" className="text-primary shrink-0" />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  No activity yet.
                </p>
                <p style={{ margin: '2px 0 8px', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                  Start a challenge or mock interview to give Hatch a signal.
                </p>
                <Link
                  href="/challenges"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    color: 'var(--color-primary)', fontWeight: 800,
                    fontSize: 12, textDecoration: 'none',
                  }}
                >
                  Start practice
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Share archetype action */}
      {profile?.archetype && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/profile/share')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--color-surface-container)',
              border: '1px solid var(--color-outline-variant)',
              color: 'var(--color-on-surface)',
              padding: '10px 20px', borderRadius: 999,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
            Share your archetype
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Shared helpers ─────────────────────────────────────────────── */

function SectionHeading({ eyebrow, title, href, linkLabel }: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: 4 }}>
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--color-primary)', fontWeight: 800, fontSize: 12,
          background: 'transparent', border: 'none', textDecoration: 'none',
          letterSpacing: '0.04em',
        }}
      >
        {linkLabel}{' '}
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
      </Link>
    </div>
  )
}

function HeroStat({ k, v, small = false }: { k: string; v: string; small?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, padding: '8px 10px',
      backdropFilter: 'blur(8px)',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(243,237,224,0.5)', marginBottom: 2 }}>
        {k}
      </div>
      <div style={{
        fontFamily: 'var(--font-headline)',
        fontSize: small ? 12 : 16,
        fontWeight: 600, color: '#f3ede0',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.15,
      }}>
        {v}
      </div>
    </div>
  )
}
