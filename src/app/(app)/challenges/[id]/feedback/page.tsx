import { feedbackSummaryScore } from '@/lib/feedback/summary-score'
import { HatchSuggestionCard } from '@/components/redesign/dashboard/HatchSuggestionCard'
import { getChallengeById } from '@/lib/data/challenges'
import { notFound, redirect } from 'next/navigation'
import { workspaceLocation } from '@/lib/workspace/location'
import Link from 'next/link'
import {
  Share2, ArrowRight, ChevronRight, CheckCircle2, Play, BookOpen,
  MessagesSquare, LayoutGrid, PenLine, BadgeCheck, Lightbulb,
} from 'lucide-react'
import { DimensionCard } from '@/components/feedback'

import { HatchImage } from '@/components/redesign/HatchImage'
import { NoteCard } from '@/components/redesign/NoteCard'
import { BackButton } from '@/components/navigation/BackButton'
import { Md } from '@/components/ui/Md'
import { FeedbackText } from '@/components/ui/FeedbackText'
import { formatCompany } from '@/lib/format/company'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HatchFeedbackItem } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'
import { appendReturnTo, sanitizeReturnTo } from '@/lib/navigation/return-to'
import { CanvasSnapshotViewer } from '@/components/v2/CanvasSnapshotViewer'

const dimensionConfig: Record<string, { label: string; icon: string }> = {
  diagnostic_accuracy: { label: 'Diagnostic Accuracy', icon: 'manage_search' },
  metric_fluency: { label: 'Metric Fluency', icon: 'analytics' },
  framing_precision: { label: 'Framing Precision', icon: 'frame_inspect' },
  recommendation_strength: { label: 'Recommendation Strength', icon: 'recommend' },
}

function prettifyDimension(key: string): string {
  return dimensionConfig[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatCompetencyLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Discipline accents for the FLOW breakdown cards (spec §Palette / preview
 * feedback-debrief.html .flow-dot): frame=green, list=blue, optimize=purple,
 * win=orange. */
const FLOW_STEP_ACCENT: Record<string, string> = {
  frame: 'var(--color-sd-fg)',
  list: 'var(--color-ps-fg)',
  optimize: 'var(--color-dm-fg)',
  win: 'var(--color-sql-fg)',
}

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function scorePercent(totalValue: unknown, maxValue: unknown): number | null {
  const total = toFiniteNumber(totalValue)
  const max = toFiniteNumber(maxValue)
  if (total == null || max == null || max <= 0) return null
  return Math.round((total / max) * 100)
}

interface FeedbackPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string; returnTo?: string; from_plan?: string; from_domain?: string }>
}

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const { id } = await params
  const { attempt: attemptParam, returnTo: rawReturnTo } = await searchParams
  const returnTo = sanitizeReturnTo(rawReturnTo)

  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // Explicit demo mode only. A real, signed-in user who lands here without an
  // `attempt` id must NEVER be shown canned MOCK coaching — for an AI-coaching
  // product that is the most corrosive possible bug. Instead, when no attempt
  // is supplied we resolve their latest completed attempt for this challenge
  // server-side and grade against THAT. If they have none, we render an honest
  // "no graded attempt yet" state below — not fabricated praise.
  const isMock = IS_MOCK || attemptParam === 'mock'

  // Resolve the effective attempt id: the explicit param, else the user's most
  // recent completed attempt on this challenge.
  let attempt: string | undefined = attemptParam && attemptParam !== 'mock' ? attemptParam : undefined
  let noGradedAttempt = false
  if (!isMock && !attempt) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const adminClient = createAdminClient()
      const { data: latest } = await adminClient
        .from('challenge_attempts')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latest?.id) {
        attempt = latest.id as string
      } else {
        noGradedAttempt = true
      }
    } else {
      noGradedAttempt = true
    }
  }

  if (!isMock && attempt && (challenge.challenge_type === 'algorithm' || challenge.challenge_type === 'sql')) {
    // Coding/SQL reviews are stored in interview_grades, not the FLOW feedback
    // payload. Preserve the exact attempt and let the owned history view load it.
    redirect(workspaceLocation(id, { attempt, returnTo: returnTo ?? undefined }))
  }

  let feedback: HatchFeedbackItem[] = isMock ? MOCK_FEEDBACK : []
  let feedbackFull: typeof MOCK_FEEDBACK_FULL | undefined = isMock ? MOCK_FEEDBACK_FULL : undefined
  let rawOverallScore: number | null = null
  let submissionDate: string | null = null
  let responseText: string | null = null
  type MentalModelStep = {
    step: string
    competency: string
    reasoning_move: string
    demonstrated: string
    missed: string
    framework_hint?: string | null
    score?: number | null
  }
  type NextChallenge = { id: string; slug: string | null; title: string }
  let mentalModelsBreakdown: MentalModelStep[] | null = null
  let weakestCompetency: string | null = null
  let nextChallenge: NextChallenge | null = null
  let canvasSnapshot: Record<string, unknown> | null = null
  type CanvasAnnotation = { target_label: string; text: string; severity?: string | null }
  let canvasAnnotations: CanvasAnnotation[] | null = null

  const isCanvasChallenge = challenge.challenge_type === 'system_design' || challenge.challenge_type === 'data_modeling'

  if (!isMock && attempt) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminClient = createAdminClient()
        const { data: attemptData } = await adminClient
          .from('challenge_attempts')
          .select('feedback_json, completed_at, response_text, mental_models_breakdown, weakest_competency, total_score, max_score, grade_label, canvas_final_snapshot')
          .eq('id', attempt)
          .eq('user_id', user.id)
          // Scope to THIS challenge + completed, so a crafted link with a foreign
          // or in-progress attempt id can't render under this challenge URL.
          .eq('challenge_id', id)
          .eq('status', 'completed')
          .maybeSingle()

        if (attemptData) {
          const feedbackJson = attemptData.feedback_json && typeof attemptData.feedback_json === 'object'
            ? attemptData.feedback_json as Record<string, unknown>
            : null
          const feedbackDimensions = Array.isArray(attemptData.feedback_json)
            ? attemptData.feedback_json
            : Array.isArray(feedbackJson?.dimensions)
              ? feedbackJson.dimensions
              : []
          if (feedbackDimensions.length > 0) {
            feedback = feedbackDimensions as HatchFeedbackItem[]
          }
          if (attemptData.completed_at) {
            submissionDate = attemptData.completed_at
          }
          if (attemptData.response_text) {
            responseText = attemptData.response_text as string
          }
          // Prefer the rollup breakdown inside feedback_json (it carries the
          // framework layer: framework_hint, missed, per-step score); the
          // column written mid-flight at step 'done' is the fallback.
          const fbJson = attemptData.feedback_json as { mental_models_breakdown?: MentalModelStep[] } | null
          if (Array.isArray(fbJson?.mental_models_breakdown) && fbJson.mental_models_breakdown.length) {
            mentalModelsBreakdown = fbJson.mental_models_breakdown
          } else if (attemptData.mental_models_breakdown) {
            mentalModelsBreakdown = attemptData.mental_models_breakdown as MentalModelStep[]
          }
          if (typeof attemptData.weakest_competency === 'string') {
            weakestCompetency = attemptData.weakest_competency
          }

          if (feedbackJson) {
            rawOverallScore = typeof feedbackJson.overall_score === 'number'
              ? feedbackJson.overall_score
              : typeof feedbackJson.overall === 'number'
                ? (feedbackJson.overall as number) * 10
                : scorePercent(attemptData.total_score, attemptData.max_score)

            const detectedPatterns = Array.isArray(feedbackJson.detected_patterns)
              ? (feedbackJson.detected_patterns as Array<Record<string, unknown>>)
              : []

            const strengths = Array.isArray(feedbackJson.strengths)
              ? (feedbackJson.strengths as string[])
              : []
            const improvements = Array.isArray(feedbackJson.improvements)
              ? (feedbackJson.improvements as string[])
              : []

            // Real attempt: missing fields stay EMPTY, never backfilled from
            // MOCK_FEEDBACK_FULL. Showing a real user mock "what worked" / key
            // insight / percentile is the same fabricated-coaching bug as the
            // mock page itself. Downstream UI hides empty sections.
            feedbackFull = {
              overall: typeof feedbackJson.overall_summary === 'string'
                ? feedbackJson.overall_summary
                : typeof feedbackJson.overall === 'string'
                  ? feedbackJson.overall
                : '',
              what_worked: strengths,
              what_to_fix: improvements,
              dimensions: feedback.map(f => ({
                dimension: f.dimension,
                score: f.score,
                commentary: f.commentary,
                suggestions: f.suggestions,
              })),
              key_insight: typeof feedbackJson.key_insight === 'string'
                ? feedbackJson.key_insight
                : '',
              // percentile is not rendered on this page; 0 = "unknown" (never
              // shown), so we don't carry a fabricated mock percentile.
              percentile: typeof feedbackJson.percentile === 'number'
                ? feedbackJson.percentile
                : 0,
              detected_patterns: detectedPatterns.map(p => ({
                pattern_id: String(p.pattern_id ?? ''),
                pattern_name: String(p.pattern_name ?? ''),
                confidence: typeof p.confidence === 'number' ? p.confidence : 0,
                evidence: String(p.evidence ?? ''),
                question: typeof p.question === 'string' ? p.question : 'q1',
              })),
            }
          } else {
            rawOverallScore = scorePercent(attemptData.total_score, attemptData.max_score)
          }

          if (!weakestCompetency && typeof feedbackJson?.weakest_competency === 'string') {
            weakestCompetency = feedbackJson.weakest_competency
          }
          if (!mentalModelsBreakdown && Array.isArray(feedbackJson?.mental_models_breakdown)) {
            mentalModelsBreakdown = feedbackJson.mental_models_breakdown as MentalModelStep[]
          }

          if (isCanvasChallenge && attemptData.canvas_final_snapshot && typeof attemptData.canvas_final_snapshot === 'object') {
            canvasSnapshot = attemptData.canvas_final_snapshot as Record<string, unknown>
          }
        }

        const [gradeResult, recommendationResult] = await Promise.all([
          isCanvasChallenge && canvasSnapshot
            ? adminClient.from('interview_grades').select('canvas_annotations').eq('attempt_id', attempt).maybeSingle()
            : Promise.resolve({ data: null }),
          adminClient.rpc('next_user_challenge', {
            p_user_id: user.id,
            p_competency: weakestCompetency ?? null,
          }).maybeSingle(),
        ])

        if (gradeResult.data?.canvas_annotations && Array.isArray(gradeResult.data.canvas_annotations)) {
          canvasAnnotations = gradeResult.data.canvas_annotations as CanvasAnnotation[]
        }

        // Competency-targeted recommendation. ~92% of challenges have no
        // competency tags, so this RPC frequently returns nothing — fall back to
        // ANY unattempted published challenge so "Up next" is never empty.
        let recommendedRow = recommendationResult.data as Record<string, unknown> | null
        if (!recommendedRow && weakestCompetency) {
          const fallback = await adminClient
            .rpc('next_user_challenge', { p_user_id: user.id, p_competency: null })
            .maybeSingle()
          recommendedRow = (fallback.data as Record<string, unknown> | null) ?? null
        }
        if (recommendedRow) {
          nextChallenge = {
            id: String(recommendedRow.id),
            slug: typeof recommendedRow.slug === 'string' ? recommendedRow.slug : null,
            title: String(recommendedRow.title),
          }
        }
      }
    } catch {
      // A real attempt failed to load — show the honest empty/error state rather
      // than fabricating coaching the user never received.
      noGradedAttempt = true
    }
  }

  // If we're in a real (non-mock) flow but resolved no graded content at all
  // (attempt belonged to another user, was deleted, or has no feedback), do not
  // fall through to MOCK_FEEDBACK_FULL — show the honest empty state.
  const hasFeedbackSignal = feedback.length > 0 || Boolean(mentalModelsBreakdown?.length) || rawOverallScore !== null || Boolean(feedbackFull?.overall || feedbackFull?.what_worked?.length || feedbackFull?.what_to_fix?.length || feedbackFull?.key_insight)
  if (!isMock && !hasFeedbackSignal) {
    noGradedAttempt = true
  }

  if (noGradedAttempt) {
    const browseHref = returnTo ?? '/challenges'
    const retryHref = appendReturnTo(`/workspace/challenges/${id}`, returnTo)
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12">
        <BackButton href={browseHref} label="Back to practice" className="mb-8" />
        <div className="rounded-2xl border border-hairline bg-card-bright p-8 md:p-10 text-center">
          <HatchImage state="idle" size={72} className="mx-auto mb-5" />
          <h1 className="font-headline text-2xl font-semibold text-forest-950 mb-2">
            No feedback yet
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-md mx-auto mb-7">
            Submit your work to receive personalized feedback on your reasoning and suggestions for what to explore next.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={retryHref}
              className="inline-flex items-center gap-1.5 bg-forest-950 text-white rounded-lg px-5 py-2.5 font-label font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <Play size={15} strokeWidth={1.8} />
              Start this challenge
            </Link>
            <Link
              href={browseHref}
              className="inline-flex items-center gap-1.5 bg-card-bright border border-hairline text-ink-strong rounded-lg px-5 py-2.5 font-label font-bold text-sm hover:bg-page-field transition-colors"
            >
              Browse practice
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const overallScoreNum = feedbackSummaryScore(rawOverallScore, feedback)

  // Only the mock/demo path may fall back to MOCK_FEEDBACK_FULL. On the real
  // path (e.g. an attempt that has mental_models_breakdown but no feedback_json)
  // we use an empty shell so no mock strengths/insight/percentile ever render.
  const EMPTY_FEEDBACK_FULL: typeof MOCK_FEEDBACK_FULL = {
    ...MOCK_FEEDBACK_FULL,
    overall: '',
    what_worked: [],
    what_to_fix: [],
    dimensions: [],
    key_insight: '',
    percentile: 0,
    detected_patterns: [],
  }
  const full = feedbackFull ?? (isMock ? MOCK_FEEDBACK_FULL : EMPTY_FEEDBACK_FULL)
  const items = feedback.length > 0 ? feedback : (full.dimensions as HatchFeedbackItem[])

  // Format submission date
  const formattedDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null

  // Word count from response or estimate
  const wordCount = responseText
    ? responseText.split(/\s+/).filter(Boolean).length
    : null

  // Map dimensions to accordion panel data
  const dimensionPanels = items.map((item, idx) => ({
    index: idx + 1,
    dimension: item.dimension,
    label: prettifyDimension(item.dimension),
    icon: dimensionConfig[item.dimension]?.icon ?? 'bar_chart',
    score: item.score,
    maxScore: 10,
    commentary: item.commentary,
    suggestions: item.suggestions,
    needsWork: item.score < 7,
  }))

  // Map detected patterns
  const detectedPatterns = full.detected_patterns?.map(p => ({
    pattern_name: p.pattern_name,
    confidence: p.confidence,
    evidence: p.evidence,
  })) ?? []
  const nextChallengeHref = nextChallenge
    ? `/workspace/challenges/${nextChallenge.slug ?? nextChallenge.id}`
    : undefined
  const shareHref = `/workspace/challenges/${id}/share${attempt ? `?attempt=${encodeURIComponent(attempt)}` : ''}`
  const browseHref = returnTo ?? '/challenges'

  // Lowest-scoring FLOW step gets the "Needs focus" treatment (scores are the
  // rollup's real 0-100 percents; steps without a score never get the tag).
  const flowScores = (mentalModelsBreakdown ?? [])
    .map(s => (typeof s.score === 'number' ? s.score : null))
    .filter((s): s is number => s != null)
  const lowestFlowScore = flowScores.length > 0 ? Math.min(...flowScores) : null

  const evidenceCards = detectedPatterns.filter(dp => dp.evidence && dp.evidence.trim().length > 0)

  return (
    <div className="learning-feedback max-w-[1240px] mx-auto px-4 md:px-6 py-5">

      {/* Crumb row */}
      <div className="mb-3 flex items-center gap-3">
        <BackButton href={browseHref} label="Back to practice" />
        {formattedDate && <span className="rounded-full bg-sd-bg px-3 py-1 text-xs font-bold text-forest-600 tabular-nums">Completed {formattedDate ?? 'Not recorded'}</span>}
      </div>

      {/* Title row */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-[28px] font-bold text-forest-950">Reflect on your work</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-secondary">
            <span>{challenge.title}</span>
            <span className="text-ink-muted">&middot;</span>
            <span className="capitalize">{challenge.difficulty}</span>
            <span className="text-ink-muted">&middot;</span>
            <span className="tabular-nums">{challenge.estimated_minutes} min</span>
          </div>
        </div>
        {overallScoreNum !== null && (<Link
          href={shareHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-hairline bg-card-bright px-4 py-2 text-[13px] font-bold text-ink-strong hover:bg-page-field transition-colors"
        >
          <Share2 size={15} strokeWidth={1.8} />
          Share debrief
        </Link>)}
      </div>

      {/* Center column + right rail */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-5">

          <div className="learning-feedback-summary">
            <div><p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">Your feedback</p><h2 className="font-headline text-2xl font-medium">Understand your work. Choose your next step.</h2>
              {full.overall && <FeedbackText className="mt-3 block text-base leading-relaxed text-ink-secondary">{full.overall}</FeedbackText>}
            </div>
            {overallScoreNum !== null && <div className="learning-feedback-score" aria-label={`Assessment score ${overallScoreNum} out of 100`}><strong>{overallScoreNum}</strong><span>out of 100</span></div>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
          {/* Strengths — mint (coach/positive) */}
          {full.what_worked.length > 0 && (
            <NoteCard tint="mint" className="rounded-xl p-4">
              <h4 className="mb-2.5 text-[14px] font-bold text-ink-strong">What worked</h4>
              <ul className="space-y-2">
                {full.what_worked.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-forest-600 text-white">
                      <CheckCircle2 size={12} strokeWidth={2.2} className="text-white" />
                    </span>
                    <FeedbackText className="min-w-0 flex-1 text-[13px] leading-snug text-ink-strong">{item}</FeedbackText>
                  </li>
                ))}
              </ul>
            </NoteCard>
          )}

          {/* Growth areas — blush (review) */}
          {full.what_to_fix.length > 0 && (
            <NoteCard tint="blush" className="rounded-xl p-4">
              <h4 className="mb-2.5 text-[14px] font-bold text-ink-strong">Where to go deeper</h4>
              <ul className="space-y-2">
                {full.what_to_fix.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    {/* Raw hex kept intentionally: nearest token (note-blush-border #dcbcd6) is far
                        lighter and the bullet would lose contrast against the blush note fill. */}
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b06ba3]" />
                    <FeedbackText className="min-w-0 flex-1 text-[13px] leading-snug text-ink-strong">{item}</FeedbackText>
                  </li>
                ))}
              </ul>
            </NoteCard>
          )}

          </div>

          {/* ── FLOW breakdown ── */}
          {mentalModelsBreakdown && mentalModelsBreakdown.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-lg font-semibold text-forest-950">FLOW breakdown</h3>
                <div className="hidden items-center gap-4 text-xs text-ink-secondary sm:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-forest-600" />
                    On track
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-flame" />
                    Needs focus
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {mentalModelsBreakdown.map((item) => {
                  const stepKey = item.step.toLowerCase()
                  const accent = FLOW_STEP_ACCENT[stepKey] ?? 'var(--color-forest-600)'
                  const pct = typeof item.score === 'number'
                    ? Math.max(0, Math.min(100, Math.round(item.score)))
                    : null
                  const needsFocus = pct != null && lowestFlowScore != null && pct === lowestFlowScore && pct < 75
                  return (
                    <div key={item.step} className="rounded-xl border border-hairline bg-card-bright p-4">
                      <div className="flex items-center gap-2">
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
                        <span className="text-[13px] font-bold capitalize" style={{ color: accent }}>{item.step}</span>
                      </div>
                      {pct != null && (
                        <div className="mt-1 font-headline text-2xl font-bold text-forest-950 tabular-nums">{pct}%</div>
                      )}
                      {item.demonstrated && item.demonstrated !== 'No signal recorded' && (
                        <p className="mt-1.5 text-[12.5px] leading-snug text-ink-secondary line-clamp-3">{item.demonstrated}</p>
                      )}
                      {pct != null && (
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-hairline">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: needsFocus ? 'var(--color-flame)' : 'var(--color-forest-600)' }}
                          />
                        </div>
                      )}
                      {needsFocus && (
                        <div className="mt-1.5 text-[10.5px] font-bold text-flame">Needs focus</div>
                      )}
                      {item.missed && (
                        <p className="mt-1.5 text-[11.5px] leading-snug text-ink-muted">{item.missed}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Evidence highlights (grader-detected patterns with evidence) ── */}
          {evidenceCards.length > 0 && (
            <div>
              <h3 className="font-headline text-lg font-semibold text-forest-950">From your answer</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {evidenceCards.map((dp, i) => (
                  <NoteCard key={dp.pattern_name} tint={i % 2 === 0 ? 'amber' : 'teal'} className="rounded-xl p-3.5">
                    <p className="text-[13px] font-semibold leading-snug text-ink-strong">
                      &ldquo;{dp.evidence}&rdquo;
                    </p>
                    <div className="mt-2 text-[11.5px] font-bold text-ink-secondary">{dp.pattern_name}</div>
                  </NoteCard>
                ))}
              </div>
            </div>
          )}

          {/* Canvas snapshot (system_design / data_modeling only) */}
          {isCanvasChallenge && canvasSnapshot && (
            <div>
              <h3 className="font-headline text-lg font-semibold text-forest-950">Your diagram</h3>
              <div className="mt-3">
                <CanvasSnapshotViewer snapshot={canvasSnapshot} annotations={canvasAnnotations} />
              </div>
            </div>
          )}

          {/* Per-dimension coaching: the one shared DimensionCard. */}
          {dimensionPanels.length > 0 && (
            <div>
              <h3 className="font-headline text-lg font-semibold text-forest-950">Feedback by skill</h3>
              <div className="mt-3 flex flex-col gap-2.5">
                {(() => {
                  const lowest = dimensionPanels.reduce(
                    (min, d) => (d.score < min ? d.score : min),
                    Infinity,
                  )
                  return dimensionPanels.map((d) => (
                    <DimensionCard
                      key={d.dimension}
                      label={d.label}
                      raw={d.score}
                      scale={10}
                      verdict={d.commentary}
                      howToImprove={d.suggestions?.length ? d.suggestions.join(' ') : null}
                      focus={d.score === lowest && d.needsWork}
                    />
                  ))
                })()}
              </div>
            </div>
          )}

          {/* Key Insight — hidden when a real attempt has none (no mock fallback) */}
          {full.key_insight && (
            <NoteCard tint="amber" className="flex items-start gap-3 rounded-xl p-4">
              <Lightbulb size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-ink-secondary" />
              <div className="min-w-0">
                <p className="mb-1 text-[13px] font-bold text-ink-strong">Key insight</p>
                <FeedbackText className="text-[13px] leading-relaxed text-ink-strong">{full.key_insight}</FeedbackText>
              </div>
            </NoteCard>
          )}

          {/* ── Recommended challenge ── */}
          {nextChallenge && nextChallengeHref && (
            <div
              className="flex flex-col items-start gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-6"
              style={{
                background: 'linear-gradient(120deg, #eef6e6 0%, #e4f0da 100%)',
                borderColor: '#d8e8ca',
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-forest-600">Recommended challenge</p>
                <p className="mt-1 font-headline text-[19px] font-semibold leading-snug text-forest-950">{nextChallenge.title}</p>
                {weakestCompetency && (
                  <p className="mt-1 text-[13px] text-ink-secondary">
                    Picked because {formatCompetencyLabel(weakestCompetency)} is an area you can develop further.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2">
                <Link
                  href={nextChallengeHref}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-forest-950 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  Open challenge
                  <ArrowRight size={15} strokeWidth={2} />
                </Link>
                <Link
                  href={browseHref}
                  className="inline-flex items-center gap-1 text-[12.5px] font-bold text-forest-700 hover:underline"
                >
                  Browse challenges
                  <ChevronRight size={13} strokeWidth={1.9} />
                </Link>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link
              href={`/challenges/${id}/diagnosis?attempt=${attempt ?? 'mock'}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-forest-950 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              <BadgeCheck size={16} strokeWidth={1.8} />
              See diagnosis
            </Link>
            <Link
              href={`/workspace/challenges/${id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline bg-card-bright py-2.5 text-sm font-bold text-ink-strong hover:bg-page-field transition-colors"
            >
              <PenLine size={15} strokeWidth={1.8} />
              Try again
            </Link>
            {overallScoreNum !== null && (<Link
              href={shareHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline bg-card-bright py-2.5 text-sm font-bold text-ink-strong hover:bg-page-field transition-colors"
            >
              <Share2 size={15} strokeWidth={1.8} />
              Share feedback
            </Link>)}
          </div>

          {/* Links row */}
          <div className="flex items-center justify-center gap-4 pb-4 pt-1">
            <Link href={`/challenges/${id}/model-answer`} className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-forest-700 transition-colors">
              <BookOpen size={13} strokeWidth={1.8} />
              Model answer
            </Link>
            <span className="text-ink-muted">&#183;</span>
            <Link href={`/challenges/${id}/discussion`} className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-forest-700 transition-colors">
              <MessagesSquare size={13} strokeWidth={1.8} />
              Discussion
            </Link>
            <span className="text-ink-muted">&#183;</span>
            <Link href="/challenges" className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-forest-700 transition-colors">
              <LayoutGrid size={13} strokeWidth={1.8} />
              All challenges
            </Link>
          </div>
        </section>

        {/* ── Right rail ── */}
        <aside className="min-w-0 space-y-3">
          <HatchSuggestionCard message="Make sense of your feedback" buttonLabel="Help me understand my feedback" prompt={`Help me understand my feedback for ${challenge.title}. ${full.overall}`} />
          <Link href="/explore" className="block rounded-xl border border-hairline p-4 text-sm font-bold text-forest-800">Browse the Library →</Link>

          {/* Case context */}
          <div className="rounded-xl border border-hairline bg-card-bright p-4">
            <h4 className="text-[14px] font-bold text-ink-strong">The case</h4>
            <p className="mt-1.5 text-[13.5px] font-bold text-forest-700">{challenge.title}</p>
            <div className="mt-2 max-h-48 overflow-y-auto text-[12.5px] leading-relaxed text-ink-secondary">
              <Md variant="compact" tone="inherit">{challenge.prompt_text ?? ''}</Md>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from(new Set([
                ...((challenge as unknown as { topic_tags?: string[] }).topic_tags ?? []),
                ...((challenge as unknown as { technique_tags?: string[] }).technique_tags ?? challenge.tags ?? []),
              ])).map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-hairline bg-page-field px-2 py-0.5 text-[11px] font-semibold text-ink-secondary"
                >
                  {formatCompany(tag)}
                </span>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-hairline pt-3 text-[12px] text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Submitted</span>
                <span className="font-bold text-ink-strong tabular-nums">{formattedDate ?? 'Not recorded'}</span>
              </div>
              {wordCount && (
                <div className="flex items-center justify-between">
                  <span>Response length</span>
                  <span className="font-bold text-ink-strong tabular-nums">{wordCount} words</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Estimated time</span>
                <span className="font-bold text-ink-strong tabular-nums">{challenge.estimated_minutes} min</span>
              </div>
            </div>
          </div>

          {/* Submitted response */}
          {responseText && (
            <div className="rounded-xl border border-hairline bg-card-bright p-4">
              <h4 className="mb-2 text-[14px] font-bold text-ink-strong">Your response</h4>
              <div className="max-h-64 overflow-y-auto whitespace-pre-line rounded-lg border border-hairline bg-page-field p-3 text-[12.5px] leading-relaxed text-ink-secondary">
                {responseText}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
