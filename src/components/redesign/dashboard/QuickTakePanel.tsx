'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CircleCheck, Zap } from 'lucide-react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { FeedbackText } from '@/components/ui/FeedbackText'

export const QUICK_TAKE_ANCHOR = 'quick-take'

interface QuickTakePanelProps {
  prompt: string
  challengeId: string
  move?: string | null
}

interface StructuredFeedback {
  what_worked: string | null
  what_to_improve: string | null
  example_move: string | null
}

/** Exactly the shape POST /api/challenges/quick-take/submit returns on 200. */
interface QuickTakeResult {
  score: number
  xp_earned: number
  feedback_summary: string
  structured?: StructuredFeedback | null
  alreadyCompleted?: boolean
}

interface NextQuickTake {
  id: string
  prompt_text: string | null
  move_tags: string[] | null
}

/** Same bands the grader writes to grade_label (submit route). */
function gradeBand(score: number): { label: string; fg: string; bg: string } {
  if (score >= 0.8) return { label: 'Sharp', fg: '#266235', bg: '#e8f4de' }
  if (score >= 0.5) return { label: 'Solid', fg: '#8a6116', bg: '#fef3e2' }
  if (score >= 0.2) return { label: 'Surface', fg: '#5b685e', bg: '#eef0ea' }
  return { label: 'Weak', fg: '#b83230', bg: '#fbe9e7' }
}

/**
 * Dashboard Quick Take: the 90-second warm-up rep, inline. Amber sticky-note
 * surface per spec §7 (a prompt is tip-class content), rounded-rectangle
 * buttons per spec (no pills), Lucide inline icons only. The Today's path
 * "Quick Take" row links to #quick-take; on that hash change this panel
 * focuses the textarea.
 */
export function QuickTakePanel({ prompt: initialPrompt, challengeId: initialChallengeId, move }: QuickTakePanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [challengeId, setChallengeId] = useState(initialChallengeId)
  const [currentMove, setCurrentMove] = useState<string | null>(move ?? null)
  const [take, setTake] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [result, setResult] = useState<QuickTakeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === `#${QUICK_TAKE_ANCHOR}`) focusTextarea()
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [focusTextarea])

  async function handleSubmit() {
    if (!take.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/challenges/quick-take/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, response_text: take }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.status === 'not_ready') {
          const nextAction = Array.isArray(data.next_actions) ? data.next_actions[0] : undefined
          throw new Error([data.summary, nextAction].filter(Boolean).join(' ') || 'Add more reasoning before submitting.')
        }
        if (data.code === 'limit_reached') {
          throw new Error(
            typeof data.used === 'number' && typeof data.limit === 'number'
              ? `You have used ${data.used} of ${data.limit} gradings this month. Pro removes the cap.`
              : 'You have hit this month’s grading cap. Pro removes it.'
          )
        }
        if (data.code === 'rate_limited') {
          throw new Error('Too many submissions at once. Give it a minute, then try again.')
        }
        throw new Error(typeof data.error === 'string' ? data.error : 'Submission failed. Try again.')
      }
      setResult(data as QuickTakeResult)
      window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'quick-take' } }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTryAnother() {
    setLoadingNext(true)
    setError(null)
    try {
      const params = new URLSearchParams({ exclude: challengeId })
      if (currentMove) params.set('move', currentMove)
      const res = await fetch(`/api/challenges/quick-take/next?${params}`)
      if (!res.ok) throw new Error('No more prompts right now. Come back tomorrow.')
      const next: NextQuickTake = await res.json()
      setPrompt(next.prompt_text ?? '')
      setChallengeId(next.id)
      setCurrentMove(next.move_tags?.[0] ?? null)
      setTake('')
      setResult(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No more prompts right now.')
    } finally {
      setLoadingNext(false)
    }
  }

  const band = result ? gradeBand(result.score) : null

  return (
    <div id={QUICK_TAKE_ANCHOR} className="note-amber scroll-mt-24 rounded-2xl p-4">
      {/* Rendered full-width under the dashboard trio grid: prompt column left,
          answer column right at lg so the panel uses the row it now owns. */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="min-w-0">
      <div className="mb-2.5 flex items-center gap-2.5">
        <HatchImage size={26} state="avatar" />
        <div className="min-w-0 flex-1">
          <div className="font-body text-[15.5px] font-bold text-ink-strong">Quick Take</div>
          <div className="text-[11.5px] font-semibold text-ink-muted">One prompt, graded in seconds</div>
        </div>
        {result && band && (
          <span
            className="shrink-0 rounded-full border-[1.5px] px-2.5 py-0.5 text-[12px] font-bold"
            style={{ borderColor: band.fg, color: band.fg, background: band.bg }}
          >
            {band.label}
          </span>
        )}
      </div>

      <p className="text-[13.5px] leading-[1.5] text-ink-strong">&ldquo;{prompt}&rdquo;</p>
      </div>

      <div className="min-w-0 lg:pt-1">
      {result ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-secondary tabular-nums">
            <span>{Math.round(result.score * 100)}%</span>
            <span aria-hidden>&middot;</span>
            <span className="inline-flex items-center gap-1">
              <Zap size={14} strokeWidth={1.8} className="text-gold" />
              {result.xp_earned} XP{result.alreadyCompleted ? ' (already graded)' : ' earned'}
            </span>
          </div>

          {result.structured && (result.structured.what_worked || result.structured.what_to_improve || result.structured.example_move) ? (
            <div className="flex flex-col gap-2">
              {result.structured.what_worked && (
                <div className="flex items-start gap-2">
                  <CircleCheck size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-forest-600" />
                  <FeedbackText className="text-[12.5px] leading-relaxed text-ink-strong">{result.structured.what_worked}</FeedbackText>
                </div>
              )}
              {result.structured.what_to_improve && (
                <div className="flex items-start gap-2">
                  <ArrowRight size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-ink-secondary" />
                  <FeedbackText className="text-[12.5px] leading-relaxed text-ink-strong">{result.structured.what_to_improve}</FeedbackText>
                </div>
              )}
              {result.structured.example_move && (
                <div className="flex items-start gap-2 rounded-lg border border-hairline bg-white/60 px-2.5 py-2">
                  <Zap size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-forest-800" />
                  <FeedbackText className="text-[12.5px] font-semibold leading-relaxed text-ink-strong">{result.structured.example_move}</FeedbackText>
                </div>
              )}
            </div>
          ) : (
            <FeedbackText className="text-[12.5px] leading-relaxed text-ink-strong">{result.feedback_summary}</FeedbackText>
          )}

          {error && <p className="text-[12px] font-semibold text-error">{error}</p>}

          <button
            onClick={handleTryAnother}
            disabled={loadingNext}
            className="self-start rounded-lg border border-hairline bg-white px-3.5 py-[7px] text-[12px] font-bold text-ink-strong transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            {loadingNext ? 'Loading next prompt' : 'Try another'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <textarea
            ref={textareaRef}
            value={take}
            onChange={e => setTake(e.target.value)}
            placeholder="Two to four sentences. Name the problem, then your move."
            disabled={submitting}
            rows={3}
            maxLength={6000}
            className="w-full resize-none rounded-lg border border-hairline bg-white/70 px-3 py-2 text-[13px] leading-relaxed text-ink-strong outline-none placeholder:text-ink-muted focus:border-forest-600 disabled:opacity-60"
          />
          {error && <p className="text-[12px] font-semibold text-error">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!take.trim() || submitting}
            className="self-start rounded-lg bg-forest-800 px-3.5 py-[7px] text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? 'Grading' : 'Submit take'}
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
