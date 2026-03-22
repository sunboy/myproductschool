import { getChallengeById } from '@/lib/data/challenges'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FeedbackDisplay } from '@/components/challenge/FeedbackDisplay'
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

      {/* Actions */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Link
          href={`/challenges/${id}/diagnosis?attempt=${attempt ?? 'mock'}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">psychology</span>
          See your diagnosis →
        </Link>
        <Link
          href={`/challenges/${id}/discussion`}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-xl">forum</span>
          Join Discussion
        </Link>
        <Link
          href={`/challenges/${id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Try again
        </Link>
        <Link
          href={`/challenges/${id}/model-answer`}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm">auto_stories</span>
          View model answer
        </Link>
        <Link
          href="/challenges"
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm">grid_view</span>
          More challenges
        </Link>
      </div>
    </div>
  )
}
