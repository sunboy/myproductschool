import { describe, expect, it } from 'vitest'
import { deriveLensTag, formatCommunityDisplayName } from '../../src/lib/community-shared'

describe('community helper primitives', () => {
  it('prefers metric-first when metrics are explicit', () => {
    expect(
      deriveLensTag({ responseText: 'I would anchor on activation, retention, and conversion before choosing a fix.' })
    ).toBe('metric-first')
  })

  it('detects segment-first reasoning', () => {
    expect(
      deriveLensTag({ responseText: 'Split new users, returning users, and power users before proposing roadmap changes.' })
    ).toBe('segment-first')
  })

  it('detects tradeoff-aware reasoning', () => {
    expect(
      deriveLensTag({ responseText: 'The tradeoff is speed of rollback versus the learning value from the regression.' })
    ).toBe('tradeoff-aware')
  })

  it('marks high scoring answers as strong wins', () => {
    expect(
      deriveLensTag({ responseText: 'Clean structured answer.', score: 2.7, maxScore: 3 })
    ).toBe('strong win')
  })

  it('honors per-submission display mode', () => {
    expect(formatCommunityDisplayName('named', 'Sandeep')).toBe('Sandeep')
    expect(formatCommunityDisplayName('anonymous', 'Sandeep')).toBe('Anonymous peer')
    expect(formatCommunityDisplayName('named', null)).toBe('Anonymous peer')
  })
})
