import { getChallengeById } from '@/lib/data/challenges'
import { getChallengeDiscussions } from '@/lib/data/analytics'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LumaFeedbackCard } from '@/components/challenge/LumaFeedbackCard'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import { ExpertPicksPanel } from '@/components/challenge/ExpertPicksPanel'
import { MOCK_FEEDBACK_FULL } from '@/lib/mock-data'

export default async function ChallengeDiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const discussions = await getChallengeDiscussions(id)
  const feedbackExcerpt = (MOCK_FEEDBACK_FULL.overall ?? '').slice(0, 200)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <Link href="/challenges" className="hover:text-on-surface transition-colors">Challenges</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href={`/challenges/${id}`} className="hover:text-on-surface transition-colors line-clamp-1">{challenge.title}</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface">Discussion</span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Challenge Discussion</h1>
        <p className="text-on-surface-variant text-sm mt-1">Share your approach and learn from how others solved this challenge.</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-6">
          <LumaFeedbackCard
            challengeId={id}
            feedbackExcerpt={feedbackExcerpt}
          />
          <DiscussionInput challengeId={id} />
          {discussions.length > 0 ? (
            <div className="space-y-4">
              <h2 className="font-headline text-lg font-bold text-on-surface">{discussions.length} {discussions.length === 1 ? 'Response' : 'Responses'}</h2>
              {discussions.map(d => (
                <DiscussionThread key={d.id} discussion={d} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-3 block text-on-surface-variant/50">chat_bubble_outline</span>
              <p className="font-medium">No responses yet. Be the first to share your approach.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4 sticky top-20">
          <ExpertPicksPanel />
          {/* Stats */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
            <h3 className="font-bold text-on-surface text-sm mb-3">Discussion Stats</h3>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="font-headline text-2xl font-bold text-on-surface">{discussions.length}</div>
                <div className="text-xs text-on-surface-variant">responses</div>
              </div>
              <div className="text-center">
                <div className="font-headline text-2xl font-bold text-on-surface">{discussions.reduce((a, d) => a + (d.reply_count ?? 0), 0)}</div>
                <div className="text-xs text-on-surface-variant">replies</div>
              </div>
            </div>
          </div>
          {/* Participants */}
          {discussions.length > 0 && (
            <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
              <h3 className="font-bold text-on-surface text-sm mb-3">Participants</h3>
              <div className="space-y-2">
                {discussions.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="text-on-primary-container text-xs font-bold">{(d.username ?? 'U').slice(0, 2).toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-on-surface">{d.username ?? 'Anonymous'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
