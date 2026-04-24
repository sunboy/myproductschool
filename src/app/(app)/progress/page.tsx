'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { useMoveLevels } from '@/hooks/useMoveLevels'
import { useProfile } from '@/hooks/useProfile'
import { LearnerDNASection, useLearnerDNAData } from './LearnerDNASection'

/* ── FLOW paradigm palette — matches /explore FLOW strip ─────────── */

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

interface GrowthSnapshotEntry {
  excerpt: string
  grade_label: string
  total_score: number
}

interface GrowthSnapshot {
  first: GrowthSnapshotEntry | null
  latest: GrowthSnapshotEntry | null
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

const CERT_CHALLENGE_QUOTA = 10
const CERT_MOVE_LEVEL = 3
const CERT_MOVES: string[] = ['frame', 'list', 'optimize', 'win']

export default function ProgressPage() {
  const router = useRouter()
  const { moves } = useMoveLevels()
  const { profile } = useProfile()
  const { data: dnaData } = useLearnerDNAData()
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([])
  const [masteryEntries, setMasteryEntries] = useState<Array<{ challenge_id: string; score: number | null; is_completed: boolean }>>([])
  const [growthSnapshot, setGrowthSnapshot] = useState<GrowthSnapshot | null>(null)
  const [reflection, setReflection] = useState<string | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(true)

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
    fetch('/api/hatch/growth-reflection', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.reflection) setReflection(data.reflection) })
      .catch(() => {})
      .finally(() => setReflectionLoading(false))
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

  const streakDays = profile?.streak_days ?? 0
  const hasActivity = recentAttempts.length > 0 || recentInterviews.length > 0

  return (
    <div
      className="animate-fade-in-up"
      style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 32px 120px' }}
    >
      {/* ── HERO + FLOW (merged) ─────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 55%, #0e1a14 100%)',
        borderRadius: 32,
        padding: '48px 48px 40px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 32,
      }}>
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
          fontFamily: 'var(--font-headline)', fontSize: 200, fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: '#fff', opacity: 0.025,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
        }}>FLOW</div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center' }}>
          {/* Left — welcome + reflection + CTAs */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              padding: '5px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#9ee0b8',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7ee099', flexShrink: 0 }} />
              Your progress
              {streakDays > 0 && <span style={{ color: 'rgba(243,237,224,0.45)' }}>·</span>}
              {streakDays > 0 && <span>{streakDays} day streak</span>}
            </div>
            <h1 style={{
              margin: '0 0 18px',
              fontFamily: 'var(--font-headline)', fontWeight: 700,
              fontSize: 46, lineHeight: 1.05, letterSpacing: '-0.025em',
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
              display: 'flex', gap: 14, alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 18, padding: '16px 18px',
              marginBottom: 20,
            }}>
              <HatchGlyph size={40} state="speaking" className="shrink-0" />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase',
                  color: 'rgba(158,224,184,0.85)', marginBottom: 5,
                }}>
                  Hatch&rsquo;s reflection
                </div>
                {reflectionLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '90%' }} />
                    <div style={{ height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '75%' }} />
                    <div style={{ height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '60%' }} />
                  </div>
                ) : reflection ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reflection.split('\n\n').map((para, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(243,237,224,0.82)' }}>
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(243,237,224,0.62)' }}>
                    Complete a challenge to unlock your first reflection.
                  </p>
                )}
              </div>
            </div>

            {/* Inline stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
              <HeroStat k="Certification" v={`${overallPct}%`} />
              <HeroStat k="Mastered" v={total > 0 ? `${mastered}/${total}` : '—'} />
              <HeroStat
                k="Archetype"
                v={profile?.archetype ?? 'Not set'}
                small={!profile?.archetype}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/challenges"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f3ede0', color: '#1e1b14',
                  padding: '12px 22px', borderRadius: 999,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>explore</span>
                Browse challenges
              </Link>
              <Link
                href="/progress/skill-ladder"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.08)', color: '#f3ede0',
                  border: '1px solid rgba(255,255,255,0.14)',
                  padding: '12px 22px', borderRadius: 999,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>trending_up</span>
                Full skill ladder
              </Link>
            </div>
          </div>

          {/* Right — FLOW move grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {flowMoves.map(m => (
              <div key={m.k} style={{
                background: m.bg, borderRadius: 22, padding: '20px 18px',
                position: 'relative', overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div aria-hidden style={{
                  position: 'absolute', right: -4, bottom: -8,
                  fontFamily: 'var(--font-headline)', fontSize: 78, fontWeight: 800,
                  color: m.color, opacity: 0.10, lineHeight: 1, userSelect: 'none',
                  letterSpacing: '-0.04em', pointerEvents: 'none',
                }}>{m.k[0]}</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 9, background: m.color,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 16, fontVariationSettings: "'FILL' 1, 'wght' 500" }}>{m.icon}</span>
                    </div>
                    <div style={{
                      background: 'rgba(0,0,0,0.08)', color: m.color,
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
                    }}>
                      Lv {m.level}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{m.k}</div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginTop: 2, marginBottom: 12 }}>{m.sub}</div>
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

      {/* ── REASONING DNA ───────────────────────────────────── */}
      {dnaData && (
        <>
          <SectionHeading
            eyebrow="Reasoning DNA"
            title="Your reasoning DNA."
            href="/progress/skill-ladder"
            linkLabel="See how these map to FLOW"
          />
          <div style={{
            background: 'var(--color-surface-container)',
            borderRadius: 24,
            padding: '32px 36px',
            border: '1px solid var(--color-outline-variant)',
            marginBottom: 48,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            alignItems: 'center',
          }}>
            <div>
              <LearnerDNASection variant="embedded" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: 8 }}>
                What your profile says
              </div>
              <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                You&rsquo;re{' '}
                <span style={{ color: 'var(--color-primary)' }}>
                  {dnaData.overall_level.toLowerCase()}
                </span>{' '}
                across six axes.
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 14.5, lineHeight: 1.6, color: 'var(--color-on-surface-variant)' }}>
                Product thinking is six distinct reasoning habits working together. Your DNA shows which ones you lean on and which need reps.
              </p>
              {dnaData.weakest_link_label && (
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: 'var(--color-primary-fixed)',
                  borderRadius: 16, padding: '14px 18px',
                  border: '1px solid rgba(74,124,89,0.18)',
                }}>
                  <HatchGlyph size={32} state="idle" className="text-primary shrink-0" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 4 }}>
                      Hatch&rsquo;s nudge
                    </div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--color-on-surface)' }}>
                      Focus your next reps on <strong>{dnaData.weakest_link_label}</strong> — it&rsquo;s the fastest way to round out your profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── RECENT ACTIVITY ─────────────────────────────────── */}
      <SectionHeading
        eyebrow="The last few moves"
        title="Recent activity."
        href="/challenges"
        linkLabel="All history"
      />
      <div style={{
        background: 'var(--color-surface-container-low)',
        borderRadius: 24,
        padding: 28,
        border: '1px solid var(--color-outline-variant)',
        marginBottom: 48,
      }}>
        {hasActivity ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Challenges */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>target</span>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Challenges
                  </h3>
                </div>
                <Link href="/challenges" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
                  All →
                </Link>
              </div>
              {recentAttempts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recentAttempts.slice(0, 3).map((a, i) => (
                    <Link
                      key={i}
                      href={`/challenges/${a.challenge_id}/feedback`}
                      className="hover:bg-surface-container"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                        transition: 'background 150ms',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.challenge_title}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                          {a.pattern_name ? `${a.pattern_name} · ` : ''}
                          {new Date(a.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-on-surface-variant)', opacity: 0.5 }}>
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--color-on-surface-variant)', padding: '12px 14px', margin: 0 }}>
                  No practice challenges yet.
                </p>
              )}
            </div>

            {/* Interviews */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>mic</span>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Live interviews
                  </h3>
                </div>
                <Link href="/live-interviews" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
                  All →
                </Link>
              </div>
              {recentInterviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {recentInterviews.slice(0, 3).map(s => {
                    const mins = s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0
                    const secs = s.durationSeconds ? s.durationSeconds % 60 : 0
                    const duration = s.durationSeconds ? `${mins}:${String(secs).padStart(2, '0')}` : '—'
                    const date = s.endedAt ? new Date(s.endedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
                    return (
                      <Link
                        key={s.id}
                        href={s.status === 'completed' ? `/live-interviews/${s.id}/debrief` : '#'}
                        className="hover:bg-surface-container"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                          transition: 'background 150ms',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-on-surface)' }}>{s.companyName}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                            {s.roleId} · {duration} · {date}
                          </div>
                        </div>
                        {s.status === 'completed' && s.overallScore != null ? (
                          <span style={{
                            background: 'var(--color-primary-fixed)', color: 'var(--color-primary)',
                            padding: '3px 10px', borderRadius: 999,
                            fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                          }}>
                            {s.overallScore}
                          </span>
                        ) : s.status === 'abandoned' ? (
                          <span style={{
                            background: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface-variant)',
                            padding: '3px 10px', borderRadius: 999,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            Incomplete
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12.5, color: 'var(--color-on-surface-variant)', padding: '12px 14px', margin: 0 }}>
                  No live interviews yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
            <HatchGlyph size={48} state="idle" className="text-primary" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                No activity yet.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                Calibration challenges don&apos;t count — start a practice challenge to log your first move.
              </p>
            </div>
            <Link
              href="/challenges"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                padding: '10px 20px', borderRadius: 999,
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
              }}
            >
              Browse challenges
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── CHALLENGE COVERAGE (dark strip) ──────────────────── */}
      <SectionHeading
        eyebrow="Library mastery"
        title="Challenge coverage."
        href="/challenges"
        linkLabel="Browse all"
      />
      <div style={{
        background: 'linear-gradient(135deg, #1e3528 0%, #14241c 60%, #0e1a14 100%)',
        borderRadius: 32,
        padding: '40px 48px',
        position: 'relative', overflow: 'hidden',
        marginBottom: 48,
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -40, bottom: -80,
          fontFamily: 'var(--font-headline)', fontSize: 320, fontWeight: 800,
          letterSpacing: '-0.06em', lineHeight: 1,
          color: '#7ee099', opacity: 0.07,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
        }}>{masteredPct}%</div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48, alignItems: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CoverageStat label="Attempted" value={attempted} accent="#f3ede0" />
            <CoverageStat label="Mastered" value={mastered} accent="#7ee099" />
            <CoverageStat label="In range" value={inRange} accent="#c9e86e" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(243,237,224,0.45)', marginBottom: 10 }}>
              Library coverage
            </div>
            <div style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700, color: '#f3ede0', letterSpacing: '-0.02em', marginBottom: 18 }}>
              {attemptedPct}% attempted · {masteredPct}% mastered
            </div>
            <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', background: '#7ee099', width: `${masteredPct}%`, transition: 'width 700ms cubic-bezier(0.2,0.8,0.2,1)' }} />
              <div style={{ height: '100%', background: 'rgba(201,232,110,0.55)', width: `${Math.max(0, attemptedPct - masteredPct)}%`, transition: 'width 700ms cubic-bezier(0.2,0.8,0.2,1)' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 12, color: 'rgba(243,237,224,0.65)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7ee099' }} />
                Mastered (≥ 80%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(201,232,110,0.55)' }} />
                Attempted
              </span>
            </div>
            {attempted === 0 && (
              <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'rgba(243,237,224,0.55)' }}>
                Complete your first challenge to start tracking coverage.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── YOUR GROWTH STORY ───────────────────────────────── */}
      <SectionHeading
        eyebrow="First response vs. latest"
        title="Your growth story."
        href="/challenges"
        linkLabel="See all feedback"
      />
      <div style={{
        background: 'var(--color-surface-container-low)',
        borderRadius: 24,
        padding: 28,
        border: '1px solid var(--color-outline-variant)',
        marginBottom: 48,
      }}>
        {growthSnapshot === null ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 12, width: 100, background: 'var(--color-surface-container-highest)', borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 92, background: 'var(--color-surface-container)', borderRadius: 16 }} className="animate-pulse" />
              </div>
            ))}
          </div>
        ) : growthSnapshot.first === null ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-on-surface-variant)', opacity: 0.4 }}>trending_up</span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-on-surface-variant)' }}>
              Complete your first challenge to see your growth.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <GrowthPane
              eyebrow="First response"
              entry={growthSnapshot.first}
              tone="first"
            />
            {growthSnapshot.latest ? (
              <GrowthPane
                eyebrow="Latest response"
                entry={growthSnapshot.latest}
                tone="latest"
              />
            ) : (
              <div style={{
                background: 'var(--color-surface-container)',
                border: '1px dashed var(--color-outline-variant)',
                borderRadius: 20, padding: 24,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--color-on-surface-variant)', opacity: 0.5 }}>add_circle</span>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
                  Complete more challenges to see your growth.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CERTIFICATION PATH ──────────────────────────────── */}
      <SectionHeading
        eyebrow="Earn your HackProduct badge"
        title="Certification path."
        href="/challenges"
        linkLabel="What counts"
      />
      <div style={{
        background: 'linear-gradient(135deg, #faf6f0 0%, #f0ece4 100%)',
        borderRadius: 32,
        padding: '36px 44px',
        position: 'relative', overflow: 'hidden',
        border: '1px solid var(--color-outline-variant)',
        marginBottom: 24,
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -30, bottom: -60,
          fontFamily: 'var(--font-headline)', fontSize: 260, fontWeight: 800,
          letterSpacing: '-0.06em', lineHeight: 1,
          color: '#4a7c59', opacity: 0.05,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
        }}>{overallPct}</div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, alignItems: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 120, height: 120, borderRadius: 28,
              background: isCertified ? 'var(--color-primary)' : 'var(--color-primary-fixed)',
              border: isCertified ? '3px solid var(--color-primary)' : '2px solid var(--color-outline-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isCertified ? '0 20px 40px -16px rgba(74,124,89,0.4)' : 'none',
              transition: 'all 300ms',
            }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 64,
                  color: isCertified ? 'var(--color-on-primary)' : 'var(--color-primary)',
                  fontVariationSettings: isCertified ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                  opacity: isCertified ? 1 : 0.55,
                }}
              >
                verified
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface)' }}>
                HackProduct certified
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: isCertified ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {isCertified ? 'Achieved' : 'In progress'}
              </div>
            </div>
          </div>

          {/* Gates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {/* Gate 1 */}
              <GateCard
                icon="task_alt"
                label="Challenge quota"
                value={qualifiedChallenges}
                total={CERT_CHALLENGE_QUOTA}
                meta="scored ≥ 60%"
                pct={challengePct}
                done={qualifiedChallenges >= CERT_CHALLENGE_QUOTA}
              />
              {/* Gate 2 */}
              <GateCard
                icon="stars"
                label="Move mastery"
                value={movesAtLevel}
                total={CERT_MOVES.length}
                meta={`moves at Lv ${CERT_MOVE_LEVEL}+`}
                pct={movePct}
                done={movesAtLevel === CERT_MOVES.length}
                footer={
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    {FLOW_MOVES.map(m => {
                      const done = (moveLevelMap.get(m.move) ?? 0) >= CERT_MOVE_LEVEL
                      return (
                        <div key={m.move} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: done ? m.color : 'var(--color-outline-variant)',
                            transition: 'background 200ms',
                          }} />
                          <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'capitalize' }}>
                            {m.move}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                }
              />
              {/* Gate 3 */}
              <div style={{
                background: '#ffffff', borderRadius: 20, padding: '18px 18px 16px',
                border: '1px solid var(--color-outline-variant)',
                opacity: 0.5,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 10 }}>
                  lock
                </span>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>
                  Capstone
                </div>
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>
                  Coming soon
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-on-surface-variant)' }}>
                  Capstone challenge unlocks after the first two gates.
                </div>
              </div>
            </div>

            {/* Overall bar */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 8 }}>
                  <span>Overall certification progress</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{overallPct}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${overallPct}%`, borderRadius: 999, transition: 'width 700ms cubic-bezier(0.2,0.8,0.2,1)' }} />
                </div>
              </div>
              <HatchGlyph size={44} state={isCertified ? 'celebrating' : 'idle'} className="text-primary shrink-0" />
            </div>
          </div>
        </div>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-on-surface-muted)', marginBottom: 6 }}>
          {eyebrow}
        </div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--color-primary)', fontWeight: 700, fontSize: 13,
          background: 'transparent', border: 'none', textDecoration: 'none',
          letterSpacing: '0.04em',
        }}
      >
        {linkLabel}{' '}
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </Link>
    </div>
  )
}

function HeroStat({ k, v, small = false }: { k: string; v: string; small?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '10px 14px',
      backdropFilter: 'blur(8px)',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(243,237,224,0.5)', marginBottom: 3 }}>
        {k}
      </div>
      <div style={{
        fontFamily: 'var(--font-headline)',
        fontSize: small ? 14 : 18,
        fontWeight: 600, color: '#f3ede0',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.15,
      }}>
        {v}
      </div>
    </div>
  )
}

function CoverageStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 20, padding: '18px 16px',
      backdropFilter: 'blur(8px)',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700, color: accent, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(243,237,224,0.55)', marginTop: 8 }}>
        {label}
      </div>
    </div>
  )
}

function GrowthPane({ eyebrow, entry, tone }: {
  eyebrow: string
  entry: GrowthSnapshotEntry
  tone: 'first' | 'latest'
}) {
  const isLatest = tone === 'latest'
  return (
    <div style={{
      background: isLatest ? 'var(--color-primary-fixed)' : 'var(--color-surface-container)',
      border: `1px solid ${isLatest ? 'rgba(74,124,89,0.25)' : 'var(--color-outline-variant)'}`,
      borderRadius: 20, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: isLatest ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
          {eyebrow}
        </div>
        <span style={{
          background: isLatest ? 'var(--color-primary)' : 'var(--color-surface-container-highest)',
          color: isLatest ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
          padding: '3px 10px', borderRadius: 999,
          fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        }}>
          {entry.grade_label} · {entry.total_score}%
        </span>
      </div>
      <p style={{
        margin: 0, fontFamily: 'var(--font-headline)', fontSize: 15, fontStyle: 'italic',
        lineHeight: 1.55, color: 'var(--color-on-surface)',
      }}>
        &ldquo;{entry.excerpt}&rdquo;
      </p>
    </div>
  )
}

function GateCard({ icon, label, value, total, meta, pct, done, footer }: {
  icon: string
  label: string
  value: number
  total: number
  meta: string
  pct: number
  done: boolean
  footer?: React.ReactNode
}) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: 20, padding: '18px 18px 16px',
      border: '1px solid var(--color-outline-variant)',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--color-primary)', fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
          {icon}
        </span>
        {done && (
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-headline)', fontSize: 24, fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
        <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400, fontSize: 16 }}>/{total}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--color-on-surface-variant)', marginBottom: 10 }}>
        {meta}
      </div>
      <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--color-primary)', width: `${pct}%`, transition: 'width 700ms cubic-bezier(0.2,0.8,0.2,1)' }} />
      </div>
      {footer}
    </div>
  )
}

