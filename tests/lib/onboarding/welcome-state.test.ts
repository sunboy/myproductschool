import { describe, it, expect } from 'vitest'
import { welcomeReducer, initialWelcomeState, stepIndexFor, STEP_ORDER } from '@/components/onboarding/welcome/useWelcomeState'

describe('welcome state', () => {
  it('walks the five steps in order', () => {
    expect(STEP_ORDER).toEqual(['role', 'goal', 'q0', 'q1', 'q2', 'q3', 'results'])
    let s = initialWelcomeState
    s = welcomeReducer(s, { type: 'setRole', role: 'swe' })
    s = welcomeReducer(s, { type: 'toggleAlsoRole', role: 'tech_lead' })
    s = welcomeReducer(s, { type: 'next' })
    expect(s.step).toBe('goal'); expect(s.alsoRoles).toEqual(['tech_lead'])
  })
  it('maps steps to dots 1..5', () => {
    expect(stepIndexFor('role')).toBe(1); expect(stepIndexFor('goal')).toBe(2); expect(stepIndexFor('q0')).toBe(3); expect(stepIndexFor('q3')).toBe(4); expect(stepIndexFor('results')).toBe(5)
  })
  it('blocks next until required answers exist', () => {
    const s = welcomeReducer({ ...initialWelcomeState, step: 'goal' }, { type: 'next' })
    expect(s.step).toBe('goal')
  })
})
