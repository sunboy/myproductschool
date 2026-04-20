'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'
import { LearnerDNASection } from './LearnerDNASection'

// FLOW move accent colors — consistent with challenge card system
const MOVE_COLORS: Record<string, string> = {
  frame:    '#5eaeff',
  list:     '#2dd4a0',
  optimize: '#f59e0b',
  win:      '#a78bfa',
}
const MOVE_BG: Record<string, string> = {
  frame:    'rgba(94,174,255,0.10)',
  list:     'rgba(45,212,160,0.10)',
  optimize: 'rgba(245,158,11,0.10)',
  win:      'rgba(167,139,250,0.10)',
}
const MOVE_ICONS: Record<string, string> = {
  frame: 'crop_free', list: 'list', optimize: 'tune', win: 'emoji_events',
}
const MOVE_DESCRIPTIONS: Record<string, string> = {
  frame:    'Define the right problem',
  list:     'Generate options',
  optimize: 'Pick the best tradeoff',
  win:      'Defend the decision',
}

function FlowRadarCard() {
  const skills = [
    { key: 'Frame',    pct: 0.72, color: '#4a7c59' },
    { key: 'List',     pct: 0.48, color: '#6b8275' },
    { key: 'Optimize', pct: 0.30, color: '#c9933a' },
    { key: 'Win',      pct: 0.10, color: '#a878d6' },
  ]
  return (
    <div className="rounded-2xl p-6 bg-surface border border-outline-faint">
      <div className="flex items-center gap-3 mb-5">
        <h3 className="font-headline text-xl font-medium">FLOW Skills</h3>
        <a href="/progress/skill-ladder" className="text-xs font-label font-bold text-primary uppercase tracking-wider flex items-center gap-1 ml-auto">
          Full ladder <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
      <div className="space-y-3">
        {skills.map(s => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-label font-semibold text-on-surface">{s.key}</span>
              <span className="text-xs text-on-surface-muted font-label">{Math.round(s.pct * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${s.pct * 100}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LumaReflectionCard() {
  const [reflection, setReflection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/luma/growth-reflection', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.reflection) setReflection(data.reflection) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-primary-fixed/50 border border-primary-fixed-dim/40 rounded-2xl p-5 flex gap-4 items-start animate-luma-card">
      <LumaGlyph size={36} state="speaking" className="text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-label text-xs font-bold text-primary mb-1.5 uppercase tracking-wider">Luma&rsquo;s reflection</p>
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 bg-primary-fixed rounded animate-pulse" />
            <div className="h-3 w-full bg-primary-fixed rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-primary-fixed rounded animate-pulse" />
          </div>
        ) : reflection ? (
          <p className="font-body text-sm text-on-surface leading-relaxed">{reflection}</p>
        ) : null}
      </div>
    </div>
  )
}

interface RecentAttempt {
  challenge_id: string
  challenge_title: string
  pattern_name: string | null
  submitted_at: string
}

interface GrowthSnapshotEntry {
  excerpt: string
  grade_label: string
  total_score: number
}

interface GrowthSnapshot {
  first: GrowthSnapshotEntry | null
  latest: GrowthSnapshotEntry | null
}

const CERT_CHALLENGE_QUOTA = 10
const CERT_MOVE_LEVEL = 3
const CERT_MOVES: string[] = ['frame', 'list', 'optimize', 'win']

const FLOW_MOVES_MOCK = [
  { name: 'Frame',    move: 'frame',    level: 3, pct: 45 },
  { name: 'List',     move: 'list',     level: 3, pct: 78 },
  { name: 'Optimize', move: 'optimize', level: 2, pct: 30 },
  { name: 'Win',      move: 'win',      level: 1, pct: 60 },
]

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()
  const { profile } = useProfile()
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [recentInterviews, setRecentInterviews] = useState<Array<{
    id: string; companyName: string; roleId: string; status: string
    overallScore: number | null; grade: string | null
    durationSeconds: number | null; endedAt: string | null
  }>>([])
  const [masteryEntries, setMasteryEntries] = useState<Array<{ challenge_id: string; score: number | null; is_completed: boolean }>>([])
  const [growthSnapshot, setGrowthSnapshot] = useState<GrowthSnapshot | null>(null)
  const [growthOpen, setGrowthOpen] = useState(false)

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
    fetch('/api/challenges/growth-snapshot')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setGrowthSnapshot(data) })
      .catch(() => {})
  }, [])

  const flowMoves = moves.length > 0
    ? moves.map(m => ({
        name: m.move.charAt(0).toUpperCase() + m.move.slice(1),
        move: m.move as string,
        level: m.level,
        pct: m.progress_pct,
        description: MOVE_DESCRIPTIONS[m.move as string] ?? '',
      }))
    : FLOW_MOVES_MOCK.map(m => ({ ...m, description: MOVE_DESCRIPTIONS[m.move] ?? '' }))

  // Mastery stats
  const total = masteryEntries.length
  const attempted = masteryEntries.filter(e => e.is_completed).length
  const mastered = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 80).length
  const inRange  = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 50 && (e.score as number) < 80).length
  const attemptedPct = total > 0 ? Math.round((attempted / total) * 100) : 0
  const masteredPct  = total > 0 ? Math.round((mastered / total) * 100) : 0

  // Certification gates
  const qualifiedChallenges = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 60).length
  const challengePct = Math.min(100, Math.round((qualifiedChallenges / CERT_CHALLENGE_QUOTA) * 100))
  const moveLevelMap = new Map<string, number>(moves.map(m => [m.move as string, m.level]))
  const movesAtLevel = CERT_MOVES.filter(m => (moveLevelMap.get(m) ?? 0) >= CERT_MOVE_LEVEL).length
  const movePct = Math.round((movesAtLevel / CERT_MOVES.length) * 100)
  const isCertified = qualifiedChallenges >= CERT_CHALLENGE_QUOTA && movesAtLevel === CERT_MOVES.length
  const overallPct = Math.round((challengePct + movePct) / 2)

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-7 w-full flex flex-col gap-5 animate-fade-in-up">

      {/* Page header */}
      <div>
        <h1 className="font-headline text-2xl font-extrabold text-on-surface leading-tight">Progress</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Your journey to product thinking mastery</p>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Archetype Card — uses Terra surface tokens, not raw purple hex */}
        <section className="col-span-12 lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex items-center justify-between gap-4 overflow-hidden relative">
          {/* Ambient radial accent */}
          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 50%, rgba(74,124,89,0.4) 0%, transparent 70%)' }} />
          <div className="flex-1 relative">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary font-label">Thinking Archetype</span>
            </div>
            {profile?.archetype ? (
              <>
                <h2 className="font-headline text-3xl font-extrabold text-on-surface leading-tight">{profile.archetype}</h2>
                {profile.archetype_description && (
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed max-w-sm">{profile.archetype_description}</p>
                )}
              </>
            ) : (
              <>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Complete calibration</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-sm">Your thinking archetype unlocks after the calibration assessment.</p>
              </>
            )}
            <button
              onClick={() => router.push('/profile/share')}
              className="mt-4 flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold font-label hover:bg-primary/90 active:scale-95 transition-all duration-150"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Share archetype
            </button>
          </div>
          <div className="hidden sm:block relative shrink-0">
            <LumaGlyph size={112} state={moves.length > 0 ? 'celebrating' : 'idle'} className="text-primary opacity-80" />
          </div>
        </section>

        {/* FLOW Skills */}
        <section className="col-span-12 lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5">
          <h3 className="font-headline text-sm font-bold mb-0.5">FLOW skills</h3>
          <p className="text-[11px] text-on-surface-variant mb-4 font-label">Proficiency across each reasoning step</p>
          <div className="grid grid-cols-2 gap-3">
            {flowMoves.map((m) => {
              const color = MOVE_COLORS[m.move] ?? '#4a7c59'
              const bg    = MOVE_BG[m.move]    ?? 'rgba(74,124,89,0.10)'
              const icon  = MOVE_ICONS[m.move]  ?? 'circle'
              return (
                <div
                  key={m.name}
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ backgroundColor: bg }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="material-symbols-outlined text-[18px] leading-none"
                      style={{ color, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      {icon}
                    </span>
                    <span
                      className="text-[11px] font-bold font-label tabular-nums px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      Lv {m.level}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface font-label">{m.name}</div>
                    <div className="text-[11px] text-on-surface-variant font-label mt-0.5">{m.description}</div>
                  </div>
                  <div className="w-full bg-surface-container-highest/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${m.pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="text-right text-[11px] font-label text-on-surface-variant tabular-nums">{m.pct}%</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* FLOW Radar — bar chart summary */}
        <section className="col-span-12 lg:col-span-5">
          <FlowRadarCard />
        </section>

        {/* Learner DNA */}
        <section className="col-span-12 lg:col-span-5">
          <LearnerDNASection />
        </section>

        {/* Challenge Progress */}
        <section className="col-span-12 md:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-headline text-sm font-bold">Challenge progress</h3>
              <p className="text-[11px] text-on-surface-variant font-label">{total} challenges in library</p>
            </div>
            <Link href="/challenges" className="text-[11px] text-primary font-bold font-label hover:underline">Browse →</Link>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { value: attempted, label: 'Attempted',  bg: 'bg-surface-container',  text: 'text-on-surface' },
              { value: mastered,  label: 'Mastered',   bg: 'bg-primary/10',          text: 'text-primary' },
              { value: inRange,   label: 'In range',   bg: 'bg-tertiary-fixed/60',   text: 'text-on-surface' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-headline font-extrabold tabular-nums ${s.text}`}>{s.value}</div>
                <div className="text-[11px] text-on-surface-variant font-label mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Stacked bar */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant mb-1.5 font-label">
              <span>Library coverage</span>
              <span className="tabular-nums">{attemptedPct}% attempted · {masteredPct}% mastered</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div className="h-full bg-primary transition-all duration-700 rounded-l-full" style={{ width: `${masteredPct}%` }} />
              <div className="h-full bg-tertiary-container transition-all duration-700" style={{ width: `${Math.max(0, attemptedPct - masteredPct)}%` }} />
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-on-surface-variant font-label">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />Mastered (≥80%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary-container inline-block shrink-0" />Attempted
              </span>
            </div>
          </div>
          {attempted === 0 && (
            <p className="text-xs text-on-surface-variant text-center pt-3">
              Complete your first challenge to start tracking
            </p>
          )}
        </section>

        {/* Recent Challenges */}
        <section className="col-span-12 md:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-sm font-bold">Recent challenges</h3>
            <Link href="/challenges" className="text-[11px] font-bold text-primary font-label hover:underline">All →</Link>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="flex flex-col gap-1.5 flex-1">
              {recentAttempts.slice(0, 5).map((a, i) => (
                <Link
                  key={i}
                  href={`/challenges/${a.challenge_id}/feedback`}
                  className="flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl hover:bg-surface-container transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-on-surface truncate font-label">{a.challenge_title}</div>
                    <div className="text-[11px] text-on-surface-variant font-label mt-0.5">
                      {a.pattern_name ? `${a.pattern_name} · ` : ''}
                      {new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">open_in_new</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-6 gap-3 text-center">
              <LumaGlyph size={36} state="idle" className="text-primary" />
              <div>
                <p className="text-sm font-medium text-on-surface-variant">No practice history yet</p>
                <p className="text-[11px] text-on-surface-variant/70 mt-1 max-w-[200px]">Calibration challenges don&apos;t count — start a practice challenge.</p>
              </div>
              <Link href="/challenges" className="text-xs font-bold text-primary hover:underline">Browse challenges →</Link>
            </div>
          )}
          {recentAttempts.length > 0 && (
            <Link
              href="/challenges"
              className="block w-full mt-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-bold text-primary transition-colors text-center font-label"
            >
              Practice more
            </Link>
          )}
        </section>

        {/* Recent Interviews */}
        <section className="col-span-12 md:col-span-6 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">mic</span>
              <h3 className="font-headline text-sm font-bold">Recent interviews</h3>
            </div>
            <Link href="/live-interviews" className="text-[11px] text-primary font-label font-bold hover:underline">All →</Link>
          </div>
          {recentInterviews.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {recentInterviews.map((s) => {
                const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
                const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
                const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
                const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                return (
                  <Link
                    key={s.id}
                    href={s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '#'}
                    className="flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl hover:bg-surface-container transition-colors group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-on-surface font-label">{s.companyName}</p>
                      <p className="text-[11px] text-on-surface-variant font-label">{s.roleId} · {duration} · {date}</p>
                    </div>
                    {s.status === 'completed' && s.overallScore != null ? (
                      <span className="text-[11px] font-bold text-primary bg-primary-fixed rounded-lg px-2 py-0.5 tabular-nums font-label">
                        {s.overallScore}
                      </span>
                    ) : s.status === 'abandoned' ? (
                      <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-highest rounded-lg px-2 py-0.5 font-label">
                        Incomplete
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">mic</span>
              <p className="text-sm text-on-surface-variant">No interviews yet</p>
              <Link href="/live-interviews" className="text-[11px] text-primary hover:underline font-label font-bold">Start your first live interview →</Link>
            </div>
          )}
        </section>

        {/* Luma Reflection */}
        <section className="col-span-12 md:col-span-6">
          <LumaReflectionCard />
        </section>

        {/* Your Growth — collapsible */}
        <section className="col-span-12 bg-surface-container-low border border-outline-variant/30 rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-container transition-colors"
            onClick={() => setGrowthOpen(o => !o)}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
              <div>
                <h3 className="font-headline text-sm font-bold">Your growth</h3>
                <p className="text-[11px] text-on-surface-variant font-label">First response vs. latest</p>
              </div>
            </div>
            <span
              className="material-symbols-outlined text-on-surface-variant transition-transform duration-200"
              style={{ transform: growthOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              expand_more
            </span>
          </button>
          {growthOpen && (
            <div className="px-5 pb-5 border-t border-outline-variant/20">
              {growthSnapshot === null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 bg-surface-container-highest rounded animate-pulse" />
                      <div className="h-20 bg-surface-container rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : growthSnapshot.first === null ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">trending_up</span>
                  <p className="text-sm text-on-surface-variant">Complete your first challenge to see your growth</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-on-surface-variant font-label">First response</span>
                      <span className="bg-surface-container text-on-surface px-2 py-0.5 rounded-md text-[11px] font-bold font-label tabular-nums">
                        {growthSnapshot.first.grade_label} · {growthSnapshot.first.total_score}%
                      </span>
                    </div>
                    <p className="text-xs italic text-on-surface-variant bg-surface-container p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
                      &ldquo;{growthSnapshot.first.excerpt}&rdquo;
                    </p>
                  </div>
                  {growthSnapshot.latest === null ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-center bg-surface-container p-3 rounded-xl border border-outline-variant/20">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant/40">add_circle</span>
                      <p className="text-xs text-on-surface-variant">Complete more challenges to see your growth</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary font-label">Latest response</span>
                        <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded-md text-[11px] font-bold font-label tabular-nums">
                          {growthSnapshot.latest.grade_label} · {growthSnapshot.latest.total_score}%
                        </span>
                      </div>
                      <p className="text-xs text-on-surface bg-primary-fixed/40 p-3 rounded-xl border border-primary/20 leading-relaxed">
                        &ldquo;{growthSnapshot.latest.excerpt}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Certification Path */}
        <section className="col-span-12 bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Badge */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${isCertified ? 'border-primary bg-primary-fixed' : 'border-outline-variant bg-surface-container'}`}>
                <span
                  className={`material-symbols-outlined text-4xl ${isCertified ? 'text-primary' : 'text-on-surface-variant/30'}`}
                  style={{ fontVariationSettings: isCertified ? "'FILL' 1" : "'FILL' 0" }}
                >
                  verified
                </span>
              </div>
              <div className="text-center">
                <h3 className="font-headline font-bold text-sm">HackProduct certified</h3>
                <p className="text-[11px] font-bold font-label text-on-surface-variant mt-0.5">
                  {isCertified ? 'Achieved' : 'In progress'}
                </p>
              </div>
            </div>

            {/* Gates */}
            <div className="flex-1 w-full flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Gate 1 */}
                <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant font-label">Challenge quota</span>
                    {qualifiedChallenges >= CERT_CHALLENGE_QUOTA && (
                      <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <div className="text-base font-headline font-bold tabular-nums mb-1">
                    {qualifiedChallenges}<span className="text-on-surface-variant font-normal text-sm">/{CERT_CHALLENGE_QUOTA}</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-label mb-2">scored ≥ 60%</div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${challengePct}%` }} />
                  </div>
                </div>

                {/* Gate 2 */}
                <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-on-surface-variant font-label">Move mastery</span>
                    {movesAtLevel === CERT_MOVES.length && (
                      <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <div className="text-base font-headline font-bold tabular-nums mb-1">
                    {movesAtLevel}<span className="text-on-surface-variant font-normal text-sm">/{CERT_MOVES.length}</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-label mb-2">moves at level {CERT_MOVE_LEVEL}+</div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${movePct}%` }} />
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    {CERT_MOVES.map(m => {
                      const done = (moveLevelMap.get(m) ?? 0) >= CERT_MOVE_LEVEL
                      const color = MOVE_COLORS[m] ?? '#4a7c59'
                      return (
                        <div key={m} className="flex flex-col items-center gap-0.5">
                          <div
                            className="w-2 h-2 rounded-full transition-colors"
                            style={{ backgroundColor: done ? color : undefined }}
                          />
                          <span className="text-[10px] text-on-surface-variant capitalize font-label">{m}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Gate 3 — coming soon */}
                <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/20 opacity-40">
                  <div className="text-[11px] font-bold text-on-surface-variant font-label mb-2">Capstone</div>
                  <div className="text-base font-headline font-bold mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
                    Coming soon
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full" />
                </div>
              </div>

              {/* Overall bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-bold font-label mb-1.5">
                    <span>Overall certification progress</span>
                    <span className="tabular-nums">{overallPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
                  </div>
                </div>
                <LumaGlyph size={36} state={isCertified ? 'celebrating' : 'idle'} className="text-primary shrink-0" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
