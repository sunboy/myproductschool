/**
 * Email render guards:
 *  1. Every sample payload renders (HTML + text) without throwing and without
 *     leaking literal "undefined"/"null" into the output.
 *  2. Anti-dark-pattern: the urgency banner renders ONLY when a real, parseable
 *     date is provided.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { renderEmailForPreview } from '@/lib/email/send-core'
import { urgencyBanner } from '@/lib/email/layout'
import { EMAIL_SAMPLES } from '@/lib/email/samples'

describe('email samples render', () => {
  for (const [kind, payload] of Object.entries(EMAIL_SAMPLES)) {
    it(`renders ${kind} without leaking undefined`, () => {
      const { html, text } = renderEmailForPreview(payload)
      expect(html.length).toBeGreaterThan(500)
      expect(text.length).toBeGreaterThan(40)
      expect(html).not.toMatch(/>\s*undefined\s*</)
      expect(html).not.toContain('undefinedx')
      expect(text).not.toMatch(/\bundefined\b/)
      // Gmail clips messages over ~102KB; leave headroom.
      expect(html.length).toBeLessThan(95_000)
      // Preheader present (previewText falls back to body).
      expect(html).toContain('display:none;font-size:1px')
    })
  }
})

describe('urgency banner is real-deadline only', () => {
  it('renders nothing without a deadline', () => {
    expect(urgencyBanner(null)).toBe('')
    expect(urgencyBanner(undefined)).toBe('')
  })
  it('renders nothing for an invalid date', () => {
    expect(urgencyBanner({ label: 'Hurry, offer ends soon', at: 'not-a-date' })).toBe('')
    expect(urgencyBanner({ label: 'Hurry', at: '' })).toBe('')
  })
  it('renders for a real ISO date', () => {
    const html = urgencyBanner({ label: 'Trial ends July 20', at: new Date(Date.now() + 86400e3).toISOString() })
    expect(html).toContain('Trial ends July 20')
  })
})
