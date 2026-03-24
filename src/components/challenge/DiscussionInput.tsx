'use client'

import { useState } from 'react'

interface Props {
  challengeId: string
  onSubmitted?: () => void
}

export function DiscussionInput({ challengeId, onSubmitted }: Props) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      await fetch(`/api/challenges/${challengeId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: 'mock-user' }),
      })
      setSubmitted(true)
      setContent('')
      onSubmitted?.()
      setTimeout(() => setSubmitted(false), 2500)
    } catch {
      // silently fail for now
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant flex items-center gap-4">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-lg">person</span>
      </div>
      <input
        className="flex-grow border-none bg-transparent focus:ring-0 text-sm py-2 placeholder:text-on-surface-variant/60 text-on-surface focus:outline-none"
        placeholder="Add to the discussion..."
        type="text"
        value={content}
        onChange={e => setContent(e.target.value.slice(0, 500))}
        disabled={submitting}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />
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
