'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import { CommunityStatsPanel } from '@/components/challenge/CommunityStatsPanel'
import { TopContributorsPanel } from '@/components/challenge/TopContributorsPanel'
import { RelatedChallengesPanel } from '@/components/challenge/RelatedChallengesPanel'
import type { ChallengeDiscussion } from '@/lib/types'

export default function ChallengeDiscussionPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''

  const [discussions, setDiscussions] = useState<ChallengeDiscussion[]>([])
  const [challengeTitle, setChallengeTitle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/discussions`)
      if (res.ok) {
        const data = await res.json()
        setDiscussions(Array.isArray(data) ? data : [])
      }
    } catch { /* silent */ } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDiscussions() }, [fetchDiscussions])

  useEffect(() => {
    fetch(`/api/challenges/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.challenge?.title) setChallengeTitle(data.challenge.title) })
      .catch(() => {})
  }, [id])

  async function handleUpvote(discussionId: string) {
    // Optimistic update
    setDiscussions(prev => prev.map(d =>
      d.id === discussionId
        ? { ...d, upvote_count: upvotedIds.has(discussionId) ? d.upvote_count - 1 : d.upvote_count + 1 }
        : d
    ))
    setUpvotedIds(prev => {
      const next = new Set(prev)
      if (next.has(discussionId)) next.delete(discussionId)
      else next.add(discussionId)
      return next
    })

    try {
      await fetch(`/api/challenges/${id}/discussions/${discussionId}/upvote`, { method: 'PATCH' })
    } catch { /* silent */ }
  }

  const expertPicks = discussions.filter(d => d.is_expert_pick)
  const regularPosts = discussions.filter(d => !d.is_expert_pick)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
        <Link href={`/workspace/challenges/${id}`} className="hover:text-primary transition-colors">
          {challengeTitle ?? 'Challenge'}
        </Link>
        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
        <span className="text-on-surface font-bold">Discussion</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-3">Challenge Discussion</h1>
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">forum</span>
            <span className="font-bold text-on-surface">{discussions.length}</span> responses
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">group</span>
            <span className="font-bold text-on-surface">{new Set(discussions.map(d => d.user_id)).size}</span> participants
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Expert Picks strip */}
          {expertPicks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
                Expert Picks
              </h2>
              {expertPicks.map(d => (
                <DiscussionThread
                  key={d.id}
                  discussion={d}
                  challengeId={id}
                  upvoted={upvotedIds.has(d.id)}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}

          {/* All posts */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-surface-container-highest rounded-xl h-32" />
              ))}
            </div>
          ) : regularPosts.length > 0 ? (
            <div className="space-y-4">
              {regularPosts.map((d, idx) => (
                <DiscussionThread
                  key={d.id}
                  discussion={d}
                  challengeId={id}
                  isOP={idx === 0 && expertPicks.length === 0}
                  upvoted={upvotedIds.has(d.id)}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/30">
              <HatchGlyph size={48} state="idle" className="text-primary mx-auto mb-4" />
              <p className="font-bold text-on-surface mb-1">Be the first to share your approach.</p>
              <p className="text-sm text-on-surface-variant">Others learn from your thinking — and you learn by explaining.</p>
            </div>
          )}

          {/* Input */}
          <div className="mt-6">
            <DiscussionInput challengeId={id} onSubmitted={fetchDiscussions} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <CommunityStatsPanel
            responseCount={discussions.length}
            participantCount={new Set(discussions.map(d => d.user_id)).size}
          />
          <TopContributorsPanel discussions={discussions} />
          <RelatedChallengesPanel currentChallengeId={id} />
        </div>
      </div>

    </div>
  )
}
