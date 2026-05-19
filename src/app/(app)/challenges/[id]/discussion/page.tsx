'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import { CommunityStatsPanel } from '@/components/challenge/CommunityStatsPanel'
import { TopContributorsPanel } from '@/components/challenge/TopContributorsPanel'
import { RelatedChallengesPanel } from '@/components/challenge/RelatedChallengesPanel'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { appendReturnTo, sanitizeReturnTo } from '@/lib/navigation/return-to'
import type { ChallengeDiscussion } from '@/lib/types'

function deriveUpvotedIds(discussions: ChallengeDiscussion[], userId: string | null) {
  if (!userId) return new Set<string>()
  return new Set(
    discussions
      .filter(d => d.viewer_has_upvoted || (Array.isArray(d.upvoted_by) && d.upvoted_by.includes(userId)))
      .map(d => d.id)
  )
}

function applyUpvoteState(
  discussion: ChallengeDiscussion,
  userId: string | null,
  upvoted: boolean
): ChallengeDiscussion {
  if (!userId) return discussion
  const previous = Array.isArray(discussion.upvoted_by) ? discussion.upvoted_by : []
  const next = upvoted
    ? Array.from(new Set([...previous, userId]))
    : previous.filter(id => id !== userId)

  return { ...discussion, upvoted_by: next, viewer_has_upvoted: upvoted }
}

export default function ChallengeDiscussionPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-6 pb-24" />}>
      <ChallengeDiscussionContent />
    </Suspense>
  )
}

function ChallengeDiscussionContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'))
  const challengeHref = appendReturnTo(`/workspace/challenges/${id}`, returnTo)

  const [discussions, setDiscussions] = useState<ChallengeDiscussion[]>([])
  const [challengeTitle, setChallengeTitle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${id}/discussions`)
      if (res.ok) {
        const data = await res.json()
        const nextDiscussions = Array.isArray(data) ? data : []
        setDiscussions(nextDiscussions)
        setUpvotedIds(deriveUpvotedIds(nextDiscussions, currentUserId))
      }
    } catch { /* silent */ } finally {
      setIsLoading(false)
    }
  }, [id, currentUserId])

  useEffect(() => { fetchDiscussions() }, [fetchDiscussions])

  useEffect(() => {
    setUpvotedIds(deriveUpvotedIds(discussions, currentUserId))
  }, [currentUserId, discussions])

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled) setCurrentUserId(data?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    fetch(`/api/challenges/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.challenge?.title) setChallengeTitle(data.challenge.title) })
      .catch(() => {})
  }, [id])

  async function handleUpvote(discussionId: string) {
    const wasUpvoted = upvotedIds.has(discussionId)

    // Optimistic update
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      return applyUpvoteState(
        { ...d, upvote_count: wasUpvoted ? d.upvote_count - 1 : d.upvote_count + 1 },
        currentUserId,
        !wasUpvoted
      )
    }))
    setUpvotedIds(prev => {
      const next = new Set(prev)
      if (next.has(discussionId)) next.delete(discussionId)
      else next.add(discussionId)
      return next
    })

    try {
      const res = await fetch(`/api/challenges/${id}/discussions/${discussionId}/upvote`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Upvote failed')
      const data = await res.json().catch(() => null)
      if (typeof data?.upvote_count === 'number') {
        setDiscussions(prev => prev.map(d =>
          d.id === discussionId
            ? applyUpvoteState({ ...d, upvote_count: data.upvote_count }, currentUserId, Boolean(data.upvoted))
            : d
        ))
      }
      if (typeof data?.upvoted === 'boolean') {
        setUpvotedIds(prev => {
          const next = new Set(prev)
          if (data.upvoted) next.add(discussionId)
          else next.delete(discussionId)
          return next
        })
      }
    } catch {
      setDiscussions(prev => prev.map(d =>
        d.id === discussionId
          ? applyUpvoteState(
            { ...d, upvote_count: Math.max(0, d.upvote_count + (wasUpvoted ? 1 : -1)) },
            currentUserId,
            wasUpvoted
          )
          : d
      ))
      setUpvotedIds(prev => {
        const next = new Set(prev)
        if (wasUpvoted) next.add(discussionId)
        else next.delete(discussionId)
        return next
      })
    }
  }

  const expertPicks = discussions.filter(d => d.is_expert_pick)
  const regularPosts = discussions.filter(d => !d.is_expert_pick)

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 pb-24">
      <AppBreadcrumbs
        className="mb-6"
        items={[
          { label: 'Practice', href: returnTo ?? '/challenges' },
          { label: challengeTitle ?? 'Challenge', href: challengeHref },
          { label: 'Discussion' },
        ]}
      />

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
                  currentUserId={currentUserId}
                  onUpvote={handleUpvote}
                  onReplyPosted={fetchDiscussions}
                  onDiscussionChanged={fetchDiscussions}
                  replies={d.replies ?? []}
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
                  currentUserId={currentUserId}
                  onUpvote={handleUpvote}
                  onReplyPosted={fetchDiscussions}
                  onDiscussionChanged={fetchDiscussions}
                  replies={d.replies ?? []}
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
          <Link
            href={challengeHref}
            className="block rounded-xl border border-outline-variant/50 bg-surface-container-low p-4 no-underline transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-primary">
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Answer gallery
            </div>
            <p className="mt-2 text-sm leading-5 text-on-surface-variant">
              Complete the challenge to compare with peer approaches and trade feedback.
            </p>
          </Link>
          <TopContributorsPanel discussions={discussions} />
          <RelatedChallengesPanel currentChallengeId={id} />
        </div>
      </div>

    </div>
  )
}
