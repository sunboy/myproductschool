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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant flex items-start gap-4">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 flex items-center justify-center mt-0.5">
        <span className="material-symbols-outlined text-outline text-lg">person</span>
      </div>
      <div className="min-w-0 flex-grow">
        <div className="flex items-center gap-0.5 mb-1">
          {TOOLBAR_BUTTONS.map(({ kind, icon, label }) => (
            <button
              key={kind}
              type="button"
              aria-label={label}
              title={label}
              onMouseDown={e => e.preventDefault()}
              onClick={() => applyFormat(kind)}
              disabled={submitting}
              className="w-7 h-7 flex items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </button>
          ))}
        </div>
        <textarea
          className="w-full border border-outline-variant rounded-xl bg-surface-container-low focus:bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm leading-relaxed px-3 py-2.5 placeholder:text-on-surface-variant/60 text-on-surface focus:outline-none resize-y min-h-[120px] transition-colors"
          placeholder="Add to the discussion… markdown supported (**bold**, `code`, lists)"
          rows={5}
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
        <div className="flex items-center justify-between gap-3 mt-1.5">
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
