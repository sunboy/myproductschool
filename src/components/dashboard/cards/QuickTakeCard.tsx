'use client'

import { useState } from 'react'
import { HatchImage } from '@/components/redesign/HatchImage'
import { FeedbackText } from '@/components/ui/FeedbackText'

interface QuickTakeCardProps {
  prompt: string
  challengeId: string
  hatchContext?: string | null
}

type State = 'idle' | 'writing' | 'submitting' | 'done' | 'loading-next'

interface Result {
  score: number
  xp_earned: number
  feedback_summary: string
  structured?: { what_worked: string | null; what_to_improve: string | null; example_move: string | null } | null
}

interface QuickTakeChallenge {
  id: string
  prompt_text: string
  move_tags: string[]
}

function gradeLabel(score: number): { label: string; color: string } {
  if (score >= 0.8) return { label: 'Sharp', color: '#4a7c59' }
  if (score >= 0.5) return { label: 'Solid', color: '#c9933a' }
  if (score >= 0.2) return { label: 'Surface', color: '#6b8275' }
  return { label: 'Weak', color: '#b83230' }
}

export function QuickTakeCard({ prompt: initialPrompt, challengeId: initialChallengeId, hatchContext }: QuickTakeCardProps) {
  const [state, setState] = useState<State>('idle')
  const [prompt, setPrompt] = useState(initialPrompt)
  const [challengeId, setChallengeId] = useState(initialChallengeId)
  const [currentMove, setCurrentMove] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!response.trim() || state === 'submitting') return
    setState('submitting')
    setError(null)
    try {
      const res = await fetch('/api/challenges/quick-take/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, response_text: response }),
      })
      const data = await res.json()
      if (!res.ok) {
        const nextAction = Array.isArray(data.next_actions) ? data.next_actions[0] : undefined
        throw new Error(data.status === 'not_ready'
          ? [data.summary, nextAction].filter(Boolean).join(' ')
          : data.error ?? 'Submission failed')
      }
      setResult(data)
      setState('done')
      window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'quick-take' } }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setState('writing')
    }
  }

  async function handleTryAnother() {
    setState('loading-next')
    try {
      const params = new URLSearchParams({ exclude: challengeId })
      if (currentMove) params.set('move', currentMove)
      const res = await fetch(`/api/challenges/quick-take/next?${params}`)
      if (!res.ok) throw new Error('No next challenge')
      const next: QuickTakeChallenge = await res.json()
      setPrompt(next.prompt_text ?? '')
      setChallengeId(next.id)
      setCurrentMove(next.move_tags?.[0] ?? null)
      setResponse('')
      setResult(null)
      setState('idle')
    } catch {
      // Reset to idle with current prompt if fetch fails
      setResponse('')
      setResult(null)
      setState('idle')
    }
  }

  if (state === 'done' && result) {
    const { label, color } = gradeLabel(result.score)
    return (
      <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-primary p-4 text-on-primary shadow-[0_16px_34px_-34px_rgba(30,27,20,0.45)]" data-hatch-target="dashboard-quick-take">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-center gap-3 relative">
          <HatchImage size={30} state="celebrating" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Quick Take, graded</h3>
            <p className="text-on-primary/70 text-[11px] font-label mt-0.5">+{result.xp_earned} XP earned</p>
          </div>
        </div>
        <div className="relative flex flex-col gap-2.5 rounded-xl bg-black/20 p-3">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-label font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: color, color: '#fff' }}
            >
              {label}
            </span>
            <span className="text-on-primary/60 text-xs">{Math.round(result.score * 100)}%</span>
          </div>
          {result.structured && (result.structured.what_worked || result.structured.what_to_improve || result.structured.example_move) ? (
            <div className="flex flex-col gap-2">
              {result.structured.what_worked && (
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-on-primary/80 text-[15px] mt-0.5 shrink-0">check_circle</span>
                  <FeedbackText className="text-on-primary/90 text-[12.5px] leading-relaxed">{result.structured.what_worked}</FeedbackText>
                </div>
              )}
              {result.structured.what_to_improve && (
                <div className="flex gap-2 items-start">
                  <span className="material-symbols-outlined text-on-primary/80 text-[15px] mt-0.5 shrink-0">arrow_forward</span>
                  <FeedbackText className="text-on-primary/90 text-[12.5px] leading-relaxed">{result.structured.what_to_improve}</FeedbackText>
                </div>
              )}
              {result.structured.example_move && (
                <div className="rounded-lg bg-white/10 px-2.5 py-2 flex gap-2 items-start">
                  <span className="material-symbols-outlined text-on-primary text-[15px] mt-0.5 shrink-0">bolt</span>
                  <FeedbackText className="text-on-primary text-[12.5px] leading-relaxed font-semibold">{result.structured.example_move}</FeedbackText>
                </div>
              )}
            </div>
          ) : (
            <FeedbackText className="line-clamp-4 text-on-primary/90">{result.feedback_summary}</FeedbackText>
          )}
        </div>
        <button
          onClick={handleTryAnother}
          className="self-start bg-white/15 hover:bg-white/25 text-on-primary rounded-full px-4 py-1.5 font-label font-semibold text-sm transition-colors"
        >
          Try another
        </button>
      </div>
    )
  }

  if (state === 'loading-next') {
    return (
      <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-primary p-4 text-on-primary" data-hatch-target="dashboard-quick-take">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-center gap-3 relative">
          <HatchImage size={30} state="reviewing" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Loading next question…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'writing' || state === 'submitting') {
    return (
      <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-primary p-4 text-on-primary" data-hatch-target="dashboard-quick-take">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-start gap-3 relative">
          <HatchImage size={30} state="listening" className="mt-0.5" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Quick Take</h3>
            <p className="text-on-primary/70 text-[11px] font-label mt-0.5">90 seconds · instant grade</p>
          </div>
        </div>
        <div className="relative rounded-xl bg-black/20 p-3">
          <p className="text-on-primary/70 text-xs mb-2">&ldquo;{prompt}&rdquo;</p>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Your answer…"
            disabled={state === 'submitting'}
            rows={3}
            className="w-full bg-transparent text-on-primary text-sm placeholder:text-on-primary/40 resize-none outline-none leading-relaxed"
          />
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!response.trim() || state === 'submitting'}
            className="self-start bg-white text-primary rounded-full px-5 py-2 font-label font-bold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-sm disabled:opacity-40"
          >
            {state === 'submitting' ? 'Grading…' : 'Submit'}
          </button>
          <button
            onClick={() => { setState('idle'); setResponse('') }}
            className="self-start bg-white/10 hover:bg-white/20 text-on-primary rounded-full px-4 py-2 font-label text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // idle
  return (
    <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-primary p-4 text-on-primary shadow-[0_16px_34px_-34px_rgba(30,27,20,0.45)]" data-hatch-target="dashboard-quick-take">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
      <div className="flex items-start gap-3 relative">
        <HatchImage size={30} state="speaking" className="mt-0.5" />
        <div>
          <h3 className="font-headline font-bold text-base leading-tight">Quick Take</h3>
          <p className="text-on-primary/70 text-[11px] font-label mt-0.5">90 seconds · instant grade</p>
        </div>
      </div>
      <div className="relative rounded-xl bg-black/20 p-3">
        <p className="line-clamp-4 text-sm leading-relaxed text-on-primary/90">&ldquo;{prompt}&rdquo;</p>
      </div>
      {hatchContext && (
        <p className="text-xs text-on-primary/65 font-label flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">auto_awesome</span>
          <span className="line-clamp-2">{hatchContext}</span>
        </p>
      )}
      <button
        onClick={() => setState('writing')}
        className="self-start bg-white text-primary rounded-full px-5 py-2 font-label font-bold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 shadow-sm"
      >
        Start Quick Take
      </button>
    </div>
  )
}
