'use client'

import { type RefObject, useRef, useState } from 'react'
import { validateDiscussionContent } from '@/lib/content/discussion-validator'
import type { ChallengeDiscussion } from '@/lib/types'

interface Props {
  challengeId: string
  // Receives the just-created discussion row so the parent can append it
  // optimistically (zero perceived lag), then reconcile in the background.
  onSubmitted?: (created?: ChallengeDiscussion) => void
  inputRef?: RefObject<HTMLTextAreaElement | null>
}

type WrapKind = 'bold' | 'italic' | 'code' | 'list'

const TOOLBAR_BUTTONS: { kind: WrapKind; icon: string; label: string }[] = [
  { kind: 'bold', icon: 'format_bold', label: 'Bold' },
  { kind: 'italic', icon: 'format_italic', label: 'Italic' },
  { kind: 'code', icon: 'code', label: 'Code' },
  { kind: 'list', icon: 'format_list_bulleted', label: 'List' },
]

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

  // Composed ref: callers may pass inputRef; otherwise fall back to a local ref
  // so the toolbar can still read/restore the textarea selection.
  const localRef = useRef<HTMLTextAreaElement | null>(null)
  const textarea = inputRef ?? localRef

  function applyFormat(kind: WrapKind) {
    const el = textarea.current
    if (!el) return
    let start = el.selectionStart
    const end = el.selectionEnd

    let nextSelected: string
    let caretStart: number
    let caretEnd: number

    if (kind === 'list') {
      // List prefixes whole lines. Always expand `start` back to the beginning of
      // its line so "- " lands at line start — whether nothing is selected
      // (caret mid-line) or only part of the first line is selected.
      start = content.lastIndexOf('\n', start - 1) + 1
      const block = content.slice(start, end)
      nextSelected = block
        .split('\n')
        .map(line => (line.startsWith('- ') ? line : `- ${line}`))
        .join('\n')
      const before = content.slice(0, start)
      const after = content.slice(end)
      const next = before + nextSelected + after
      if (next.length > MAX_LENGTH) return
      setContent(next)
      if (error) setError(null)
      caretStart = start
      caretEnd = start + nextSelected.length
      requestAnimationFrame(() => {
        const node = textarea.current
        if (!node) return
        node.focus()
        node.setSelectionRange(caretStart, caretEnd)
      })
      return
    }

    const before = content.slice(0, start)
    const selected = content.slice(start, end)
    const after = content.slice(end)
    const delim = kind === 'bold' ? '**' : kind === 'italic' ? '_' : '`'
    nextSelected = `${delim}${selected}${delim}`
    // Place caret between the delimiters when nothing was selected.
    caretStart = selected ? start : start + delim.length
    caretEnd = selected ? start + nextSelected.length : start + delim.length

    const next = before + nextSelected + after
    // Skip the wrap rather than truncate it — slicing here could cut a closing
    // delimiter and produce invalid markdown.
    if (next.length > MAX_LENGTH) return

    setContent(next)
    if (error) setError(null)
    // Restore focus + selection after the controlled value updates.
    requestAnimationFrame(() => {
      const node = textarea.current
      if (!node) return
      node.focus()
      node.setSelectionRange(caretStart, caretEnd)
    })
  }

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
      // The POST returns the created discussion row (201). Hand it to the parent
      // so it can render immediately rather than waiting on a second GET.
      const created = (await res.json().catch(() => null)) as ChallengeDiscussion | null
      setSubmitted(true)
      setContent('')
      onSubmitted?.(created ?? undefined)
      setTimeout(() => setSubmitted(false), 2500)
    } catch {
      setError('Could not post discussion. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface px-3 py-2.5 shadow-[0_12px_26px_-24px_rgba(30,27,20,0.45)] transition-colors focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
      <textarea
        aria-label="Add to the discussion"
        className="min-h-[82px] w-full resize-y border-0 bg-transparent px-0.5 py-1 text-sm leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/55 disabled:opacity-60"
        placeholder="Add to the discussion..."
        rows={3}
        ref={textarea}
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

      {(validationMessage || error) && (
        <p className={`mt-1 text-xs font-medium ${error ? 'text-error' : 'text-tertiary'}`}>
          {error ?? validationMessage}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-2">
        <div className="flex items-center gap-0.5">
          {TOOLBAR_BUTTONS.map(({ kind, icon, label }) => (
            <button
              key={kind}
              type="button"
              aria-label={label}
              title={label}
              onMouseDown={e => e.preventDefault()}
              onClick={() => applyFormat(kind)}
              disabled={submitting}
              className="flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden whitespace-nowrap text-[11px] font-medium tabular-nums text-on-surface-variant/55 sm:inline">
            {content.length}/{MAX_LENGTH}
          </span>
          {submitted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1.5 text-xs font-bold text-primary">
              Posted
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !content.trim() || !validation.valid}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-45"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          )}
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {submitted && 'Posted'}
        {validationMessage && !error ? validationMessage : ''}
        {error ?? ''}
      </div>
    </div>
  )
}
