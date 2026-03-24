import { getChallengeById } from '@/lib/data/challenges'
import { getChallengeDiscussions } from '@/lib/data/analytics'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DiscussionThread, SubReply } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import { ExpertPicksPanel } from '@/components/challenge/ExpertPicksPanel'
import { CommunityStatsPanel } from '@/components/challenge/CommunityStatsPanel'
import { RelatedTopicsPanel } from '@/components/challenge/RelatedTopicsPanel'
import { TopContributorsPanel } from '@/components/challenge/TopContributorsPanel'

export default async function ChallengeDiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const challenge = await getChallengeById(id)
  if (!challenge) notFound()

  const discussions = await getChallengeDiscussions(id)

  // The first discussion acts as the thread opener (OP)
  const opDiscussion = discussions[0] ?? null
  const replies = discussions.slice(1)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 pb-20">
      {/* Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-outline mb-4">
          <Link href="/challenges" className="hover:text-on-surface transition-colors">
            Challenges
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link
            href={`/challenges/${id}`}
            className="hover:text-on-surface transition-colors line-clamp-1"
          >
            {challenge.title}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-semibold">Discussion</span>
        </div>
        <h1 className="font-headline text-4xl font-bold text-on-surface mb-2">
          Challenge Discussion
        </h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Engage with the community on technical design implementation. Share your approach and learn from how others solved this challenge.
        </p>
      </div>

      {/* Two-column grid: 8 + 4 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Thread (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Thread Opener (OP) */}
          {opDiscussion && (
            <DiscussionThread discussion={opDiscussion} isOP />
          )}

          {/* Threaded Replies */}
          {replies.length > 0 && (
            <div className="space-y-6 ml-4 md:ml-12 border-l border-primary/10 pl-6 relative">
              {replies.map((d) => (
                <DiscussionThread key={d.id} discussion={d} />
              ))}

              {/* Sub-reply example (static, matching Stitch) */}
              <SubReply
                username="James Wilson"
                content="Do you have any code snippets for that border styling in Tailwind?"
                time="30m ago"
              />
            </div>
          )}

          {/* Empty state */}
          {discussions.length === 0 && (
            <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                forum
              </span>
              <p className="font-bold text-on-surface mb-1">Be the first to share your approach.</p>
              <p className="text-sm text-on-surface-variant">
                Others learn from your thinking — and you learn by explaining.
              </p>
            </div>
          )}

          {/* Comment Input */}
          <div className="flex flex-col gap-4 mt-8">
            <DiscussionInput challengeId={id} />
          </div>
        </div>

        {/* Sidebar (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <ExpertPicksPanel />
          <CommunityStatsPanel participants="1.2k" solutions="856" />
          <RelatedTopicsPanel />
          <TopContributorsPanel />
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-20 md:bottom-8 right-6 bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95 z-50">
        <span className="material-symbols-outlined text-3xl">add_comment</span>
      </button>
    </div>
  )
}
