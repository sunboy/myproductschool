'use client'

import { useState } from 'react'
import { HatchGlyph } from '@/components/shell/HatchGlyph'

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
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setResult(data)
      setState('done')
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
      <div className="bg-primary rounded-2xl p-5 text-on-primary flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-center gap-3 relative">
          <HatchGlyph size={36} state="celebrating" className="text-on-primary shrink-0" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Quick Take — graded</h3>
            <p className="text-on-primary/70 text-[11px] font-label mt-0.5">+{result.xp_earned} XP earned</p>
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-4 flex flex-col gap-3 relative">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-label font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: color, color: '#fff' }}
            >
              {label}
            </span>
            <span className="text-on-primary/60 text-xs">{Math.round(result.score * 100)}%</span>
          </div>
          <div className="flex flex-col gap-2">
            {result.feedback_summary.split('\n\n').map((para, i) => (
              <p key={i} className="text-on-primary/90 text-sm leading-relaxed">{para}</p>
            ))}
          </div>
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
      <div className="bg-primary rounded-2xl p-5 text-on-primary flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-center gap-3 relative">
          <HatchGlyph size={36} state="reviewing" className="text-on-primary shrink-0" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Loading next question…</h3>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'writing' || state === 'submitting') {
    return (
      <div className="bg-primary rounded-2xl p-5 text-on-primary flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
        <div className="flex items-start gap-3 relative">
          <HatchGlyph size={36} state="listening" className="text-on-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">Quick Take</h3>
            <p className="text-on-primary/70 text-[11px] font-label mt-0.5">90 seconds · instant grade</p>
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-3 relative">
          <p className="text-on-primary/70 text-xs mb-2">&ldquo;{prompt}&rdquo;</p>
          <textarea
            autoFocus
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Your answer…"
            disabled={state === 'submitting'}
            rows={4}
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
    <div className="bg-primary rounded-2xl p-5 text-on-primary flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
      <div className="flex items-start gap-3 relative">
        <HatchGlyph size={36} state="speaking" className="text-on-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-headline font-bold text-base leading-tight">Quick Take</h3>
          <p className="text-on-primary/70 text-[11px] font-label mt-0.5">90 seconds · instant grade</p>
        </div>
      </div>
      <div className="bg-black/20 rounded-xl p-4 relative">
        <p className="text-on-primary/90 text-sm leading-relaxed">&ldquo;{prompt}&rdquo;</p>
      </div>
      {hatchContext && (
        <p className="text-xs text-on-primary/65 font-label flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">auto_awesome</span>
          {hatchContext}
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
