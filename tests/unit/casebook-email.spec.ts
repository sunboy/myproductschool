/**
 * Render-only verification for the Casebook "report ready" email — proves
 * the template renders correctly WITHOUT ever calling sendTransactionalEmail
 * (which would attempt a real dedupe DB read + Resend send). Mirrors the
 * payload sendCaseReportReadyEmail (src/lib/email/senders/casebook.ts)
 * builds and pushes it straight through the pure renderEmailForPreview
 * function used by the /admin/emails preview harness — no network calls,
 * no Resend client, no real email sent. Follows the same pattern and
 * server-only mock as tests/unit/email-render.spec.ts.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { renderEmailForPreview, appUrl, type TransactionalEmailPayload } from '@/lib/email/send-core'

function buildCaseReportReadyPayload(overrides: Partial<TransactionalEmailPayload> = {}): TransactionalEmailPayload {
  return {
    dedupeKey: 'casebook_report_ready:test-user-id:test-attempt-id',
    userId: 'test-user-id',
    name: 'Sandeep',
    kind: 'challenge_completion',
    subject: 'Your report on Tuesday Dip is ready',
    previewText: 'What the investigation shows about your moves, while it is still fresh.',
    eyebrow: 'Case filed',
    tone: 'celebratory',
    heading: 'Tuesday Dip',
    body: 'Hatch finished grading your investigation on Tuesday Dip. The report breaks down which expert moves you demonstrated, which ones you missed, and how your verdict compares to the reference case.',
    bodyParagraphs: [
      'Read it while the case is still fresh in your head. The gap between the moves you made and the ones you missed is the most useful part, and it is easiest to place while you still remember why you went the direction you did.',
    ],
    stats: [
      { label: 'Grade', value: 'Sharp' },
      { label: 'Score', value: '86/100' },
    ],
    ctaLabel: 'Read your report',
    ctaUrl: appUrl('/modules/tuesday-dip/challenge'),
    ...overrides,
  }
}

describe('casebook report-ready email render', () => {
  it('renders HTML + text without leaking undefined/null', () => {
    const { html, text } = renderEmailForPreview(buildCaseReportReadyPayload())
    expect(html.length).toBeGreaterThan(500)
    expect(text.length).toBeGreaterThan(40)
    expect(html).not.toMatch(/>\s*undefined\s*</)
    expect(html).not.toContain('undefinedx')
    expect(text).not.toMatch(/\bundefined\b/)
    expect(text).not.toMatch(/\bnull\b/)
  })

  it('includes the case title, grade stats, and CTA to the workspace', () => {
    const { html, text } = renderEmailForPreview(buildCaseReportReadyPayload())
    expect(html).toContain('Tuesday Dip')
    expect(html).toContain('Sharp')
    expect(html).toContain('86/100')
    expect(html).toContain('/modules/tuesday-dip/challenge')
    expect(text).toContain('Tuesday Dip')
    expect(text).toContain('Read your report')
  })

  it('omits the stats grid entirely when grade/score are absent', () => {
    const { html } = renderEmailForPreview(buildCaseReportReadyPayload({ stats: null }))
    expect(html).not.toContain('Grade</')
  })

  it('keeps the "you" voice (transactional emails use second person, unlike challenge copy)', () => {
    const { text } = renderEmailForPreview(buildCaseReportReadyPayload())
    expect(/\byour\b/i.test(text)).toBe(true)
  })

  it('never contains an em dash or AI-slop words in the authored copy (writing-style-guide.md hard rules)', () => {
    // Checks only the copy this sender authors (subject/heading/body/
    // bodyParagraphs) — not the shared signoff boilerplate from
    // send-core.ts's renderTextEmail default ("— Hatch, your HackProduct
    // coach"), which is infra this task does not own.
    const payload = buildCaseReportReadyPayload()
    const authoredCopy = [payload.subject, payload.heading, payload.body, ...(payload.bodyParagraphs ?? [])].join('\n')
    expect(authoredCopy).not.toContain('—')
    const slop = ['delve', 'leverage', 'utilize', 'holistic', 'robust', 'seamlessly', 'in order to']
    for (const word of slop) {
      expect(authoredCopy.toLowerCase()).not.toContain(word)
    }
  })
})
