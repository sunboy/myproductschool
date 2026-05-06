'use client'

import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'
import { ChallengeDiscussion, DiscussionReply } from '@/lib/types'

interface Props {
  discussion: ChallengeDiscussion
  challengeId: string
  isOP?: boolean
  upvoted?: boolean
  currentUserId?: string | null
  onUpvote?: (id: string) => void
  onReplyPosted?: () => void | Promise<void>
  onDiscussionChanged?: () => void | Promise<void>
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
  currentUserId = null,
  onUpvote,
  onReplyPosted,
  onDiscussionChanged,
  replies = [],
}: Props) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [postingReply, setPostingReply] = useState(false)
  const [replyPosted, setReplyPosted] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(discussion.content)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState(false)

  const initials = getInitials(discussion.username ?? 'User')
  const isHidden = Boolean(discussion.hidden_at)
  const displayAsOP = isOP && !isHidden
  const displayAsExpertPick = discussion.is_expert_pick && !isHidden
  const canModify = Boolean(!isHidden && currentUserId && discussion.user_id === currentUserId)

  async function handleSaveEdit() {
    if (!editContent.trim() || savingEdit) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/discussions/${discussion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setEditError(data?.error ?? 'Could not update discussion. Try again.')
        return
      }
      await onDiscussionChanged?.()
      setEditing(false)
    } catch {
      setEditError('Could not update discussion. Try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    if (deleting || !window.confirm('Delete this discussion?')) return
    setDeleting(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/discussions/${discussion.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setEditError(data?.error ?? 'Could not delete discussion. Try again.')
        return
      }
      await onDiscussionChanged?.()
    } catch {
      setEditError('Could not delete discussion. Try again.')
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  async function handleReport() {
    if (reporting) return
    const reason = window.prompt('Why are you reporting this discussion?')
    if (!reason?.trim()) return
    setReporting(true)
    setReportError(null)
    setReportSuccess(false)
    try {
      const res = await fetch(`/api/discussions/${discussion.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setReportError(data?.error ?? 'Could not report discussion. Try again.')
        return
      }
      setReportSuccess(true)
      setMenuOpen(false)
      setTimeout(() => setReportSuccess(false), 3000)
    } catch {
      setReportError('Could not report discussion. Try again.')
    } finally {
      setReporting(false)
    }
  }

  async function handlePostReply() {
    if (!replyContent.trim() || postingReply) return
    setPostingReply(true)
    setReplyError(null)
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/discussions/${discussion.id}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyContent }),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setReplyError(data?.error ?? 'Could not post reply. Try again.')
        return
      }
      setReplyContent('')
      await onReplyPosted?.()
      setReplyPosted(true)
      setShowReply(false)
      setTimeout(() => setReplyPosted(false), 3000)
    } catch {
      setReplyError('Could not post reply. Try again.')
    } finally {
      setPostingReply(false)
    }
  }

  const actionRow = !isHidden && (
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

      {reportSuccess && (
        <span className="text-xs text-primary font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">check_circle</span>
          Report sent
        </span>
      )}

      {reportError && (
        <span className="text-xs text-error font-semibold">{reportError}</span>
      )}

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Discussion actions"
          aria-expanded={menuOpen}
          className="material-symbols-outlined text-base text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-highest"
        >
          more_horiz
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-10 min-w-28 rounded-lg border border-outline-variant/30 bg-white py-1 shadow-lg">
            {canModify && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true)
                    setEditContent(discussion.content)
                    setEditError(null)
                    setMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-highest"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-error hover:bg-surface-container-highest disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleReport}
              disabled={reporting}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
            >
              {reporting ? 'Reporting...' : 'Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const contentBlock = editing ? (
    <div className="space-y-2">
      <textarea
        className="w-full text-sm bg-surface-container-low rounded-lg border border-outline-variant/40 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface"
        rows={4}
        value={editContent}
        onChange={e => {
          setEditContent(e.target.value.slice(0, 10000))
          if (editError) setEditError(null)
        }}
        disabled={savingEdit}
      />
      {editError && (
        <p className="text-xs font-medium text-error">{editError}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setEditContent(discussion.content)
            setEditError(null)
          }}
          className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveEdit}
          disabled={savingEdit || !editContent.trim() || editContent.trim() === discussion.content.trim()}
          className="bg-primary text-on-primary text-xs font-bold px-4 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {savingEdit ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  ) : (
    <>
      <p className="text-on-surface text-sm leading-relaxed">{discussion.content}</p>
      {editError && (
        <p className="mt-2 text-xs font-medium text-error">{editError}</p>
      )}
    </>
  )

  const replyInput = !isHidden && showReply && (
    <div className="mt-3 ml-4 border-l-2 border-outline-variant/30 pl-4 space-y-2">
      <textarea
        className="w-full text-sm bg-surface-container-low rounded-lg border border-outline-variant/40 p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/60"
        rows={3}
        placeholder="Write a reply..."
        value={replyContent}
        onChange={e => {
          setReplyContent(e.target.value.slice(0, 500))
          if (replyError) setReplyError(null)
        }}
        disabled={postingReply}
      />
      {replyError && (
        <p className="text-xs font-medium text-error">{replyError}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setShowReply(false)
            setReplyContent('')
            setReplyError(null)
          }}
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

  const repliesList = !isHidden && replies.length > 0 && (
    <div className="mt-3 ml-4 border-l-2 border-outline-variant/20 pl-4 space-y-3">
      {replies.map(r => {
        const replyName = r.display_name || r.username || 'Anonymous'
        const isHatchReply = r.display_name?.startsWith('Hatch')
        return (
          <div key={r.id} className="flex items-start gap-2">
            {isHatchReply ? (
              <HatchGlyph size={28} state="speaking" className="text-primary shrink-0" />
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

  // OP variant with green left border
  if (displayAsOP) {
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
            {contentBlock}
            {actionRow}
            {replyInput}
            {repliesList}
          </div>
        </div>
      </div>
    )
  }

  // Expert pick variant with amber/tertiary left border and Hatch branding
  if (displayAsExpertPick) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-outline-variant/20 border-l-4 border-l-tertiary">
        <div className="flex items-start gap-3">
          <HatchGlyph size={36} state="speaking" className="text-primary shrink-0" />
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-bold text-on-surface text-sm">Hatch&apos;s Team</span>
              <span className="bg-tertiary-container text-tertiary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                Expert Pick
              </span>
              <span className="text-xs text-on-surface-variant">· {relativeTime(discussion.created_at)}</span>
            </div>
            {contentBlock}
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
          {contentBlock}
          {actionRow}
          {replyInput}
          {repliesList}
        </div>
      </div>
    </div>
  )
}
