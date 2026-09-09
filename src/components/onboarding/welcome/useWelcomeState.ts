'use client'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { getOnboardingState, saveOnboardingState } from '@/lib/onboarding/state-client'

export type WelcomeStep = 'role' | 'goal' | 'q0' | 'q1' | 'q2' | 'q3' | 'results'
export const STEP_ORDER: WelcomeStep[] = ['role', 'goal', 'q0', 'q1', 'q2', 'q3', 'results']
export function stepIndexFor(step: WelcomeStep) {
  return step === 'role' ? 1 : step === 'goal' ? 2 : step === 'q0' || step === 'q1' ? 3 : step === 'q2' || step === 'q3' ? 4 : 5
}

export interface WelcomeState {
  step: WelcomeStep
  role: string | null
  alsoRoles: string[]
  goal: string | null
  timeline: string | null
  context: string | null
  targetCompany: string
  answers: Record<string, string>
}
export const initialWelcomeState: WelcomeState = { step: 'role', role: null, alsoRoles: [], goal: null, timeline: null, context: null, targetCompany: '', answers: {} }

export type WelcomeAction =
  | { type: 'hydrate'; state: Partial<WelcomeState> }
  | { type: 'setRole'; role: string } | { type: 'toggleAlsoRole'; role: string }
  | { type: 'setGoal'; goal: string } | { type: 'setTimeline'; timeline: string } | { type: 'setContext'; context: string } | { type: 'setCompany'; company: string }
  | { type: 'answer'; move: string; optionId: string }
  | { type: 'next' } | { type: 'back' } | { type: 'goto'; step: WelcomeStep }

function canAdvance(s: WelcomeState): boolean {
  switch (s.step) {
    case 'role': return !!s.role
    case 'goal': return !!s.goal && !!s.timeline && !!s.context
    case 'q0': return !!s.answers.frame
    case 'q1': return !!s.answers.list
    case 'q2': return !!s.answers.optimize
    case 'q3': return !!s.answers.win
    default: return false
  }
}

export function welcomeReducer(s: WelcomeState, a: WelcomeAction): WelcomeState {
  switch (a.type) {
    case 'hydrate': return { ...s, ...a.state }
    case 'setRole': return { ...s, role: a.role, alsoRoles: s.alsoRoles.filter(r => r !== a.role) }
    case 'toggleAlsoRole': return { ...s, alsoRoles: s.alsoRoles.includes(a.role) ? s.alsoRoles.filter(r => r !== a.role) : [...s.alsoRoles, a.role].slice(0, 2) }
    case 'setGoal': return { ...s, goal: a.goal }
    case 'setTimeline': return { ...s, timeline: a.timeline }
    case 'setContext': return { ...s, context: a.context }
    case 'setCompany': return { ...s, targetCompany: a.company }
    case 'answer': return { ...s, answers: { ...s.answers, [a.move]: a.optionId } }
    case 'next': { if (!canAdvance(s)) return s; const i = STEP_ORDER.indexOf(s.step); return { ...s, step: STEP_ORDER[Math.min(i + 1, STEP_ORDER.length - 1)] } }
    case 'back': { const i = STEP_ORDER.indexOf(s.step); return { ...s, step: STEP_ORDER[Math.max(i - 1, 0)] } }
    case 'goto': return { ...s, step: a.step }
  }
}

interface SavedWelcomeData {
  screen?: string
  selectedRole?: string
  roleContext?: string
  primaryGoal?: string
  prepTimeline?: string
  targetCompany?: string
  answers?: Record<string, string>
  alsoRoles?: string[]
}

/** Persists to /api/onboarding/state under step '/calibration' using the modal's CalibrationStateData shape, so both surfaces can resume each other. */
export function useWelcomeState() {
  const [state, dispatch] = useReducer(welcomeReducer, initialWelcomeState)
  const loaded = useRef(false)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => {
    getOnboardingState<SavedWelcomeData>().then(saved => {
      loaded.current = true
      // The fetch can resolve after the user has already started answering
      // (role click, goal/timeline chips, typing target-company). Applying a
      // stale/empty hydrate at that point stomps in-progress state and
      // remounts the active step mid-interaction (observed as Playwright's
      // "element was detached from the DOM" on a chip click). Once the user
      // has diverged from the initial state, hydration is a no-op.
      if (stateRef.current !== initialWelcomeState) return
      const d = saved?.data ?? {}
      const answers = d.answers ?? {}
      const screen = d.screen ?? ''
      const step: WelcomeStep = STEP_ORDER.includes(screen as WelcomeStep)
        ? (screen as WelcomeStep)
        : d.selectedRole
          ? (d.primaryGoal && d.prepTimeline && d.roleContext ? 'q0' : 'goal')
          : 'role'
      dispatch({
        type: 'hydrate',
        state: {
          role: d.selectedRole ?? null,
          goal: d.primaryGoal ?? null,
          timeline: d.prepTimeline ?? null,
          context: d.roleContext ?? null,
          targetCompany: d.targetCompany ?? '',
          answers,
          alsoRoles: d.alsoRoles ?? [],
          step: Object.keys(answers).length === 4 ? 'q3' : step,
        },
      })
    }).catch(() => { loaded.current = true })
  }, [])
  const persist = useCallback((s: WelcomeState) => {
    if (!loaded.current || s.step === 'results') return
    void saveOnboardingState('/calibration', { screen: s.step, selectedRole: s.role, roleContext: s.context, primaryGoal: s.goal, prepTimeline: s.timeline, targetCompany: s.targetCompany, answers: s.answers, alsoRoles: s.alsoRoles })
  }, [])
  return { state, dispatch, persist, canAdvance: canAdvance(state) }
}
