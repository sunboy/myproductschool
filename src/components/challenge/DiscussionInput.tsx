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
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/50">
      <p className="text-sm font-bold text-on-surface mb-3">Share your approach</p>
      <textarea
        className="w-full bg-background rounded-xl border border-outline-variant p-3 text-sm text-on-surface resize-none focus:outline-none focus:border-primary transition-colors"
        rows={4}
        placeholder="How did you approach this challenge? What did you discover?"
        value={content}
        onChange={e => setContent(e.target.value.slice(0, 500))}
        disabled={submitting}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">{content.length}/500</span>
        {submitted ? (
          <div className="flex items-center gap-1 text-primary font-bold text-sm">
            Posted!
            <span className="material-symbols-outlined text-sm">check_circle</span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="bg-primary text-on-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        )}
      </div>
    </div>
  )
}
