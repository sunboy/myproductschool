import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FeedbackDisplay } from '@/components/challenge/FeedbackDisplay'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { LumaFeedbackItem } from '@/lib/types'

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

  if (!isMock && attempt) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const adminClient = createAdminClient()
        const { data: attemptData } = await adminClient
          .from('challenge_attempts')
          .select('feedback_json, score_json')
          .eq('id', attempt)
          .eq('user_id', user.id)
          .single()

        if (attemptData) {
          if (attemptData.feedback_json) {
            feedback = attemptData.feedback_json as LumaFeedbackItem[]
          }

          // Reconstruct feedbackFull from score_json if available
          const scoreJson = attemptData.score_json as Record<string, unknown> | null
          if (scoreJson) {
            const overall_score = typeof scoreJson.overall_score === 'number'
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
                question: typeof p.question === 'string' ? p.question : undefined,
              })),
              ...(overall_score !== null ? { overall_score } : {}),
            }
          }
        }
      }
    } catch {
      // Fall back to mock on any error
      feedback = MOCK_FEEDBACK
      feedbackFull = MOCK_FEEDBACK_FULL
    }
  }

  const overallScore = feedbackFull?.overall_score != null
    ? (feedbackFull.overall_score / 10).toFixed(1)
    : feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.score, 0) / feedback.length).toFixed(1)
      : '7.0'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link href={`/challenges/${id}`} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <span className="text-sm text-on-surface-variant">Feedback</span>
      </div>

      <FeedbackDisplay
        feedback={feedback}
        loading={false}
        feedbackFull={feedbackFull}
      />

      {/* Luma's Next Step */}
      <div className="space-y-4 pt-4">
        <div className="flex gap-3 p-5 bg-primary-fixed rounded-xl border border-primary/20">
          <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-on-surface leading-relaxed">
              You scored <span className="font-headline font-bold text-on-surface">{overallScore}/10</span>
              {feedbackFull?.detected_patterns && feedbackFull.detected_patterns.length > 0 && (
                <> — I noticed <span className="font-bold text-tertiary">{feedbackFull.detected_patterns[0].pattern_name}</span> in your response.</>
              )}
              {' '}Your diagnosis is ready.
            </p>
          </div>
        </div>

        <Link
          href={`/challenges/${id}/diagnosis?attempt=${attempt ?? 'mock'}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">psychology</span>
          See Your Diagnosis
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>

        <div className="flex items-center justify-center gap-4 pt-1">
          <Link href={`/challenges/${id}`} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Try again
          </Link>
          <span className="text-outline-variant">·</span>
          <Link href={`/challenges/${id}/model-answer`} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            Model answer
          </Link>
          <span className="text-outline-variant">·</span>
          <Link href={`/challenges/${id}/discussion`} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">forum</span>
            Discussion
          </Link>
          <span className="text-outline-variant">·</span>
          <Link href="/challenges" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">grid_view</span>
            All challenges
          </Link>
        </div>
      </div>
    </div>
  )
}
