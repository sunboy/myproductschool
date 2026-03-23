import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FeedbackDisplay } from '@/components/challenge/FeedbackDisplay'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { MOCK_FEEDBACK, MOCK_FEEDBACK_FULL } from '@/lib/mock-data'

interface FeedbackPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const { id } = await params
  const { attempt } = await searchParams

  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  // In mock mode, always use mock feedback
  const isMock = process.env.USE_MOCK_DATA === 'true' || attempt === 'mock'
  const feedback = isMock ? MOCK_FEEDBACK : []
  const feedbackFull = isMock ? MOCK_FEEDBACK_FULL : undefined

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
        feedbackFull={isMock ? MOCK_FEEDBACK_FULL : undefined}
      />

      {/* Luma's Next Step */}
      <div className="space-y-4 pt-4">
        <div className="flex gap-3 p-5 bg-primary-fixed rounded-xl border border-primary/20">
          <LumaGlyph size={24} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-on-surface leading-relaxed">
              You scored <span className="font-headline font-bold text-on-surface">{feedbackFull?.overall ?? '7.0'}/10</span>
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
