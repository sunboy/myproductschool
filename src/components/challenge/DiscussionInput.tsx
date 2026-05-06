'use client'

import { type RefObject, useState } from 'react'

interface Props {
  challengeId: string
  onSubmitted?: () => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export function DiscussionInput({ challengeId, onSubmitted, inputRef }: Props) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!content.trim() || submitting) return
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
        setError(data?.error ?? 'Could not post discussion. Try again.')
        return
      }
      setSubmitted(true)
      setContent('')
      onSubmitted?.()
      setTimeout(() => setSubmitted(false), 2500)
    } catch {
      setError('Could not post discussion. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant flex items-center gap-4">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-lg">person</span>
      </div>
      <div className="min-w-0 flex-grow">
        <input
          className="w-full border-none bg-transparent focus:ring-0 text-sm py-2 placeholder:text-on-surface-variant/60 text-on-surface focus:outline-none"
          placeholder="Add to the discussion..."
          type="text"
          ref={inputRef}
          value={content}
          onChange={e => {
            setContent(e.target.value.slice(0, 500))
            if (error) setError(null)
          }}
          disabled={submitting}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        {error && (
          <p className="text-xs font-medium text-error">{error}</p>
        )}
      </div>
      {submitted ? (
        <div className="flex items-center gap-1 text-primary font-bold text-sm whitespace-nowrap">
          Posted!
          <span className="material-symbols-outlined text-sm">check_circle</span>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      )}
    </div>
  )
}
