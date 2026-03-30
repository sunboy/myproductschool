'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useAttempt } from '@/hooks/useAttempt'

/* ── Dimension Config ─────────────────────────────────────── */

const DIMENSIONS = [
  { key: 'framing_precision',        label: 'Problem Reframing',     color: '#5eaeff' },
  { key: 'diagnostic_accuracy',      label: 'Diagnostic Accuracy',   color: '#2dd4a0' },
  { key: 'metric_fluency',           label: 'Data Reasoning',        color: '#22d3ee' },
  { key: 'recommendation_strength',  label: 'Recommendation',        color: '#f59e0b' },
] as const

/* ── Helpers ──────────────────────────────────────────────── */

const TRAP_FIX: Record<string, string> = {
  surface_restatement: 'Identify the underlying tension instead of restating the symptom.',
  aggregate_fallacy: 'Segment by behavior instead of treating the average as the reality.',
  confirmation_bias: 'Let data challenge the hypothesis before committing.',
  data_delay: 'Act on available signal even if imperfect; articulate what you\'d validate next while moving.',
  metric_tunnel: 'Trace the metric to real business impact.',
  abdication: 'Always pair data with a specific recommendation.',
  adversarial: 'Build on their insight, then redirect.',
  premature_solution: 'Understand the problem fully first.',
  model_product_gap: 'Ask: what user behavior actually changed?',
  over_autonomy: 'Match autonomy level to error cost.',
}

function getThinkingTraps(feedback: unknown): Array<{ trap_id: string; trap_name: string; description: string; fix_hint: string; confidence: number }> {
  if (!feedback || typeof feedback !== 'object' || !('thinking_traps' in feedback)) return []
  const traps = (feedback as { thinking_traps: unknown }).thinking_traps
  if (!Array.isArray(traps)) return []
  return traps as Array<{ trap_id: string; trap_name: string; description: string; fix_hint: string; confidence: number }>
}

/**
 * Returns scores keyed by dimension (0-5 scale for bar display).
 * Falls back to neutral 0.5 (on 0-5 = 2.5) if no real data.
 */
function getScores(feedback: unknown): Record<string, number> {
  const dims = (feedback as Record<string, unknown> | null)?.dimensions
  if (Array.isArray(dims) && dims.length > 0) {
    const map: Record<string, number> = {}
    for (const item of dims as Array<{ dimension?: string; score?: number }>) {
      if (item.dimension && typeof item.score === 'number') {
        // score is 0-10 → divide by 2 → 0-5 scale for bars
        map[item.dimension] = Math.round((item.score / 2) * 10) / 10
      }
    }
    if (Object.keys(map).length > 0) return map
  }
  // Neutral fallback: 2.5 out of 5
  return Object.fromEntries(DIMENSIONS.map(d => [d.key, 2.5]))
}

/**
 * Returns true if the scores are real (not fallback neutrals).
 */
function hasRealScores(feedback: unknown): boolean {
  const dims = (feedback as Record<string, unknown> | null)?.dimensions
  return Array.isArray(dims) && dims.length > 0
}

/**
 * Returns feedback text from dimension commentaries, or placeholder.
 */
function getFeedbackText(feedback: unknown): string {
  if (feedback && typeof feedback === 'object') {
    const f = feedback as Record<string, unknown>
    const dims = f.dimensions
    if (Array.isArray(dims) && dims.length > 0) {
      const parts = (dims as Array<{ commentary?: string }>)
        .map(d => d.commentary)
        .filter(Boolean) as string[]
      if (parts.length > 0) return parts.join('\n\n')
    }
    if (typeof f.overall_feedback === 'string' && f.overall_feedback) return f.overall_feedback
    if (typeof f.feedback === 'string' && f.feedback) return f.feedback
  }
  return 'Submit your response to receive Luma\'s detailed coaching.'
}

function getRecommendedAnswer(feedback: unknown): string | null {
  if (!feedback || typeof feedback !== 'object') return null
  const f = feedback as Record<string, unknown>
  if (typeof f.recommended_answer === 'string' && f.recommended_answer) return f.recommended_answer
  return null
}

function getInterviewTip(feedback: unknown): string | null {
  if (!feedback || typeof feedback !== 'object') return null
  const f = feedback as Record<string, unknown>
  if (typeof f.interview_tip === 'string' && f.interview_tip) return f.interview_tip
  return null
}

/* ── Page ─────────────────────────────────────────────────── */

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [showRecommended, setShowRecommended] = useState(false)
  const [barsAnimated, setBarsAnimated] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [prevLevel] = useState(2) // would come from pre-submission profile state in prod
  const barsRef = useRef<HTMLDivElement>(null)

  // Resolve params
  useEffect(() => {
    params.then(p => setChallengeId(p.id))
  }, [params])

  // Get attempt ID from URL or fetch latest for this challenge
  const attemptId = searchParams.get('attempt')
  const { attempt, feedback, patterns, isLoading } = useAttempt(attemptId)

  // Derive display data
  const scores = getScores(feedback)
  const realScores = hasRealScores(feedback)
  const feedbackText = getFeedbackText(feedback)
  const recommendedAnswer = getRecommendedAnswer(feedback)
  const interviewTip = getInterviewTip(feedback)

  // Animate score bars into view after a short delay (game feel)
  useEffect(() => {
    if (!isLoading && realScores) {
      const t = setTimeout(() => setBarsAnimated(true), 400)
      return () => clearTimeout(t)
    }
  }, [isLoading, realScores])

  // Thinking traps: prefer semantic traps from feedback_json, then Luma-detected patterns
  const thinkingTraps = getThinkingTraps(feedback)
  const detectedPatterns = thinkingTraps.length > 0
    ? thinkingTraps.map(t => ({ pattern_id: t.trap_id, pattern_name: t.trap_name, confidence: t.confidence, evidence: t.description, fix_hint: t.fix_hint }))
    : patterns

  const challengeTitle = (attempt as Record<string, unknown>)?.challenge_prompts
    ? ((attempt as Record<string, { title?: string }>).challenge_prompts?.title ?? 'Challenge Feedback')
    : 'Challenge Feedback'

  const overallScore = typeof (attempt as Record<string, unknown>)?.score === 'number'
    ? (attempt as { score: number }).score
    : Object.values(scores).reduce((a, b) => a + b, 0) * 4

  const xpEarned = typeof (attempt as Record<string, unknown>)?.xp_awarded === 'number'
    ? (attempt as { xp_awarded: number }).xp_awarded
    : null

  // Simulate level-up detection — in prod this compares pre/post XP level thresholds
  const newLevel = realScores ? Math.floor(overallScore / 25) + 1 : null
  useEffect(() => {
    if (newLevel !== null && newLevel > prevLevel) {
      const t = setTimeout(() => setShowLevelUp(true), 1200)
      return () => clearTimeout(t)
    }
  }, [newLevel, prevLevel])

  // Community benchmark — null until real data is available from /api/challenges/[id]/stats
  const communityAvg: number | null = null
  const communityPercentile: number | null = null

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <LumaGlyph size={64} state="reviewing" className="text-primary mx-auto" />
          <p className="text-sm text-on-surface-variant font-label">Loading your feedback...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6 animate-fade-in-up">

      {/* Level-Up Modal */}
      {showLevelUp && newLevel !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4 animate-fade-in-up">
            <LumaGlyph size={72} state="celebrating" className="text-primary mx-auto" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-tertiary mb-1">Level Up!</p>
              <h2 className="text-3xl font-headline font-black text-on-surface">Level {newLevel}</h2>
              <p className="text-sm text-on-surface-variant mt-2">Your Frame move just leveled up. Keep going — Level {newLevel + 1} is within reach.</p>
            </div>
            <button
              onClick={() => setShowLevelUp(false)}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Nice! Continue
            </button>
          </div>
        </div>
      )}

      {/* Celebration Banner — always shown on feedback load when scores are real */}
      {realScores && (
        <section className="bg-primary-container/30 border border-primary/20 rounded-xl p-5 flex items-center gap-5">
          <LumaGlyph size={56} state="celebrating" className="text-primary shrink-0" />
          <div className="flex-1">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {overallScore >= 80 ? 'Outstanding work!' : overallScore >= 60 ? 'Good thinking!' : 'Challenge complete!'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              You scored <span className="font-bold text-primary">{Math.round(overallScore)}/100</span>
              {communityPercentile !== null && (
                <> — top <span className="font-bold text-tertiary">{communityPercentile}%</span> of submissions</>
              )}
            </p>
          </div>
          {xpEarned !== null && (
            <div className="shrink-0 bg-primary text-on-primary rounded-xl px-5 py-3 text-center shadow-sm">
              <span className="text-2xl font-black font-headline">+{xpEarned}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider">XP</p>
            </div>
          )}
        </section>
      )}

      {/* Sebastian Thrun: LinkedIn credential nudge after high score */}
      {realScores && overallScore >= 70 && challengeId && (
        <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-5 py-3 flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface">Add this to your LinkedIn profile</p>
            <p className="text-[11px] text-on-surface-variant">Scored {Math.round(overallScore)}/100 — show your product thinking chops to your network</p>
          </div>
          <a
            href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`HackProduct Challenge — ${Math.round(overallScore)}/100`)}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent('https://hackproduct.io/verify')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-[#0077b5] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#006097] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            Add to LinkedIn
          </a>
        </section>
      )}

      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">{challengeTitle}</h1>
            <div className="flex items-center gap-2 mt-1">
              {xpEarned !== null && (
                <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  +{xpEarned} XP
                </span>
              )}
              {realScores && communityPercentile !== null && (
                <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  Top {communityPercentile}% of submissions
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {detectedPatterns.length === 0 && realScores && (
            <span className="text-sm font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Clean Run ✦
            </span>
          )}
          {/* Share score — Sebastian Thrun: shareable proof */}
          {realScores && challengeId && (
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://hackproduct.io')}&summary=${encodeURIComponent(`I scored ${Math.round(overallScore)}/100 on the HackProduct challenge: "${challengeTitle}". Sharpening my product thinking. hackproduct.io`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0077b5] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#006097] transition-colors"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              Share Score
            </a>
          )}
          <Link
            href={`/challenges/${challengeId}/discussion`}
            className="bg-secondary-container text-on-secondary-container px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">forum</span>
            View Discussion
          </Link>
          <Link href="/challenges" className="bg-primary text-on-primary px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:opacity-90 transition-all">
            Next Challenge
          </Link>
        </div>
      </section>

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Skill Fingerprint */}
        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h2 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Skill Fingerprint
            </h2>
            {!realScores && (
              <p className="text-sm text-on-surface-variant mb-4 italic">
                Complete a challenge to see your skill fingerprint.
              </p>
            )}
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Radar Chart */}
              <div className="relative w-48 h-48 shrink-0">
                <svg className="w-full h-full" style={{ transform: 'rotate(-18deg)' }} viewBox="0 0 200 200">
                  {/* Pentagon Grids */}
                  {[1, 0.75, 0.5, 0.25].map((scale, i) => {
                    const pts = radarPoints(100, 100, 90 * scale, 5)
                    return <polygon key={i} fill="none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points={pts} />
                  })}
                  {/* Data Shape — score is 0-5 scale, normalize to 0-1 for chart */}
                  {(() => {
                    const vals = DIMENSIONS.map(d => (scores[d.key] ?? 2.5) / 5)
                    const pts = radarDataPoints(100, 100, 90, vals)
                    return <polygon style={{ fill: '#4a7c59', fillOpacity: 0.3, stroke: '#4a7c59', strokeWidth: 2 }} points={pts} />
                  })()}
                  {/* Score dots */}
                  {(() => {
                    const vals = DIMENSIONS.map(d => (scores[d.key] ?? 2.5) / 5)
                    return DIMENSIONS.map((d, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
                      const r = 90 * vals[i]
                      return <circle key={d.key} cx={100 + r * Math.cos(angle)} cy={100 + r * Math.sin(angle)} fill={d.color} r="3" />
                    })
                  })()}
                </svg>
              </div>

              {/* Score Bars — animated reveal (Raph Koster: game feel) */}
              <div ref={barsRef} className="flex-1 w-full space-y-4">
                {DIMENSIONS.map((d, idx) => {
                  const score = scores[d.key] ?? 2.5
                  return (
                    <div key={d.key} className="space-y-1" style={{ transitionDelay: `${idx * 120}ms` }}>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-on-surface-variant">{d.label}</span>
                        <span style={{ color: d.color }}>{realScores ? `${score}/5` : '—'}</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: d.color,
                            width: barsAnimated ? `${(score / 5) * 100}%` : '0%',
                            transition: `width 700ms ease-out ${idx * 120}ms`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Thinking Traps / Anti-Patterns (left column summary) */}
          <div className="grid grid-cols-1 gap-4">
            {detectedPatterns.length === 0 ? (
              <div className="card-elevated border-l-4 border-primary p-4">
                <div className="flex gap-3 items-center">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Thinking Traps</h3>
                    <p className="text-sm font-semibold text-primary">No significant thinking traps detected.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Anti-Patterns */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-error">warning</span>
            Anti-Patterns Detected
            {detectedPatterns.length === 0 && <span className="text-sm font-normal text-on-surface-variant ml-2">None — great job!</span>}
          </h2>
          {detectedPatterns.length === 0 ? (
            <div className="card-elevated p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-sm font-semibold text-on-surface">No significant thinking traps detected.</p>
              <p className="text-xs text-on-surface-variant">Your reasoning was clear and well-structured.</p>
            </div>
          ) : (
            (detectedPatterns as Array<{ pattern_id: string; pattern_name: string; confidence: number; evidence: string; fix_hint?: string }>).map((p) => (
              <div key={p.pattern_id} className="border-l-4 border-error rounded-xl p-5 shadow-sm space-y-3 bg-error-container/30">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-error text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>dangerous</span>
                    {p.pattern_name}
                  </h3>
                  <span className="bg-error/10 text-error text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {Math.round(p.confidence * 100)}% conf
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{p.evidence}</p>
                {(p.fix_hint ?? TRAP_FIX[p.pattern_id]) && (
                  <div className="bg-surface-container-lowest p-3 rounded-lg border border-error/10 text-sm">
                    <span className="font-bold text-error">Fix: </span>
                    <span className="text-on-surface-variant">{p.fix_hint ?? TRAP_FIX[p.pattern_id]}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full-Width Bottom Section */}
      <section className="space-y-6">
        {/* Detailed Feedback */}
        <div className="card-elevated p-6">
          <div className="flex items-start gap-4 mb-6">
            <LumaGlyph size={48} state="speaking" className="text-primary" />
            <div>
              <h2 className="text-xl font-bold font-headline text-on-surface">Detailed Feedback</h2>
              <p className="text-sm text-on-surface-variant">Luma&apos;s evaluation of your strategy</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-4">
            {feedbackText.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Recommended Answer Collapsible — only show if real answer exists */}
          {recommendedAnswer && (
            <div className="mt-8 border-t border-outline-variant/30 pt-6">
              <button
                className="w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                onClick={() => setShowRecommended(!showRecommended)}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">lightbulb</span>
                  <span className="font-bold text-sm">View Recommended Answer</span>
                </div>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${showRecommended ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              {showRecommended && (
                <div className="mt-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 text-sm text-on-surface-variant leading-relaxed animate-fade-in">
                  {recommendedAnswer}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interview Tip — only show if real tip exists */}
        {interviewTip && (
          <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl p-5 flex gap-4">
            <div className="bg-tertiary text-on-tertiary w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-tertiary mb-1">Interview Tip</h4>
              <p className="text-sm text-on-surface-variant leading-snug">{interviewTip}</p>
            </div>
          </div>
        )}
      </section>

      <div className="h-10" />
    </div>
  )
}

/* ── Radar chart helpers ──────────────────────────────────── */

function radarPoints(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

function radarDataPoints(cx: number, cy: number, maxR: number, values: number[]): string {
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2
    const r = maxR * v
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}
