import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FeedbackAccordion } from '@/components/challenge/FeedbackAccordion'
import { MentalModelsBreakdown } from '@/components/challenge/MentalModelsBreakdown'
import { AnimatedProgress, MotionSection } from '@/components/motion'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { Md } from '@/components/ui/Md'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { HatchFeedbackItem } from '@/lib/types'
import { IS_MOCK } from '@/lib/mock'
import { appendReturnTo, sanitizeReturnTo } from '@/lib/navigation/return-to'

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
  const { attempt, returnTo: rawReturnTo } = await searchParams
  const returnTo = sanitizeReturnTo(rawReturnTo)

  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const isMock = IS_MOCK || attempt === 'mock' || !attempt

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

  if (!isMock && attempt) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminClient = createAdminClient()
        const { data: attemptData } = await adminClient
          .from('challenge_attempts')
          .select('feedback_json, completed_at, response_text, mental_models_breakdown, weakest_competency, total_score, max_score, grade_label')
          .eq('id', attempt)
          .eq('user_id', user.id)
          .single()

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

            feedbackFull = {
              overall: typeof feedbackJson.overall_summary === 'string'
                ? feedbackJson.overall_summary
                : typeof feedbackJson.overall === 'string'
                  ? feedbackJson.overall
                : (MOCK_FEEDBACK_FULL.overall),
              what_worked: strengths.length > 0 ? strengths : MOCK_FEEDBACK_FULL.what_worked,
              what_to_fix: improvements.length > 0 ? improvements : MOCK_FEEDBACK_FULL.what_to_fix,
              dimensions: feedback.map(f => ({
                dimension: f.dimension,
                score: f.score,
                commentary: f.commentary,
                suggestions: f.suggestions,
              })),
              key_insight: typeof feedbackJson.key_insight === 'string'
                ? feedbackJson.key_insight
                : MOCK_FEEDBACK_FULL.key_insight,
              percentile: typeof feedbackJson.percentile === 'number'
                ? feedbackJson.percentile
                : MOCK_FEEDBACK_FULL.percentile,
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
        }

        if (weakestCompetency) {
          const { data: recommendation } = await adminClient
            .rpc('next_user_challenge', {
              p_user_id: user.id,
              p_competency: weakestCompetency,
            })
            .maybeSingle()

          if (recommendation) {
            const recommendedChallenge = recommendation as Record<string, unknown>
            nextChallenge = {
              id: String(recommendedChallenge.id),
              slug: typeof recommendedChallenge.slug === 'string' ? recommendedChallenge.slug : null,
              title: String(recommendedChallenge.title),
            }
          }
        }
      }
    } catch {
      feedback = MOCK_FEEDBACK
      feedbackFull = MOCK_FEEDBACK_FULL
    }
  }

  // Compute overall score on /100 scale
  const overallScoreNum = rawOverallScore != null
    ? rawOverallScore
    : feedback.length > 0
      ? Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length * 10)
      : 70

  const full = feedbackFull ?? MOCK_FEEDBACK_FULL
  const items = feedback.length > 0 ? feedback : (full.dimensions as HatchFeedbackItem[])

  // Determine score descriptor text
  const scoreDescriptor = overallScoreNum >= 90
    ? 'Excellent performance'
    : overallScoreNum >= 75
      ? 'Strong performance with room to grow'
      : overallScoreNum >= 60
        ? 'Good foundation, focus on the areas below'
        : 'Keep practicing, review the suggestions below'

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
  const challengeHref = appendReturnTo(
    `/workspace/challenges/${id}${attempt ? `?attempt=${encodeURIComponent(attempt)}` : ''}`,
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
              {challenge.tags.map(tag => (
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
          <MotionSection className="bg-surface-container p-5 rounded-xl editorial-shadow border-t-4 border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <HatchGlyph size={40} className="text-primary flex-shrink-0" />
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
            <p className="text-sm text-on-surface leading-relaxed mb-6">{full.overall}</p>

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

          {/* What Worked / What to Fix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface border-l-4 border-primary rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <h4 className="font-headline font-extrabold text-on-surface text-lg">What Worked</h4>
              </div>
              <ul className="space-y-2">
                {full.what_worked.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface border-l-4 border-secondary rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <h4 className="font-headline font-extrabold text-on-surface text-lg">Areas for Growth</h4>
              </div>
              <ul className="space-y-2">
                {full.what_to_fix.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-secondary text-lg flex-shrink-0">arrow_forward</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

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

          {/* Key Insight */}
          <div className="bg-tertiary-fixed rounded-xl p-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary flex-shrink-0 mt-0.5">lightbulb</span>
            <div>
              <p className="font-label font-semibold text-on-tertiary-fixed-variant mb-1">Key Insight</p>
              <p className="text-sm text-on-tertiary-fixed-variant">{full.key_insight}</p>
            </div>
          </div>

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
