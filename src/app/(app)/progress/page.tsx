'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'
import { LearnerDNASection } from './LearnerDNASection'

function LumaReflectionCard() {
  const [reflection, setReflection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/luma/growth-reflection', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.reflection) setReflection(data.reflection)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-surface-container rounded-xl p-5 flex gap-4 items-start mb-6 animate-luma-card">
      <LumaGlyph size={40} state="speaking" className="text-primary shrink-0 mt-1" />
      <div>
        <p className="font-label text-sm text-primary font-semibold mb-1">Luma&rsquo;s reflection</p>
        {loading ? (
          <p className="font-body text-sm text-on-surface-variant">Loading reflection...</p>
        ) : reflection ? (
          <p className="font-body text-sm text-on-surface">{reflection}</p>
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

interface MasteryEntry {
  challenge_id: string
  score: number | null
  is_completed: boolean
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

/* ---------- mock data ---------- */
const FLOW_MOVES_MOCK = [
  { name: 'Frame', level: 3, pct: 45, icon: 'navigation', color: '#5eaeff' },
  { name: 'List',  level: 3, pct: 78, icon: 'grid_view', color: '#2dd4a0', fill: true },
  { name: 'Optimize', level: 2, pct: 30, icon: 'balance', color: '#f59e0b', fill: true },
  { name: 'Win',  level: 1, pct: 60, icon: 'campaign', color: '#a78bfa', fill: true },
]

const MOVE_ICONS: Record<string, string> = {
  frame: 'crop_free', list: 'list', optimize: 'tune', win: 'emoji_events',
}
const MOVE_COLORS: Record<string, string> = {
  frame: '#5eaeff', list: '#2dd4a0', optimize: '#f59e0b', win: '#a78bfa',
}
const MOVE_DESCRIPTIONS: Record<string, string> = {
  frame: 'Define the right problem',
  list:  'Generate options',
  optimize: 'Pick the best tradeoff',
  win:   'Defend the decision',
}


// Certification thresholds
const CERT_CHALLENGE_QUOTA = 10      // challenges completed with score ≥ 60%
const CERT_MOVE_LEVEL = 3            // all 4 moves must reach this level
const CERT_MOVES: string[] = ['frame', 'list', 'optimize', 'win']

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()
  const { profile } = useProfile()
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [recentInterviews, setRecentInterviews] = useState<Array<{ id: string; companyName: string; roleId: string; status: string; overallScore: number | null; grade: string | null; durationSeconds: number | null; endedAt: string | null }>>([])
  const [masteryEntries, setMasteryEntries] = useState<MasteryEntry[]>([])
  const [growthSnapshot, setGrowthSnapshot] = useState<GrowthSnapshot | null>(null)
  const [growthOpen, setGrowthOpen] = useState(false)

  useEffect(() => {
    // Fetch recent attempts for pattern display
    fetch('/api/attempts?limit=5&include_patterns=true')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setRecentAttempts(data) })
      .catch(() => {})
    // Fetch mastery map from completed challenges
    fetch('/api/challenges/mastery')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setMasteryEntries(data) })
      .catch(() => {})
    // Fetch recent interview sessions
    fetch('/api/live-interview/history?limit=3')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.sessions) setRecentInterviews(data.sessions) })
      .catch(() => {})
    // Fetch growth snapshot (first vs latest response comparison)
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
        icon: MOVE_ICONS[m.move as string] ?? 'circle',
        color: MOVE_COLORS[m.move as string] ?? '#4a7c59',
        description: MOVE_DESCRIPTIONS[m.move as string] ?? '',
      }))
    : FLOW_MOVES_MOCK.map(m => ({ ...m, move: m.name.toLowerCase(), description: MOVE_DESCRIPTIONS[m.name.toLowerCase()] ?? '' }))

  return (
    <div className="max-w-7xl mx-auto p-6 w-full flex flex-col gap-6 animate-fade-in-up">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-primary">analytics</span>
        <div>
          <h1 className="text-2xl font-headline font-extrabold tracking-tight">Progress &amp; Analytics</h1>
          <p className="text-sm text-on-surface-variant">Your journey to engineering product mastery</p>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Archetype Card */}
        <section className="col-span-12 lg:col-span-7 bg-[#e8def8] rounded-xl p-5 flex items-center justify-between shadow-sm border border-[#d1c4e9]">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6750a4]">Thinking Archetype</span>
            </div>
            {profile?.archetype ? (
              <>
                <h2 className="text-3xl font-headline font-bold text-on-surface">{profile.archetype}</h2>
                {profile.archetype_description && (
                  <p className="text-sm text-on-surface-variant mt-2 max-w-md">{profile.archetype_description}</p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-headline font-bold text-on-surface">Complete calibration</h2>
                <p className="text-sm text-on-surface-variant mt-2 max-w-md">Your thinking archetype unlocks after the calibration assessment.</p>
              </>
            )}
            <button
              onClick={() => router.push('/profile/share')}
              className="mt-4 flex items-center gap-2 bg-[#6750a4] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#5a4591] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Share Archetype
            </button>
          </div>
          <div className="hidden sm:block">
            <LumaGlyph size={128} state={moves.length > 0 ? 'celebrating' : 'idle'} className="text-primary opacity-90" />
          </div>
        </section>

        {/* FLOW Skills */}
        <section className="col-span-12 lg:col-span-5 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <h3 className="text-sm font-bold mb-1">FLOW Skills</h3>
          <p className="text-[11px] text-on-surface-variant mb-4">Your proficiency at each step of the FLOW framework</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flowMoves.map((m) => (
              <div key={m.name} className="bg-white p-3 rounded-lg border border-outline-variant/20">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: m.color, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                  >
                    {m.icon}
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: `${m.color}15`, color: m.color }}
                  >
                    Level {m.level}
                  </span>
                </div>
                <div className="text-xs font-bold mb-0.5">{m.name}</div>
                <div className="text-[10px] text-on-surface-variant mb-2">{m.description}</div>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
                <div className="text-right text-[10px] mt-1 text-on-surface-variant">{m.pct}% to next level</div>
              </div>
            ))}
          </div>
        </section>

        {/* Learner DNA */}
        <section className="col-span-12 lg:col-span-5">
          <LearnerDNASection />
        </section>

        {/* Challenge Progress */}
        {(() => {
          const total = masteryEntries.length
          const attempted = masteryEntries.filter(e => e.is_completed).length
          const mastered = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 80).length
          const inProgress = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 50 && (e.score as number) < 80).length
          const attemptedPct = total > 0 ? Math.round((attempted / total) * 100) : 0
          const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0

          return (
            <section className="col-span-12 md:col-span-6 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
              <h3 className="text-sm font-bold mb-1">Challenge Progress</h3>
              <p className="text-[11px] text-on-surface-variant mb-5">{total} challenges available</p>

              <div className="flex flex-col gap-4">
                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container-low rounded-lg p-3 text-center">
                    <div className="text-2xl font-headline font-bold text-on-surface">{attempted}</div>
                    <div className="text-[10px] text-on-surface-variant font-medium mt-0.5">Attempted</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-headline font-bold text-primary">{mastered}</div>
                    <div className="text-[10px] text-primary/80 font-medium mt-0.5">Mastered</div>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3 text-center">
                    <div className="text-2xl font-headline font-bold text-tertiary">{inProgress}</div>
                    <div className="text-[10px] text-on-surface-variant font-medium mt-0.5">In Range</div>
                  </div>
                </div>

                {/* Stacked bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1.5">
                    <span>Library coverage</span>
                    <span>{attemptedPct}% attempted · {masteredPct}% mastered</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${masteredPct}%` }} />
                    <div className="h-full bg-tertiary-container transition-all duration-500" style={{ width: `${Math.max(0, attemptedPct - masteredPct)}%` }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Mastered (≥80%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary-container inline-block" />Attempted</span>
                  </div>
                </div>

                {attempted === 0 && (
                  <p className="text-xs text-on-surface-variant text-center pt-1">
                    Complete your first challenge to start tracking progress
                  </p>
                )}
              </div>
            </section>
          )
        })()}

        {/* Recent Thinking Patterns */}
        <section className="col-span-12 md:col-span-6 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold">Recent Challenges</h3>
            <Link href="/challenges" className="text-[10px] font-bold text-primary hover:underline">Browse all →</Link>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentAttempts.slice(0, 5).map((a, i) => (
                <Link
                  key={i}
                  href={`/challenges/${a.challenge_id}/feedback`}
                  className="bg-white/60 p-3 rounded-lg border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold truncate max-w-[200px]">{a.challenge_title}</div>
                    <div className="text-[10px] text-on-surface-variant">
                      {a.pattern_name ? `Pattern: ${a.pattern_name} • ` : ''}
                      {new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant">open_in_new</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
              <LumaGlyph size={40} state="idle" className="text-primary" />
              <p className="text-sm font-medium text-on-surface-variant">Your practice history will appear here</p>
              <p className="text-xs text-on-surface-variant/70">Calibration challenges don&apos;t count — start a practice challenge to build your record.</p>
              <Link href="/challenges" className="text-xs font-bold text-primary hover:underline">Browse challenges →</Link>
            </div>
          )}
          {recentAttempts.length > 0 && (
            <Link
              href="/challenges"
              className="block w-full mt-4 py-2 border border-primary/30 rounded-full text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors text-center"
            >
              Practice more challenges
            </Link>
          )}
        </section>

        {/* Recent Interviews */}
        <section className="col-span-12 lg:col-span-6 bg-surface-container rounded-xl p-5 border border-outline-variant/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">mic</span>
              <h3 className="text-sm font-bold">Recent Interviews</h3>
            </div>
            <Link href="/live-interviews" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentInterviews.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentInterviews.map((s) => {
                const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
                const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
                const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
                const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                return (
                  <Link
                    key={s.id}
                    href={s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '#'}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{s.companyName}</p>
                        <p className="text-[11px] text-on-surface-variant">{s.roleId} · {duration} · {date}</p>
                      </div>
                    </div>
                    {s.status === 'completed' && s.overallScore != null ? (
                      <span className="text-xs font-bold text-primary bg-primary-fixed rounded-full px-2 py-0.5">
                        {s.overallScore}
                      </span>
                    ) : s.status === 'abandoned' ? (
                      <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-highest rounded-full px-2 py-0.5">
                        Incomplete
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">mic</span>
              <p className="text-sm text-on-surface-variant">No interviews yet</p>
              <Link href="/live-interviews" className="text-xs text-primary hover:underline">Start your first live interview →</Link>
            </div>
          )}
        </section>

        {/* Luma Growth Reflection */}
        <section className="col-span-12">
          <LumaReflectionCard />
        </section>

        {/* Your Growth */}
        <section className="col-span-12 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/30">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-container-high transition-colors"
            onClick={() => setGrowthOpen(o => !o)}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              <div>
                <h3 className="text-sm font-bold">Your Growth</h3>
                <p className="text-[11px] text-on-surface-variant">First response vs. latest — how your thinking has evolved</p>
              </div>
            </div>
            <span
              className="material-symbols-outlined transition-transform duration-200"
              style={{ transform: growthOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              expand_more
            </span>
          </button>
          {growthOpen && (
            <div className="p-5 border-t border-outline-variant/20 bg-white/40">
              {growthSnapshot === null ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-surface-container-highest rounded animate-pulse w-24" />
                    <div className="h-20 bg-surface-container-low rounded-lg animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-surface-container-highest rounded animate-pulse w-24" />
                    <div className="h-20 bg-surface-container-low rounded-lg animate-pulse" />
                  </div>
                </div>
              ) : growthSnapshot.first === null ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant">trending_up</span>
                  <p className="text-sm text-on-surface-variant">Complete your first challenge to see your growth</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">First Response</span>
                      <span className="bg-surface-container-highest text-on-surface px-2 py-0.5 rounded text-[10px] font-bold">
                        {growthSnapshot.first.grade_label} · {growthSnapshot.first.total_score}%
                      </span>
                    </div>
                    <p className="text-xs italic text-on-surface-variant bg-surface-container-low p-3 rounded-lg border border-outline-variant/10 leading-relaxed">
                      &ldquo;{growthSnapshot.first.excerpt}&rdquo;
                    </p>
                  </div>
                  {growthSnapshot.latest === null ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-center bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">add_circle</span>
                      <p className="text-xs text-on-surface-variant">Complete more challenges to see your growth</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">Latest Response</span>
                        <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                          {growthSnapshot.latest.grade_label} · {growthSnapshot.latest.total_score}%
                        </span>
                      </div>
                      <p className="text-xs text-on-surface bg-primary/5 p-3 rounded-lg border border-primary/20 leading-relaxed">
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
        {(() => {
          const qualifiedChallenges = masteryEntries.filter(e => e.is_completed && e.score !== null && (e.score as number) >= 60).length
          const challengePct = Math.min(100, Math.round((qualifiedChallenges / CERT_CHALLENGE_QUOTA) * 100))

          const moveLevelMap = new Map<string, number>(moves.map(m => [m.move as string, m.level]))
          const movesAtLevel = CERT_MOVES.filter(m => (moveLevelMap.get(m) ?? 0) >= CERT_MOVE_LEVEL).length
          const movePct = Math.round((movesAtLevel / CERT_MOVES.length) * 100)

          const isCertified = qualifiedChallenges >= CERT_CHALLENGE_QUOTA && movesAtLevel === CERT_MOVES.length
          // Overall = average of two gates (capstone not yet available)
          const overallPct = Math.round((challengePct + movePct) / 2)

          return (
            <section className="col-span-12 bg-surface-container rounded-xl p-6 border border-outline-variant/30">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Badge */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-inner ${isCertified ? 'border-primary bg-primary/10' : 'border-outline-variant bg-surface-container-high'}`}>
                    <span
                      className={`material-symbols-outlined text-5xl ${isCertified ? 'text-primary' : 'text-on-surface-variant/40'}`}
                      style={{ fontVariationSettings: isCertified ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      verified
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-headline font-bold text-base">HackProduct Certified</h3>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {isCertified ? 'Achieved' : 'In Progress'}
                    </p>
                  </div>
                </div>

                {/* Gates */}
                <div className="flex-1 w-full flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Gate 1 — Challenge Quota */}
                    <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Challenge Quota</span>
                        {qualifiedChallenges >= CERT_CHALLENGE_QUOTA && (
                          <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </div>
                      <div className="text-sm font-bold mb-0.5">
                        {qualifiedChallenges} / {CERT_CHALLENGE_QUOTA}
                        <span className="text-[10px] font-normal text-on-surface-variant ml-1">scored ≥ 60%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${challengePct}%` }} />
                      </div>
                    </div>

                    {/* Gate 2 — Move Mastery */}
                    <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Move Mastery</span>
                        {movesAtLevel === CERT_MOVES.length && (
                          <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </div>
                      <div className="text-sm font-bold mb-0.5">
                        {movesAtLevel} / {CERT_MOVES.length}
                        <span className="text-[10px] font-normal text-on-surface-variant ml-1">moves at Level {CERT_MOVE_LEVEL}+</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${movePct}%` }} />
                      </div>
                      {/* Per-move dots */}
                      <div className="flex gap-1.5 mt-2">
                        {CERT_MOVES.map(m => {
                          const lvl = moveLevelMap.get(m) ?? 0
                          const done = lvl >= CERT_MOVE_LEVEL
                          return (
                            <div key={m} className="flex flex-col items-center gap-0.5">
                              <div className={`w-2 h-2 rounded-full ${done ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                              <span className="text-[9px] text-on-surface-variant capitalize">{m}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Gate 3 — Capstone (coming soon) */}
                    <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 opacity-50">
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">Capstone</div>
                      <div className="text-sm font-bold mb-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
                        Coming soon
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full" />
                    </div>
                  </div>

                  {/* Overall bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>Overall Certification Progress</span>
                        <span>{overallPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${overallPct}%` }} />
                      </div>
                    </div>
                    <LumaGlyph size={40} state={isCertified ? 'celebrating' : 'idle'} className="text-primary shrink-0" />
                  </div>
                </div>
              </div>
            </section>
          )
        })()}
      </div>

      {/* ── Footer ── */}
      <footer className="py-8 text-center border-t border-outline-variant/20 mt-4">
        <p className="text-[10px] text-on-surface-variant font-medium tracking-widest uppercase">Keep thinking. Keep building.</p>
      </footer>
    </div>
  )
}
