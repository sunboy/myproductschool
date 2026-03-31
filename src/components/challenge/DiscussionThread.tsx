'use client'

import { useState } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'
import { ChallengeDiscussion } from '@/lib/types'

export interface DiscussionReply {
  id: string
  username: string
  display_name?: string | null
  content: string
  created_at: string
}

interface Props {
  discussion: ChallengeDiscussion
  challengeId: string
  isOP?: boolean
  upvoted?: boolean
  onUpvote?: (id: string) => void
  replies?: DiscussionReply[]
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return username.slice(0, 2).toUpperCase()
}

export function DiscussionThread({
  discussion,
  challengeId,
  isOP = false,
  upvoted = false,
  onUpvote,
  replies = [],
}: Props) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const [replyPosted, setReplyPosted] = useState(false)

  const initials = getInitials(discussion.username ?? 'User')

  async function handlePostReply() {
    if (!replyContent.trim() || postingReply) return
    setPostingReply(true)
    try {
      await fetch(
        `/api/challenges/${challengeId}/discussions/${discussion.id}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyContent }),
        }
      )
      setReplyContent('')
      setReplyPosted(true)
      setShowReply(false)
      setTimeout(() => setReplyPosted(false), 3000)
    } catch {
      // silently fail
    } finally {
      setPostingReply(false)
    }
  }

  const actionRow = (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={() => onUpvote?.(discussion.id)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors border"
        style={
          upvoted
            ? { background: 'var(--color-primary-fixed)', borderColor: 'var(--color-primary)' }
            : { background: 'var(--color-surface-container-highest)', borderColor: 'transparent' }
        }
      >
        <span
          className={`material-symbols-outlined text-sm ${upvoted ? 'text-primary' : 'text-on-surface-variant'}`}
          style={{ fontVariationSettings: upvoted ? "'FILL' 1" : "'FILL' 0" }}
        >
          thumb_up
        </span>
        <span className={upvoted ? 'text-primary' : 'text-on-surface-variant'}>
          {discussion.upvote_count}
        </span>
      </button>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface-variant text-sm font-medium hover:bg-surface-dim transition-colors border border-transparent">
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>
          lightbulb
        </span>
        <span>{discussion.upvote_count}</span>
      </button>

      <button
        onClick={() => setShowReply(v => !v)}
        className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors px-2 py-1.5"
      >
        Reply
      </button>

      {replyPosted && (
        <span className="text-xs text-primary font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">check_circle</span>
          Reply posted
        </span>
      )}

      <button className="ml-auto material-symbols-outlined text-base text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-highest">
        more_horiz
      </button>
    </div>
  )

  const replyInput = showReply && (
    <div className="mt-3 ml-4 border-l-2 border-outline-variant/30 pl-4 space-y-2">
      <textarea
        className="w-full text-sm bg-surface-container-low rounded-lg border border-outline-variant/40 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/60"
        rows={3}
        placeholder="Write a reply..."
        value={replyContent}
        onChange={e => setReplyContent(e.target.value.slice(0, 500))}
        disabled={postingReply}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setShowReply(false); setReplyContent('') }}
          className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          onClick={handlePostReply}
          disabled={postingReply || !replyContent.trim()}
          className="bg-primary text-on-primary text-xs font-bold px-4 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {postingReply ? 'Posting...' : 'Post Reply'}
        </button>
      </div>
    </div>
  )

  const repliesList = replies.length > 0 && (
    <div className="mt-3 ml-4 border-l-2 border-outline-variant/20 pl-4 space-y-3">
      {replies.map(r => {
        const replyName = r.display_name || r.username || 'Anonymous'
        const isLumaReply = r.display_name?.startsWith('Luma')
        return (
          <div key={r.id} className="flex items-start gap-2">
            {isLumaReply ? (
              <LumaGlyph size={28} state="speaking" className="text-primary shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="text-on-surface-variant text-[10px] font-bold">
                  {getInitials(r.username ?? 'U')}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-on-surface">{replyName}</span>
                <span className="text-[10px] text-on-surface-variant">· {relativeTime(r.created_at)}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{r.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )

  // OP variant — green left border
  if (isOP) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/20 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="text-on-primary-container font-bold text-sm">{initials}</span>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-bold text-on-surface text-sm">{discussion.username ?? 'Anonymous'}</span>
              <span className="bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                OP
              </span>
              <span className="text-xs text-on-surface-variant">· {relativeTime(discussion.created_at)}</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed">{discussion.content}</p>
            {actionRow}
            {replyInput}
            {repliesList}
          </div>
        </div>
      </div>
    )
  }

  // Expert pick variant — amber/tertiary left border with Luma branding
  if (discussion.is_expert_pick) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/20 border-l-4 border-l-tertiary">
        <div className="flex items-start gap-3">
          <LumaGlyph size={36} state="speaking" className="text-primary shrink-0" />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-bold text-on-surface text-sm">Luma&apos;s Team</span>
              <span className="bg-tertiary-container text-tertiary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                Expert Pick
              </span>
              <span className="text-xs text-on-surface-variant">· {relativeTime(discussion.created_at)}</span>
            </div>
            <p className="text-on-surface text-sm leading-relaxed">{discussion.content}</p>
            {actionRow}
            {replyInput}
            {repliesList}
          </div>
        </div>
      </div>
    )
  }

  // Regular post variant
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
          <span className="text-on-primary-container font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-bold text-on-surface text-sm">{discussion.username ?? 'Anonymous'}</span>
            <span className="text-xs text-on-surface-variant">· {relativeTime(discussion.created_at)}</span>
          </div>
          <p className="text-on-surface text-sm leading-relaxed">{discussion.content}</p>
          {actionRow}
          {replyInput}
          {repliesList}
        </div>
      </div>
    </div>
  )
}
