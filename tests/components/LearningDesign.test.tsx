import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChallengeWithDomain } from '@/lib/types'

vi.mock('next/link', () => ({ default: ({ children, ...props }: Record<string, unknown>) => createElement('a', props, children as never) }))
vi.mock('@/components/motion', () => ({
  motion: { article: ({ children, className }: { children: never; className: string }) => createElement('article', { className }, children) },
  motionTokens: { spring: { layout: {} } },
}))
vi.mock('@/components/redesign/HatchImage', () => ({ HatchImage: () => null }))

import { DashboardHero } from '@/components/redesign/dashboard/DashboardHero'
import { HatchSuggestionCard } from '@/components/redesign/dashboard/HatchSuggestionCard'
import { ChallengeCard } from '@/app/(app)/challenges/ChallengeCard'

afterEach(() => vi.unstubAllGlobals())

describe('approved design preserves real interactions', () => {
  it('retains the exact resume destination and real challenge title', () => {
    const html = renderToStaticMarkup(createElement(DashboardHero, {
      displayName: 'Learner', action: { kind: 'resume', title: 'Cache decisions', href: '/workspace/challenges/cache?resume=1&attempt=actual', step: 2, totalSteps: 4 },
    }))
    expect(html).toContain('/workspace/challenges/cache?resume=1&amp;attempt=actual')
    expect(html).toContain('Cache decisions')
    expect(html).toContain('Continue working')
    expect(html).toContain('Step 2 of 4')
  })
  it('offers real catalog navigation when no recommendation exists', () => {
    expect(renderToStaticMarkup(createElement(DashboardHero, { displayName: 'Learner', action: null }))).toContain('href="/challenges"')
  })
  it('opens floating Hatch with the supplied personalized prompt', () => {
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })
    const card = HatchSuggestionCard({ message: 'Your latest feedback', prompt: 'Help with cache invalidation' })
    card.props.children[2].props.onClick()
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent
    expect(event.type).toBe('open-ask-hatch')
    expect(event.detail.prompt).toBe('Help with cache invalidation')
  })
  it.each([['algorithm', 'Coding'], ['claude_code_analytics', 'AI analytics'], ['system_design', 'System design']])('keeps %s card destinations and labels', (type, label) => {
    const challenge = { id: 'test-id', slug: 'cache-test', title: 'A real catalog title', challenge_type: type, difficulty: 'medium', topic_tags: [], technique_tags: [], company_tags: [], attempt_count: 0 } as unknown as ChallengeWithDomain
    const html = renderToStaticMarkup(createElement(ChallengeCard, { challenge, paradigm: 'Traditional', returnHref: '/challenges?discipline=system_design', summary: 'A real task summary', locked: true }))
    expect(html).toContain(label)
    expect(html).toContain('/workspace/challenges/cache-test')
    expect(html).toContain('returnTo=')
    expect(html).toContain('A real task summary')
    expect(html).toContain('View challenge')
    expect(html).toContain('Discuss A real catalog title')
  })
})
