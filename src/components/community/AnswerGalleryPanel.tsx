'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  CommunityDisplayMode,
  CommunityGalleryResponse,
  CommunityReactionType,
  CommunitySubmission,
} from '@/lib/types'
import { COMMUNITY_LENS_LABELS, formatCommunityDisplayName } from '@/lib/community-shared'

interface AnswerGalleryPanelProps {
  challengeId?: string
  attemptId?: string
}

const EMPTY_GALLERY: CommunityGalleryResponse = {
  own_submission: null,
  peer_submissions: [],
  has_feedback_trade: false,
  locked_count: 0,
}

const REACTION_BUTTONS: Array<{ type: CommunityReactionType; label: string; icon: string }> = [
  { type: 'metric_hawk', label: 'Metric', icon: 'monitoring' },
  { type: 'tradeoff_catcher', label: 'Tradeoff', icon: 'balance' },
  { type: 'clarity_builder', label: 'Clear', icon: 'lightbulb' },
]

export function AnswerGalleryPanel({ challengeId, attemptId }: AnswerGalleryPanelProps) {
  const [gallery, setGallery] = useState<CommunityGalleryResponse>(EMPTY_GALLERY)
  const [loading, setLoading] = useState(false)
  const [displayMode, setDisplayMode] = useState<CommunityDisplayMode>('anonymous')
  const [publishing, setPublishing] = useState(false)
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null)
  const [oneSharpThing, setOneSharpThing] = useState('')
  const [oneQuestion, setOneQuestion] = useState('')
  const [suggestedRewrite, setSuggestedRewrite] = useState('')
  const [statusText, setStatusText] = useState<string | null>(null)

  const canLoad = Boolean(challengeId && attemptId)
  const publishedOwn = gallery.own_submission?.status === 'published' || gallery.own_submission?.status === 'featured'
  const targetSubmission = useMemo(
    () => gallery.peer_submissions.find(s => s.id === feedbackTarget) ?? gallery.peer_submissions[0],
    [feedbackTarget, gallery.peer_submissions],
  )

  async function loadGallery() {
    if (!challengeId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ challenge_id: challengeId })
      if (attemptId) params.set('attempt_id', attemptId)
      const res = await fetch(`/api/community/gallery?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load gallery')
      setGallery(await res.json() as CommunityGalleryResponse)
    } catch {
      setStatusText('Peer examples are warming up for this challenge.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canLoad) void loadGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, attemptId, canLoad])

  async function publishSubmission() {
    if (!attemptId) return
    setPublishing(true)
    setStatusText(null)
    try {
      const res = await fetch('/api/community/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, display_mode: displayMode }),
      })
      if (!res.ok) throw new Error('Failed to publish')
      await loadGallery()
      setStatusText('Added to the gallery.')
    } catch {
      setStatusText('Could not add your answer yet.')
    } finally {
      setPublishing(false)
    }
  }

  async function submitFeedback(submission: CommunitySubmission) {
    if (!oneSharpThing.trim() || !oneQuestion.trim()) return
    setStatusText(null)
    const res = await fetch('/api/community/feedback-trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: submission.id,
        one_sharp_thing: oneSharpThing,
        one_question: oneQuestion,
        suggested_rewrite: suggestedRewrite,
      }),
    })

    if (res.ok) {
      setOneSharpThing('')
      setOneQuestion('')
      setSuggestedRewrite('')
      setFeedbackTarget(null)
      setStatusText('Feedback traded. More examples unlocked.')
      await loadGallery()
    } else {
      setStatusText('That feedback did not save yet.')
    }
  }

  async function react(submission: CommunitySubmission, reactionType: CommunityReactionType) {
    const res = await fetch('/api/community/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_type: 'community_submission',
        target_id: submission.id,
        reaction_type: reactionType,
      }),
    })
    if (!res.ok) return
    const result = await res.json() as { count: number }
    setGallery(current => ({
      ...current,
      peer_submissions: current.peer_submissions.map(peer => {
        if (peer.id !== submission.id) return peer
        return {
          ...peer,
          reaction_counts: {
            ...peer.reaction_counts,
            [reactionType]: result.count,
          },
        }
      }),
    }))
  }

  if (!canLoad) return null

  return (
    <div className="rounded-[14px] border border-outline-variant bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
            <span className="material-symbols-outlined text-[16px]">groups</span>
            Study peer approaches
          </div>
          <p className="mt-1 max-w-xl text-sm leading-5 text-on-surface-variant">
            Compare your answer against anonymized approaches from the same challenge.
          </p>
        </div>

        {gallery.own_submission && !publishedOwn && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-outline-variant bg-background p-0.5">
              {(['anonymous', 'named'] as CommunityDisplayMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDisplayMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors ${displayMode === mode ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={publishing}
              onClick={publishSubmission}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-on-primary disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              Add to gallery
            </button>
          </div>
        )}
      </div>

      {statusText && (
        <div className="mt-3 rounded-lg bg-primary-fixed px-3 py-2 text-xs font-semibold text-on-surface-variant">
          {statusText}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && (
          <div className="rounded-xl border border-outline-variant bg-background p-4 text-sm text-on-surface-variant">
            Loading peer approaches...
          </div>
        )}

        {!loading && gallery.peer_submissions.length === 0 && (
          <div className="rounded-xl border border-outline-variant bg-background p-4 text-sm text-on-surface-variant md:col-span-2">
            You may be one of the first here. Add yours and future peers will have something sharp to study.
          </div>
        )}

        {!loading && gallery.peer_submissions.map(submission => (
          <div key={submission.id} className="rounded-xl border border-outline-variant bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-on-surface">
                  {formatCommunityDisplayName(submission.display_mode, submission.display_name)}
                </div>
                <div className="mt-1 inline-flex rounded-full bg-tertiary-container/40 px-2.5 py-1 text-[11px] font-bold text-tertiary">
                  {COMMUNITY_LENS_LABELS[submission.lens_tag]}
                </div>
              </div>
              {typeof submission.score === 'number' && (
                <div className="font-headline text-lg font-bold text-primary">
                  {Math.round(submission.score * 100)}
                </div>
              )}
            </div>
            <p className="mt-3 text-sm leading-5 text-on-surface">{submission.excerpt}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-on-surface-variant">
              {(submission.reaction_counts?.upvote ?? 0) > 0 && <span>{submission.reaction_counts?.upvote} saves</span>}
              {(submission.feedback_count ?? 0) > 0 && <span>{submission.feedback_count} reviews</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {REACTION_BUTTONS.map(reaction => (
                <button
                  key={reaction.type}
                  type="button"
                  onClick={() => react(submission, reaction.type)}
                  className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-2.5 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[13px]">{reaction.icon}</span>
                  {reaction.label}
                  {(submission.reaction_counts?.[reaction.type] ?? 0) > 0 && (
                    <span className="text-primary">{submission.reaction_counts?.[reaction.type]}</span>
                  )}
                </button>
              ))}
            </div>
            {!gallery.has_feedback_trade && (
              <button
                type="button"
                onClick={() => setFeedbackTarget(submission.id)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-fixed"
              >
                <span className="material-symbols-outlined text-[14px]">rate_review</span>
                Trade feedback
              </button>
            )}
          </div>
        ))}
      </div>

      {!gallery.has_feedback_trade && gallery.locked_count > 0 && targetSubmission && (
        <div className="mt-4 rounded-xl border border-dashed border-primary/45 bg-primary-fixed/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-on-surface">Unlock {gallery.locked_count} more peer examples</div>
              <div className="mt-1 text-xs text-on-surface-variant">Leave one structured review on an answer in this gallery.</div>
            </div>
            <div className="text-xs font-bold text-primary">
              Reviewing {formatCommunityDisplayName(targetSubmission.display_mode, targetSubmission.display_name)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            <textarea
              value={oneSharpThing}
              onChange={event => setOneSharpThing(event.target.value)}
              placeholder="One sharp thing"
              className="min-h-20 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={oneQuestion}
              onChange={event => setOneQuestion(event.target.value)}
              placeholder="One question"
              className="min-h-20 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={suggestedRewrite}
              onChange={event => setSuggestedRewrite(event.target.value)}
              placeholder="Suggested rewrite"
              className="min-h-20 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={!oneSharpThing.trim() || !oneQuestion.trim()}
              onClick={() => submitFeedback(targetSubmission)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-50"
            >
              Submit review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
