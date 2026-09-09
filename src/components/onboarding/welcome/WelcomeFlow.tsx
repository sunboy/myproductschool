'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WelcomePanel } from './WelcomePanel'
import { RoleStep } from './steps/RoleStep'
import { GoalStep } from './steps/GoalStep'
import { ScenarioStep } from './steps/ScenarioStep'
import { ResultsStep, type CalibrationResults } from './steps/ResultsStep'
import { useWelcomeState, stepIndexFor, type WelcomeStep } from './useWelcomeState'
import { clearOnboardingState } from '@/lib/onboarding/state-client'
import { trackEvent } from '@/lib/posthog/client'
import { EVENT_ONBOARDING_STEP } from '@/lib/posthog/events'
import { FIRST_REP_FALLBACK_HREF } from '@/lib/onboarding/curated-first-rep'
import type { HatchImageState } from '@/components/redesign/HatchImage'

const PANEL: Record<WelcomeStep, { pose: HatchImageState; headline: string; accent: string; body: string }> = {
  role: { pose: 'wave', headline: 'To get started,', accent: 'what do you do?', body: 'Role shapes which scenarios Hatch pulls. It reads your reasoning, not your title.' },
  goal: { pose: 'thinking', headline: 'What does', accent: 'winning look like?', body: 'Your goal sets which reps come first. Timeline sets the pace, not a deadline. Nothing here is locked in.' },
  q0: { pose: 'writing', headline: 'Now the', accent: 'fun part.', body: 'Four quick scenarios, one per FLOW move. Gut calls only. Hatch is reading your instincts, not checking right answers.' },
  q1: { pose: 'writing', headline: 'Two down,', accent: 'two to go.', body: 'Same rule: pick what feels most like how you actually think.' },
  q2: { pose: 'writing', headline: 'Trade-offs', accent: 'next.', body: 'This one is about naming what you are optimizing for.' },
  q3: { pose: 'writing', headline: 'Last one:', accent: 'landing it.', body: 'How a decision gets made is half the decision.' },
  results: { pose: 'celebrating', headline: "Here's where", accent: "you're starting.", body: 'Your baseline is set. Every rep from here moves it.' },
}

export function WelcomeFlow({ redo = false }: { redo?: boolean }) {
  const router = useRouter()
  const { state, dispatch, persist, canAdvance } = useWelcomeState()
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<CalibrationResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try { document.cookie = 'hp-welcome-seen=1; path=/; max-age=2592000' } catch {}
  }, [])

  useEffect(() => {
    // Persist on every field change, not just step transitions — otherwise a
    // refresh mid-step (e.g. after picking goal/timeline/context but before
    // clicking Next) loses those selections and resume lands back on 'role'.
    persist(state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    trackEvent(EVENT_ONBOARDING_STEP, { step: `welcome:${state.step}`, step_index: stepIndexFor(state.step) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step])

  const submitProfile = () => fetch('/api/onboarding/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: state.role,
      role_context: state.context,
      primary_goal: state.goal,
      prep_timeline: state.timeline,
      target_company: state.targetCompany || undefined,
      interview_date: state.timeline === 'lt_1mo' ? new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10) : undefined,
    }),
  }).catch(() => {})

  const next = async () => {
    if (!canAdvance) return
    if (state.step === 'goal') void submitProfile()
    if (state.step === 'q3') {
      setSubmitting(true)
      setError(null)
      try {
        const res = await fetch('/api/onboarding/calibration/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: state.answers, role: state.role, primary_goal: state.goal, prep_timeline: state.timeline, role_context: state.context, target_company: state.targetCompany || undefined }),
        })
        if (!res.ok) throw new Error(`submit ${res.status}`)
        setResults(await res.json())
        dispatch({ type: 'next' })
      } catch (e) {
        setError('Scoring took too long. Try again.')
        console.error(e)
      } finally {
        setSubmitting(false)
      }
      return
    }
    dispatch({ type: 'next' })
  }

  const complete = async (path: 'challenge' | 'plan') => {
    await fetch('/api/onboarding/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_context: state.context ?? undefined }) })
    await clearOnboardingState()
    window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'welcome' } }))
    router.push(path === 'plan' && results?.personalised_plan_slug ? `/explore/plans/${results.personalised_plan_slug}` : '/challenges')
  }

  const skip = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding/quick-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: state.role ?? 'swe' }) })
      const body = res.ok ? await res.json() : {}
      window.dispatchEvent(new CustomEvent('profile-stats-updated', { detail: { source: 'welcome-skip' } }))
      router.push(body.challenge_href ?? FIRST_REP_FALLBACK_HREF)
    } finally {
      setSubmitting(false)
    }
  }

  const p = PANEL[state.step]
  const dots = [1, 2, 3, 4, 5]
  const cur = stepIndexFor(state.step)
  return (
    <div data-testid="welcome" className="grid min-h-screen bg-background lg:grid-cols-[44%_56%]">
      <WelcomePanel pose={p.pose} headline={p.headline} accent={p.accent} body={p.body} />
      <section className="flex flex-col px-6 py-6 lg:px-[72px] lg:py-10">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Step ${cur} of 5`}>
            {dots.map(d => <i key={d} className="block h-2 rounded-full" style={{ width: d === cur ? 22 : 8, background: d <= cur ? 'var(--color-forest-800)' : 'var(--color-surface-container-highest)' }} />)}
          </div>
          {state.step !== 'results' && <button type="button" data-testid="welcome-skip" onClick={skip} disabled={submitting} className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-meta font-semibold">Skip for now</button>}
        </div>
        <div className="flex max-w-[640px] flex-1 flex-col justify-center py-6">
          {state.step === 'role' && <RoleStep role={state.role} alsoRoles={state.alsoRoles} onRole={r => dispatch({ type: 'setRole', role: r })} onToggleAlso={r => dispatch({ type: 'toggleAlsoRole', role: r })} />}
          {state.step === 'goal' && <GoalStep goal={state.goal} timeline={state.timeline} context={state.context} company={state.targetCompany} onGoal={v => dispatch({ type: 'setGoal', goal: v })} onTimeline={v => dispatch({ type: 'setTimeline', timeline: v })} onContext={v => dispatch({ type: 'setContext', context: v })} onCompany={v => dispatch({ type: 'setCompany', company: v })} />}
          {['q0', 'q1', 'q2', 'q3'].includes(state.step) && <ScenarioStep index={Number(state.step.slice(1))} answers={state.answers} onAnswer={(m, o) => dispatch({ type: 'answer', move: m, optionId: o })} />}
          {state.step === 'results' && results && <ResultsStep results={results} onStart={() => complete('challenge')} onPlan={() => complete('plan')} />}
          {error && <p role="alert" className="mt-3 text-ui text-error">{error}</p>}
        </div>
        {state.step !== 'results' && (
          <div className="flex items-center justify-between">
            <button type="button" data-testid="welcome-back" onClick={() => dispatch({ type: 'back' })} disabled={state.step === 'role'} className="rounded-full border border-hairline bg-card-bright px-3 py-1 text-meta font-semibold disabled:opacity-40">← Back</button>
            <button type="button" data-testid="welcome-next" onClick={next} disabled={!canAdvance || submitting} className="rounded-full bg-forest-800 px-7 py-3 text-body font-bold text-white disabled:opacity-50">{submitting ? 'Scoring…' : 'Next →'}</button>
          </div>
        )}
        {redo && <Link href="/settings" className="mt-3 text-meta text-ink-secondary">Cancel and go back to Settings</Link>}
      </section>
    </div>
  )
}
