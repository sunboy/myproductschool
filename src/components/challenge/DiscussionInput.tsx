'use client'

import { type RefObject, useState } from 'react'
import { validateDiscussionContent } from '@/lib/content/discussion-validator'

interface Props {
  challengeId: string
  onSubmitted?: () => void
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

// Generous client cap — well under the API's 10,000 char limit, but enough for
// a multi-paragraph post with a code block. The old 500-char single-line input
// truncated mid-thought and gave no room to format.
const MAX_LENGTH = 4000

function messageForStatus(status: number, serverError?: string): string {
  if (status === 401) return 'Your session timed out. Sign back in to post.'
  if (status === 422 || status === 400) return serverError ?? 'Tighten the post before submitting.'
  if (status === 429) return 'Slow down a moment, then try again.'
  return serverError ?? 'Could not post discussion. Try again.'
}

export function DiscussionInput({ challengeId, onSubmitted, inputRef }: Props) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const validation = validateDiscussionContent(content)
  const validationMessage = content.trim()
    ? validation.errors[0] ?? validation.warnings[0] ?? null
    : null

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    if (!validation.valid) {
      setError(validation.errors[0] ?? validation.warnings[0] ?? 'Tighten the post before submitting.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(messageForStatus(res.status, data?.error))
        return
      }
      setSubmitted(true)
      setContent('')
      onSubmitted?.()
      setTimeout(() => setSubmitted(false), 2500)
    } catch {
      setError('Could not post discussion. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant flex items-start gap-4">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 flex items-center justify-center mt-0.5">
        <span className="material-symbols-outlined text-outline text-lg">person</span>
      </div>
      <div className="min-w-0 flex-grow">
        <textarea
          className="w-full border-none bg-transparent focus:ring-0 text-sm py-2 placeholder:text-on-surface-variant/60 text-on-surface focus:outline-none resize-y min-h-[44px]"
          placeholder="Add to the discussion… markdown supported (**bold**, `code`, lists)"
          rows={2}
          ref={inputRef}
          value={content}
          onChange={e => {
            setContent(e.target.value.slice(0, MAX_LENGTH))
            if (error) setError(null)
          }}
          disabled={submitting}
          onKeyDown={e => {
            // Enter inserts a newline (multi-line composing). Cmd/Ctrl+Enter posts.
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-on-surface-variant/80">
            Direct, specific, no slop. Markdown supported. <span className="opacity-70">⌘/Ctrl+Enter to post</span>
          </p>
          <span className="text-[11px] font-medium text-on-surface-variant/60 whitespace-nowrap">{content.length}/{MAX_LENGTH}</span>
        </div>
        {validationMessage && (
          <p className="text-xs font-medium text-tertiary">{validationMessage}</p>
        )}
        {error && (
          <p className="text-xs font-medium text-error">{error}</p>
        )}
      </div>
      {submitted ? (
        <div className="flex items-center gap-1 text-primary font-bold text-sm whitespace-nowrap mt-1.5">
          Posted!
          <span className="material-symbols-outlined text-sm">check_circle</span>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim() || !validation.valid}
          className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap mt-1"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      )}
    </div>
  )
}
