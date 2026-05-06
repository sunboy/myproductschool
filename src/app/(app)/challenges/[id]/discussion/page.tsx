'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { DiscussionThread } from '@/components/challenge/DiscussionThread'
import { DiscussionInput } from '@/components/challenge/DiscussionInput'
import { CommunityStatsPanel } from '@/components/challenge/CommunityStatsPanel'
import { TopContributorsPanel } from '@/components/challenge/TopContributorsPanel'
import { RelatedChallengesPanel } from '@/components/challenge/RelatedChallengesPanel'
import { AppBreadcrumbs } from '@/components/navigation/AppBreadcrumbs'
import { appendReturnTo, sanitizeReturnTo } from '@/lib/navigation/return-to'
import type { ChallengeDiscussion } from '@/lib/types'

type DiscussionSort = 'top' | 'new' | 'mine'
const PAGE_SIZE = 20

function deriveUpvotedIds(discussions: ChallengeDiscussion[], userId: string | null) {
  if (!userId) return new Set<string>()
  return new Set(
    discussions
      .filter(d => Array.isArray(d.upvoted_by) && d.upvoted_by.includes(userId))
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

  return { ...discussion, upvoted_by: next }
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
  const [sort, setSort] = useState<DiscussionSort>('top')
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setPage(1)
  }, [sort, discussions.length])

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
  const visibleExpertPicks = sort === 'mine' ? [] : expertPicks
  const sortedPosts = [...regularPosts]
    .filter(d => sort !== 'mine' || d.user_id === currentUserId)
    .sort((a, b) => {
      if (sort === 'top') return b.upvote_count - a.upvote_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedPosts = sortedPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function focusComposer() {
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-3">
            {challengeTitle ?? 'Challenge'} Discussion
          </h1>
          <Link
            href={challengeHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to challenge
          </Link>
        </div>
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
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-low p-1">
              {([
                ['top', 'Top'],
                ['new', 'New'],
                ['mine', 'Mine'],
              ] as const).map(([value, label]) => {
                const active = sort === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <span className="text-xs font-medium text-on-surface-variant">
              {sortedPosts.length} post{sortedPosts.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Expert Picks strip */}
          {visibleExpertPicks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
                Expert Picks
              </h2>
              {visibleExpertPicks.map(d => (
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
          ) : sortedPosts.length > 0 ? (
            <div className="space-y-4">
              {pagedPosts.map((d, idx) => (
                <DiscussionThread
                  key={d.id}
                  discussion={d}
                  challengeId={id}
                  isOP={idx === 0 && visibleExpertPicks.length === 0 && sort !== 'mine'}
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
              <p className="font-bold text-on-surface mb-1">No discussion yet. Start one.</p>
              <p className="text-sm text-on-surface-variant mb-4">Others learn from your thinking, and you learn by explaining.</p>
              <button
                type="button"
                onClick={focusComposer}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90"
              >
                Start a discussion
              </button>
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-outline-variant/40 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-on-surface-variant">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-outline-variant/40 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* Input */}
          <div className="mt-6">
            <DiscussionInput challengeId={id} inputRef={inputRef} onSubmitted={fetchDiscussions} />
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
