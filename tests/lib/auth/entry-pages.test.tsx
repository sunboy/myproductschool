import { describe, expect, it, vi } from 'vitest'
vi.mock('@/components/auth/editorial/ActiveLoginConcept', () => ({ ActiveLoginConcept: () => null }))
import LoginPage from '../../../src/app/(auth)/login/page'
import SignupPage from '../../../src/app/(auth)/signup/page'

describe('authentication entry pages preserve user intent', () => {
  it('passes a selected resumable workspace through login', async () => {
    const destination = '/workspace/challenges/checkout-funnel-drop?resume=1&attempt=abc'
    const page = await LoginPage({ searchParams: Promise.resolve({ returnTo: destination }) })
    expect(page.props.redirectTo).toBe(destination)
  })
  it('preserves checkout intent and archetype through signup', async () => {
    const page = await SignupPage({ searchParams: Promise.resolve({ next: '/pricing?plan=annual&checkout=1', archetype: 'strategist' }) })
    expect(page.props.redirectTo).toBe('/pricing?plan=annual&checkout=1')
    expect(page.props.archetype).toBe('strategist')
  })
  it('does not pass external redirect URLs or repeated-value ambiguity', async () => {
    const page = await LoginPage({ searchParams: Promise.resolve({ returnTo: '//example.com', next: ['/dashboard', '/progress'] }) })
    expect(page.props.redirectTo).toBeUndefined()
  })
})
