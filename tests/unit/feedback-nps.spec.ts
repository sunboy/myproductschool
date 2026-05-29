import { describe, expect, it } from 'vitest'
import { shouldShowNpsPrompt } from '../../src/lib/feedback/nps'

describe('shouldShowNpsPrompt', () => {
  const now = new Date('2026-05-06T12:00:00.000Z')

  it('does not prompt before five completed challenges', () => {
    expect(shouldShowNpsPrompt({ completedCount: 4, now })).toBe(false)
  })

  it('prompts at five completed challenges when no prompt has been shown', () => {
    expect(shouldShowNpsPrompt({ completedCount: 5, now })).toBe(true)
  })

  it('suppresses prompts inside the 30 day cooldown', () => {
    expect(shouldShowNpsPrompt({
      completedCount: 8,
      lastPromptAt: '2026-04-20T12:00:00.000Z',
      now,
    })).toBe(false)
  })

  it('prompts again after the 30 day cooldown', () => {
    expect(shouldShowNpsPrompt({
      completedCount: 8,
      lastPromptAt: '2026-04-01T12:00:00.000Z',
      now,
    })).toBe(true)
  })
})
