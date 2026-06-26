import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FeedbackAccordion } from '@/components/challenge/FeedbackAccordion'
import { MentalModelsBreakdown } from '@/components/challenge/MentalModelsBreakdown'
import { AnimatedProgress, MotionSection } from '@/components/motion'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { Md } from '@/components/ui/Md'
import { FeedbackText } from '@/components/ui/FeedbackText'
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

function toFiniteNumber(value: unknown): number | null {
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
  searchParams: Promise<{ attempt?: string; returnTo?: string }>
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
          if (attemptData.mental_models_breakdown) {
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

        if (recommendationResult.data) {
          const recommendedChallenge = recommendationResult.data as Record<string, unknown>
          nextChallenge = {
            id: String(recommendedChallenge.id),
            slug: typeof recommendedChallenge.slug === 'string' ? recommendedChallenge.slug : null,
            title: String(recommendedChallenge.title),
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
  if (!isMock && feedback.length === 0 && !mentalModelsBreakdown) {
    noGradedAttempt = true
  }

  if (noGradedAttempt) {
    const browseHref = returnTo ?? '/challenges'
    const retryHref = appendReturnTo(`/workspace/challenges/${id}`, returnTo)
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-12">
        <AppBreadcrumbs
          className="mb-8"
          items={[
            { label: 'Practice', href: browseHref },
            { label: challenge.title, href: retryHref },
            { label: 'Feedback' },
          ]}
        />
        <div className="bg-surface-container rounded-2xl p-8 md:p-10 text-center editorial-shadow">
          <HatchGlyph size={56} state="idle" className="text-primary mx-auto mb-5" />
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">
            No graded attempt yet
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-md mx-auto mb-7">
            Hatch grades your reasoning the moment you submit. Run this challenge and
            it will read your actual work, then break down what landed and the one
            move that closes the gap.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={retryHref}
              className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              Start this challenge
            </Link>
            <Link
              href={browseHref}
              className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-container rounded-full px-6 py-2.5 font-label font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Browse practice
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Compute overall score on /100 scale
  const overallScoreNum = rawOverallScore != null
    ? rawOverallScore
    : feedback.length > 0
      ? Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length * 10)
      : 70

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

  // Determine score descriptor text
  const scoreDescriptor = overallScoreNum >= 90
    ? "That's the run that gets the offer"
    : overallScoreNum >= 75
      ? 'Strong run. One sharpening move below and this is yours for good'
      : overallScoreNum >= 60
        ? 'The shape is there. The gap below is the rep that closes it'
        : "Better to miss it here than in the room. Here's exactly where"

  // Format submission date
  const formattedDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })

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
  // Prefer the canonical text slug so the back-to-challenge link is clean and
  // skips the id→slug redirect hop (challenge was resolved via getChallengeById,
  // which returns the slug). Falls back to the route param if slug is absent.
  const challengeCanonical = (challenge as { slug?: string | null }).slug ?? id
  const challengeHref = appendReturnTo(
    `/workspace/challenges/${challengeCanonical}${attempt ? `?attempt=${encodeURIComponent(attempt)}` : ''}`,
    returnTo,
  )
  const nextChallengeHref = nextChallenge
    ? `/workspace/challenges/${nextChallenge.slug ?? nextChallenge.id}`
    : undefined
  const shareHref = `/workspace/challenges/${id}/share${attempt ? `?attempt=${encodeURIComponent(attempt)}` : ''}`

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
      <AppBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Practice', href: returnTo ?? '/challenges' },
          { label: challenge.title, href: challengeHref },
          { label: 'Feedback' },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <Link href={challengeHref} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <span className="text-sm text-on-surface-variant font-label">Back to challenge</span>
      </div>

      {/* Two-pane grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ─── Left Pane: Case Context (5 cols) ─── */}
        <section className="col-span-12 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-2xl font-bold text-on-surface">Case Context</h2>
            <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-xs font-bold uppercase tracking-wider">
              {challenge.difficulty}
            </span>
          </div>

          {/* Challenge card - sticky on desktop */}
          <div className="bg-surface-container p-5 rounded-xl editorial-shadow space-y-4 lg:sticky lg:top-24">
            {/* Challenge title */}
            <h3 className="font-headline text-xl font-bold text-primary">{challenge.title}</h3>

            {/* Prompt text */}
            <div className="text-sm text-on-surface-variant leading-relaxed">
              <Md variant="compact" tone="inherit">{challenge.prompt_text ?? ''}</Md>
            </div>

            {/* Tag chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from(new Set([
                ...((challenge as unknown as { topic_tags?: string[] }).topic_tags ?? []),
                ...((challenge as unknown as { technique_tags?: string[] }).technique_tags ?? challenge.tags ?? []),
              ])).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-surface-variant text-on-surface-variant rounded-md border border-outline-variant/30"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Submission details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface-variant uppercase">Submission Date</p>
                  <p className="text-sm font-semibold text-on-surface">{formattedDate}</p>
                </div>
              </div>
              {wordCount && (
                <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Response Length</p>
                    <p className="text-sm font-semibold text-on-surface">{wordCount} words</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">timer</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-on-surface-variant uppercase">Estimated Time</p>
                  <p className="text-sm font-semibold text-on-surface">{challenge.estimated_minutes} min</p>
                </div>
              </div>
            </div>

            {/* User's submitted response (if available) */}
            {responseText && (
              <div className="pt-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Your Response</p>
                <div className="bg-surface-container-lowest rounded-xl p-4 text-sm text-on-surface-variant leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line border border-outline-variant/20">
                  {responseText}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── Right Pane: Hatch's Analysis (7 cols) ─── */}
        <section className="col-span-12 lg:col-span-7 space-y-4">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Submission Review</h2>

          {/* Score Summary Card */}
          <MotionSection className="bg-surface-container p-5 rounded-xl editorial-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <HatchGlyph size={40} state={overallScoreNum >= 75 ? 'celebrating' : 'reviewing'} className="text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    Hatch&apos;s Analysis
                  </h3>
                  <p className="text-sm text-on-surface-variant">Hatch review</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-5xl font-headline font-extrabold text-primary">{(overallScoreNum / 10).toFixed(1)}</span>
                <span className="text-xl opacity-60">/10</span>
              </div>
            </div>

            {/* Score descriptor */}
            <p className="text-sm text-on-surface-variant mb-4">{scoreDescriptor}</p>

            {/* Overall assessment */}
            {full.overall && (
              <FeedbackText className="mb-6 text-on-surface">{full.overall}</FeedbackText>
            )}

            {/* Progress Bars for each dimension (summary) */}
            <div className="space-y-2">
              {items.map(item => {
                const percentage = (item.score / 10) * 100
                const barColor = item.score >= 7 ? 'bg-primary' : 'bg-secondary'
                return (
                  <div key={item.dimension} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col gap-2 w-full mr-4">
                      <span className="text-sm font-bold text-on-surface">{prettifyDimension(item.dimension)}</span>
                      <AnimatedProgress
                        value={percentage}
                        state={item.score >= 7 ? 'complete' : 'active'}
                        trackClassName="h-1.5 bg-background"
                        barClassName={barColor}
                      />
                    </div>
                    <span className="font-headline font-extrabold text-primary">{item.score.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </MotionSection>

          {/* Canvas Snapshot Viewer (system_design / data_modeling only) */}
          {isCanvasChallenge && canvasSnapshot && (
            <div className="bg-surface-container rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">schema</span>
                <h3 className="font-headline text-base font-semibold text-on-surface">Your diagram</h3>
              </div>
              <CanvasSnapshotViewer snapshot={canvasSnapshot} annotations={canvasAnnotations} />
            </div>
          )}

          {/* What Worked / What to Fix — only render a side when it has content
              (a real attempt with no strengths/improvements must not show an
              empty box, and must never backfill mock items). */}
          {(full.what_worked.length > 0 || full.what_to_fix.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {full.what_worked.length > 0 && (
                <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <h4 className="font-headline font-extrabold text-on-surface text-lg">What Worked</h4>
                  </div>
                  <ul className="space-y-2">
                    {full.what_worked.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">check_circle</span>
                        <FeedbackText className="flex-1 text-on-surface-variant">{item}</FeedbackText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {full.what_to_fix.length > 0 && (
                <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                    <h4 className="font-headline font-extrabold text-on-surface text-lg">Areas for Growth</h4>
                  </div>
                  <ul className="space-y-2">
                    {full.what_to_fix.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-secondary text-lg flex-shrink-0">arrow_forward</span>
                        <FeedbackText className="flex-1 text-on-surface-variant">{item}</FeedbackText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Dimension Expansion Panels (Accordions) */}
          <FeedbackAccordion
            dimensions={dimensionPanels}
            detectedPatterns={detectedPatterns.length > 0 ? detectedPatterns : undefined}
          />

          {/* Mental Models Breakdown (v2 challenges) */}
          {mentalModelsBreakdown && mentalModelsBreakdown.length > 0 && (
            <MentalModelsBreakdown
              breakdown={mentalModelsBreakdown}
              weakestCompetency={weakestCompetency ?? undefined}
              nextChallengeHref={nextChallengeHref}
              nextChallengeTitle={nextChallenge?.title}
            />
          )}

          {/* Key Insight — hidden when a real attempt has none (no mock fallback) */}
          {full.key_insight && (
            <div className="bg-tertiary-fixed rounded-xl p-5 flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary flex-shrink-0 mt-0.5">lightbulb</span>
              <div>
                <p className="font-label font-semibold text-on-tertiary-fixed-variant mb-1">Key Insight</p>
                <FeedbackText className="text-on-tertiary-fixed-variant">{full.key_insight}</FeedbackText>
              </div>
            </div>
          )}

          {/* Up next banner */}
          {nextChallenge && nextChallengeHref && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5">rocket_launch</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider font-label">Up next</p>
                  <p className="text-sm font-semibold text-on-surface truncate">{nextChallenge.title}</p>
                  {weakestCompetency && (
                    <p className="text-xs text-on-surface-variant font-label mt-0.5">
                      Targets your weakest move this run
                    </p>
                  )}
                </div>
              </div>
              <Link
                href={nextChallengeHref}
                className="py-3 px-6 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm whitespace-nowrap"
              >
                Start next challenge
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href={`/challenges/${id}/diagnosis?attempt=${attempt ?? 'mock'}`}
              className="flex-1 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm"
            >
              <span className="material-symbols-outlined">verified</span>
              See Diagnosis
            </Link>
            <Link
              href={`/workspace/challenges/${id}`}
              className="flex-1 py-3 border border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm"
            >
              <span className="material-symbols-outlined">edit_note</span>
              Try Again
            </Link>
            <Link
              href={shareHref}
              className="flex-1 py-3 border border-outline-variant text-on-surface rounded-full font-bold hover:bg-surface-container transition-all active:scale-95 flex items-center justify-center gap-2 font-label text-sm"
            >
              <span className="material-symbols-outlined">ios_share</span>
              Share scorecard
            </Link>
          </div>

          {/* Links row */}
          <div className="flex items-center justify-center gap-4 pt-1 pb-4">
            <Link href={`/challenges/${id}/model-answer`} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-label">
              <span className="material-symbols-outlined text-sm">auto_stories</span>
              Model answer
            </Link>
            <span className="text-outline-variant">&#183;</span>
            <Link href={`/challenges/${id}/discussion`} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-label">
              <span className="material-symbols-outlined text-sm">forum</span>
              Discussion
            </Link>
            <span className="text-outline-variant">&#183;</span>
            <Link href="/challenges" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-label">
              <span className="material-symbols-outlined text-sm">grid_view</span>
              All challenges
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
