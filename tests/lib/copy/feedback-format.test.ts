import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatFeedbackMarkdown } from '../../../src/lib/feedback-format'

describe('feedback text formatting', () => {
  it('turns plain newline feedback into markdown bullets', () => {
    const formatted = formatFeedbackMarkdown('Name the user segment\nAdd one metric\nState the tradeoff')
    assert.equal(formatted, '- Name the user segment\n- Add one metric\n- State the tradeoff')
  })

  it('preserves paragraph breaks for prose', () => {
    const formatted = formatFeedbackMarkdown('Good diagnosis of the activation gap.\n\nNext, make the metric threshold explicit.')
    assert.equal(formatted, 'Good diagnosis of the activation gap.\n\nNext, make the metric threshold explicit.')
  })

  it('normalizes numbered feedback without changing markdown lists', () => {
    const formatted = formatFeedbackMarkdown('1) Run the visible test\n2) Explain the edge case')
    assert.equal(formatted, '1. Run the visible test\n2. Explain the edge case')
  })
})
