'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { useAttempt } from '@/hooks/useAttempt'

/* ── Dimension Config ─────────────────────────────────────── */

const DIMENSIONS = [
  { key: 'problem_reframe',         label: 'Problem Reframing',     color: '#5eaeff' },
  { key: 'user_segmentation',       label: 'User Segmentation',     color: '#2dd4a0' },
  { key: 'data_reasoning',          label: 'Data Reasoning',        color: '#22d3ee' },
  { key: 'tradeoff_clarity',        label: 'Tradeoff Clarity',      color: '#f59e0b' },
  { key: 'communication',           label: 'Communication',         color: '#a78bfa' },
] as const

/* ── Mock fallback ────────────────────────────────────────── */

const MOCK_SCORES: Record<string, number> = {
  problem_reframe: 4, user_segmentation: 5, data_reasoning: 3, tradeoff_clarity: 4, communication: 2,
}

const MOCK_PATTERNS = [
  { pattern_id: 'aggregate_fallacy', pattern_name: 'Aggregate Fallacy', confidence: 0.87, evidence: 'Treated all users as one group when analyzing the failure. This obscured the fact that the feature actually worked for 20% of your power users while confusing the casual base.' },
  { pattern_id: 'data_delay', pattern_name: 'Data Delay', confidence: 0.72, evidence: 'Called for more research when the qualitative feedback from the beta was already sufficient to pivot. In an interview, this comes across as indecisiveness.' },
]

const MOCK_FEEDBACK = {
  feedback_text: 'Your approach to identifying the "backfired" component was strong—you correctly isolated the new UI as the primary friction point. However, your proposed solution leaned heavily on reverting to the previous state, which ignores the strategic reasons why the change was made in the first place.\n\nGreat product thinkers don\'t just roll back; they re-integrate. You identified the user pain but missed the opportunity to explain how you\'d keep the business objective while fixing the user experience.',
  thinking_pattern: { title: 'Build On, Don\'t Tear Down', body: 'You successfully leveraged existing features rather than suggesting a full rebuild. This shows an understanding of organizational constraints and user muscle memory.' },
  trap_dodged: 'Surface-Level Restatement',
  interview_tip: 'When a feature fails, interviewers look for radical accountability. Instead of blaming "marketing" or "bad luck," show you can trace the failure back to a specific faulty assumption in your initial hypothesis.',
  recommended_answer: 'A strong response would: (1) Segment users into power users who benefit vs casual users who are confused, (2) Propose an A/B test with the feature gated behind user tenure, (3) Quantify the expected impact on both DAU and revenue, (4) Present a 2-week rollout plan with kill-switch criteria.',
  xp_earned: 85,
}

const MOCK_CHALLENGE = {
  title: 'The Feature That Backfired',
  paradigm: 'Traditional',
  difficulty: 'Easy',
}

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

function getScores(feedback: unknown): Record<string, number> {
  if (!feedback) return MOCK_SCORES
  if (Array.isArray(feedback)) {
    const map: Record<string, number> = {}
    for (const item of feedback) {
      if (item.dimension && typeof item.score === 'number') {
        map[item.dimension] = Math.round(item.score / 20) // 0-100 → 0-5
      }
    }
    return Object.keys(map).length >= 4 ? map : MOCK_SCORES
  }
  if (typeof feedback === 'object' && feedback !== null && 'scores' in feedback) {
    return (feedback as { scores: Record<string, number> }).scores
  }
  return MOCK_SCORES
}

function getFeedbackText(feedback: unknown): string {
  if (!feedback) return MOCK_FEEDBACK.feedback_text
  if (Array.isArray(feedback)) {
    return feedback.map((f: { commentary?: string }) => f.commentary).filter(Boolean).join('\n\n')
  }
  if (typeof feedback === 'object' && feedback !== null && 'feedback' in feedback) {
    return (feedback as { feedback: string }).feedback
  }
  return MOCK_FEEDBACK.feedback_text
}

/* ── Page ─────────────────────────────────────────────────── */

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [showRecommended, setShowRecommended] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then(p => setChallengeId(p.id))
  }, [params])

  // Get attempt ID from URL or fetch latest for this challenge
  const attemptId = searchParams.get('attempt')
  const { attempt, feedback, patterns, isLoading, error } = useAttempt(attemptId)

  // Derive display data
  const scores = getScores(feedback)
  const feedbackText = getFeedbackText(feedback)
  const detectedPatterns = patterns.length > 0 ? patterns : MOCK_PATTERNS
  const challengeTitle = (attempt as Record<string, unknown>)?.challenge_prompts
    ? ((attempt as Record<string, { title?: string }>).challenge_prompts?.title ?? MOCK_CHALLENGE.title)
    : MOCK_CHALLENGE.title
  const overallScore = typeof (attempt as Record<string, unknown>)?.score === 'number'
    ? (attempt as { score: number }).score
    : Object.values(scores).reduce((a, b) => a + b, 0) * 4 // rough estimate
  const xpEarned = MOCK_FEEDBACK.xp_earned

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

      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-on-surface">{challengeTitle}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: '#2dd4a0' }}>
                {MOCK_CHALLENGE.paradigm}
              </span>
              <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {MOCK_CHALLENGE.difficulty}
              </span>
              <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                +{xpEarned} XP
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {detectedPatterns.length === 0 && (
            <span className="text-sm font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Clean Run ✦
            </span>
          )}
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
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Radar Chart */}
              <div className="relative w-48 h-48 shrink-0">
                <svg className="w-full h-full" style={{ transform: 'rotate(-18deg)' }} viewBox="0 0 200 200">
                  {/* Pentagon Grids */}
                  {[1, 0.75, 0.5, 0.25].map((scale, i) => {
                    const pts = radarPoints(100, 100, 90 * scale, 5)
                    return <polygon key={i} fill="none" style={{ stroke: '#c4c8bc', strokeDasharray: '2' }} points={pts} />
                  })}
                  {/* Data Shape */}
                  {(() => {
                    const vals = DIMENSIONS.map(d => (scores[d.key] ?? 3) / 5)
                    const pts = radarDataPoints(100, 100, 90, vals)
                    return <polygon style={{ fill: '#4a7c59', fillOpacity: 0.3, stroke: '#4a7c59', strokeWidth: 2 }} points={pts} />
                  })()}
                  {/* Score dots */}
                  {(() => {
                    const vals = DIMENSIONS.map(d => (scores[d.key] ?? 3) / 5)
                    return DIMENSIONS.map((d, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
                      const r = 90 * vals[i]
                      return <circle key={d.key} cx={100 + r * Math.cos(angle)} cy={100 + r * Math.sin(angle)} fill={d.color} r="3" />
                    })
                  })()}
                </svg>
              </div>

              {/* Score Bars */}
              <div className="flex-1 w-full space-y-4">
                {DIMENSIONS.map(d => {
                  const score = scores[d.key] ?? 3
                  return (
                    <div key={d.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-on-surface-variant">{d.label}</span>
                        <span style={{ color: d.color }}>{score}/5</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: d.color, width: `${(score / 5) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Thinking Pattern + Trap Dodged */}
          <div className="grid grid-cols-1 gap-4">
            <div className="card-elevated border-l-4 border-primary p-4">
              <div className="flex gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Thinking Pattern Identified</h3>
                  <p className="text-lg font-bold font-headline text-primary mb-2">{MOCK_FEEDBACK.thinking_pattern.title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{MOCK_FEEDBACK.thinking_pattern.body}</p>
                </div>
              </div>
            </div>
            {MOCK_FEEDBACK.trap_dodged && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">shield</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Trap Dodged</p>
                  <p className="text-sm font-bold text-on-surface">{MOCK_FEEDBACK.trap_dodged}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Anti-Patterns */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-error">warning</span>
            Anti-Patterns Detected
            {detectedPatterns.length === 0 && <span className="text-sm font-normal text-on-surface-variant ml-2">None — great job!</span>}
          </h2>
          {(detectedPatterns as Array<{ pattern_id: string; pattern_name: string; confidence: number; evidence: string }>).map((p) => (
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
              {TRAP_FIX[p.pattern_id] && (
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-error/10 text-sm">
                  <span className="font-bold text-error">💡 Fix: </span>
                  <span className="text-on-surface-variant">{TRAP_FIX[p.pattern_id]}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full-Width Bottom Section */}
      <section className="space-y-6">
        {/* Detailed Feedback */}
        <div className="card-elevated p-6">
          <div className="flex items-start gap-4 mb-6">
            <LumaGlyph size={48} state="celebrating" className="text-primary" />
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

          {/* Recommended Answer Collapsible */}
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
                {MOCK_FEEDBACK.recommended_answer}
              </div>
            )}
          </div>
        </div>

        {/* Interview Tip */}
        <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl p-5 flex gap-4">
          <div className="bg-tertiary text-on-tertiary w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-tertiary mb-1">Interview Tip</h4>
            <p className="text-sm text-on-surface-variant leading-snug">{MOCK_FEEDBACK.interview_tip}</p>
          </div>
        </div>
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
