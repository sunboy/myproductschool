import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LumaFeedbackItem } from '@/lib/types'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

interface FeedbackPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const { id } = await params
  const { attempt } = await searchParams

  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const isMock = process.env.USE_MOCK_DATA === 'true' || attempt === 'mock' || !attempt

  let feedback: LumaFeedbackItem[] = isMock ? MOCK_FEEDBACK : []
  let feedbackFull: typeof MOCK_FEEDBACK_FULL | undefined = isMock ? MOCK_FEEDBACK_FULL : undefined
  let rawOverallScore: number | null = null

  if (!isMock && attempt) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminClient = createAdminClient()
        const { data: attemptData } = await adminClient
          .from('challenge_attempts')
          .select('feedback_json, score_json, submitted_at, response_text')
          .eq('id', attempt)
          .eq('user_id', user.id)
          .single()

        if (attemptData) {
          if (attemptData.feedback_json) {
            feedback = attemptData.feedback_json as LumaFeedbackItem[]
          }

          const scoreJson = attemptData.score_json as Record<string, unknown> | null
          if (scoreJson) {
            rawOverallScore = typeof scoreJson.overall_score === 'number'
              ? scoreJson.overall_score
              : typeof scoreJson.overall === 'number'
                ? (scoreJson.overall as number) * 10
                : null

            const detectedPatterns = Array.isArray(scoreJson.detected_patterns)
              ? (scoreJson.detected_patterns as Array<Record<string, unknown>>)
              : []

            const strengths = Array.isArray(scoreJson.strengths)
              ? (scoreJson.strengths as string[])
              : []
            const improvements = Array.isArray(scoreJson.improvements)
              ? (scoreJson.improvements as string[])
              : []

            feedbackFull = {
              overall: typeof scoreJson.overall_summary === 'string'
                ? scoreJson.overall_summary
                : (MOCK_FEEDBACK_FULL.overall),
              what_worked: strengths.length > 0 ? strengths : MOCK_FEEDBACK_FULL.what_worked,
              what_to_fix: improvements.length > 0 ? improvements : MOCK_FEEDBACK_FULL.what_to_fix,
              dimensions: feedback.map(f => ({
                dimension: f.dimension,
                score: f.score,
                commentary: f.commentary,
                suggestions: f.suggestions,
              })),
              key_insight: typeof scoreJson.key_insight === 'string'
                ? scoreJson.key_insight
                : MOCK_FEEDBACK_FULL.key_insight,
              percentile: typeof scoreJson.percentile === 'number'
                ? scoreJson.percentile
                : MOCK_FEEDBACK_FULL.percentile,
              detected_patterns: detectedPatterns.map(p => ({
                pattern_id: String(p.pattern_id ?? ''),
                pattern_name: String(p.pattern_name ?? ''),
                confidence: typeof p.confidence === 'number' ? p.confidence : 0,
                evidence: String(p.evidence ?? ''),
                question: typeof p.question === 'string' ? p.question : 'q1',
              })),
            }
          }
        }
      }
    } catch {
      feedback = MOCK_FEEDBACK
      feedbackFull = MOCK_FEEDBACK_FULL
    }
  }

  const overallScoreNum = rawOverallScore != null
    ? rawOverallScore
    : feedback.length > 0
      ? Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length * 10)
      : 72

  const full = feedbackFull ?? MOCK_FEEDBACK_FULL

  // Five-dimension breakdown
  const dimensions = [
    { name: 'Problem Reframing', score: 4, maxScore: 5 },
    { name: 'User Segmentation', score: 5, maxScore: 5 },
    { name: 'Data Reasoning', score: 3, maxScore: 5 },
    { name: 'Tradeoff Clarity', score: 4, maxScore: 5 },
    { name: 'Communication', score: 2, maxScore: 5 },
  ]

  function scoreColor(score: number) {
    if (score >= 4) return 'bg-primary'
    if (score === 3) return 'bg-tertiary'
    return 'bg-error'
  }

  function scoreTextColor(score: number) {
    if (score >= 4) return 'text-primary'
    if (score === 3) return 'text-tertiary'
    return 'text-error'
  }

  // Anti-patterns from data or mock
  const antiPatterns = full.detected_patterns && full.detected_patterns.length > 0
    ? full.detected_patterns
    : [
        { pattern_id: 'FP-09', pattern_name: 'Aggregate Fallacy', confidence: 0.85, evidence: 'Treating all users as one group instead of segmenting by behavior.', question: 'q1' },
        { pattern_id: 'FP-04', pattern_name: 'Metric Recitation', confidence: 0.75, evidence: 'Named metrics without explaining selection rationale.', question: 'q2' },
      ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 animate-fade-in-up">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/challenges"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline text-xl font-bold text-on-surface">
              {challenge.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge-move bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check</span>
                Completed
              </span>
              <span className="badge-move bg-tertiary-container text-on-surface">
                +45 XP
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {/* ── Left column (3/5) ──────────────────────────── */}
          <div className="lg:col-span-3 space-y-3">
            {/* MIST Fingerprint section */}
            <div className="card-elevated p-4">
              <h2 className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
                MIST Fingerprint
              </h2>

              {/* Score bars */}
              <div className="space-y-2">
                {dimensions.map((dim) => (
                  <div key={dim.name} className="flex items-center gap-3">
                    <span className="w-36 text-xs font-label font-semibold text-on-surface">{dim.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreColor(dim.score)}`}
                        style={{ width: `${(dim.score / dim.maxScore) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${scoreTextColor(dim.score)}`}>
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                ))}
              </div>

              {/* Overall score */}
              <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <span className="font-label font-semibold text-on-surface-variant text-xs">Overall Score</span>
                <span className="text-xl font-headline font-bold text-primary">{overallScoreNum}/100</span>
              </div>
            </div>

            {/* Build On / Growth Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card-elevated p-4">
                <h3 className="font-label font-semibold text-on-surface text-xs mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
                  Build On
                </h3>
                <ul className="text-xs text-on-surface-variant font-body space-y-1.5">
                  {full.what_worked.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-elevated p-4">
                <h3 className="font-label font-semibold text-on-surface text-xs mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>trending_up</span>
                  Growth Areas
                </h3>
                <ul className="text-xs text-on-surface-variant font-body space-y-1.5">
                  {full.what_to_fix.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-error mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <LumaGlyph size={24} className="text-primary animate-luma-glow" />
                </div>
                <h2 className="font-headline text-sm font-bold text-on-surface">Detailed Feedback</h2>
              </div>

              <p className="text-xs text-on-surface-variant font-body leading-relaxed mb-3">
                {full.overall}
              </p>

              {/* Per-dimension commentary */}
              {full.dimensions && full.dimensions.map((dim, i) => (
                <div key={i} className="mt-3 pt-3 border-t border-outline-variant/20">
                  <h4 className="font-label font-semibold text-on-surface text-xs mb-0.5">
                    {dim.dimension.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                    {dim.commentary}
                  </p>
                  {dim.suggestions && dim.suggestions.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {dim.suggestions.map((s, j) => (
                        <li key={j} className="text-xs text-primary font-label flex items-start gap-1">
                          <span className="material-symbols-outlined text-[12px] mt-0.5">arrow_forward</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Key Conceptual Lesson */}
            <div className="bg-primary-fixed rounded-2xl p-4 editorial-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lightbulb</span>
                <h3 className="font-headline font-bold text-on-surface text-sm">Composition Effect</h3>
              </div>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                Aggregate metrics can hide opposing segment trends. When one user group grows while another shrinks, the blended average can move in a direction that reflects neither group accurately. Always decompose metrics by meaningful segments before drawing conclusions.
              </p>
              <p className="text-xs text-primary font-label font-semibold mt-2">
                Added to your Thinking Journal &rarr;
              </p>
            </div>

            {/* Interview Tip */}
            <div className="bg-primary-fixed rounded-2xl p-4 editorial-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>school</span>
                <h3 className="font-label font-semibold text-on-surface text-xs">Interview Tip</h3>
              </div>
              <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                Segment tickets by type and user cohort before presenting your analysis. Interviewers look for structured segmentation as a sign of analytical maturity.
              </p>
            </div>
          </div>

          {/* ── Right column (2/5) ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Anti-Patterns Detected */}
            <div className="card-elevated p-4">
              <h2 className="font-label font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>warning</span>
                Anti-Patterns Detected
              </h2>
              <div className="space-y-3">
                {antiPatterns.map((pattern, i) => (
                  <div key={i} className="bg-error/5 border border-error/15 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-label font-bold text-on-surface text-xs">{pattern.pattern_name}</span>
                      <span className="badge-move bg-error/10 text-error">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-body leading-relaxed">
                      {pattern.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Thinking Pattern Collected */}
            <div className="bg-tertiary-container/30 border border-tertiary-container rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lightbulb</span>
                <span className="font-label font-semibold text-on-surface text-xs">Pattern Collected</span>
              </div>
              <p className="text-xs text-on-surface-variant font-body">
                <span className="font-semibold text-on-surface">Composition Effect</span> — When aggregate metrics move oppositely, segment first.
              </p>
            </div>

            {/* Model Answer (Pro-locked) */}
            <div className="card-elevated p-4 relative overflow-hidden">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-2">Model Answer</h3>
              <p className="blur-sm text-xs text-on-surface-variant leading-relaxed">
                A comprehensive approach would involve segmenting users by historical behavior&hellip; classic Simpson&apos;s Paradox where aggregate rates drop because low-intent traffic was added. The candidate should identify at least three cohorts &mdash; power users, casual browsers, and dormant accounts &mdash; and analyze how each group responds differently to the proposed pricing change.
              </p>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-2" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>lock</span>
                <button className="bg-primary text-on-primary glow-primary rounded-full px-5 py-2 font-label font-semibold text-xs active:scale-95 transition-all">
                  Unlock with Pro
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 pb-2">
              <button className="flex items-center justify-center gap-2 border border-outline text-on-surface rounded-full px-5 py-2 font-label font-semibold text-xs hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[16px]">share</span>
                Share Score Card
              </button>
              <Link
                href="/challenges"
                className="text-center text-xs font-label font-semibold text-primary hover:underline"
              >
                Back to Practice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
