import { describe, expect, it } from 'vitest'
import { canonicalResumeHref, quickTakeForReturningUser, resolveDashboardAction } from './action'

const first = { kind: 'first' as const, href: '/workspace/challenges/first', title: 'First' }
const next = { kind: 'next' as const, href: '/workspace/challenges/next', title: 'Next' }

describe('dashboard action resolution', () => {
  it('keeps a canonical slug and resume query', () => {
    expect(canonicalResumeHref({ id: 'uuid', slug: 'cache-design', challenge_type: 'system_design' }))
      .toBe('/workspace/challenges/cache-design?resume=1')
  })

  it('prioritizes resume, then first-time, then recommended', () => {
    const resume = { kind: 'resume' as const, href: '/workspace/challenges/cache-design?resume=1', title: 'Cache design' }
    expect(resolveDashboardAction({ resume, first, next, hasAnyAttempts: true })).toBe(resume)
    expect(resolveDashboardAction({ resume: null, first, next, hasAnyAttempts: false })).toBe(first)
    expect(resolveDashboardAction({ resume: null, first, next, hasAnyAttempts: true })).toBe(next)
  })

  it('keeps the first challenge as the only practice action on day zero', () => {
    const quickTake = { id: 'quick-take-1' }
    expect(quickTakeForReturningUser(quickTake, false)).toBeNull()
    expect(quickTakeForReturningUser(quickTake, true)).toBe(quickTake)
  })
})
