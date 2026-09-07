import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getPagePromptEntry,
  isAllowedPagePromptHref,
  pagePromptDestination,
  promptForFreshConversation,
} from '../../../src/components/shell/hatch/pagePrompts'

describe('Hatch page prompt actions', () => {
  it('keeps page-specific prompts connected to a concrete action', () => {
    assert.equal(getPagePromptEntry('/dashboard').cta?.action, 'open-chat')
    assert.equal(getPagePromptEntry('/challenges').cta?.action, 'open-chat')
    assert.equal(getPagePromptEntry('/explore/plans').cta?.action, 'open-chat')
    assert.equal(getPagePromptEntry('/explore/modules/product-sense/intro').cta?.action, 'open-chat')
  })

  it('routes the practice suggestion to the complete catalog', () => {
    assert.equal(
      pagePromptDestination('filter-practice', { weakestMove: 'frame' }),
      '/challenges',
    )
  })

  it('opens only a safe internal study-plan route from the API pick', () => {
    assert.equal(
      pagePromptDestination('show-plan', { planSlug: 'staff-engineer-path' }),
      '/explore/plans/staff-engineer-path',
    )
    assert.equal(pagePromptDestination('show-plan', { planSlug: '//evil.example' }), null)
    assert.equal(pagePromptDestination('show-plan', { planSlug: '../settings' }), null)
    assert.equal(pagePromptDestination('show-plan', { planSlug: 'plan?next=https://evil.example' }), null)
    assert.equal(pagePromptDestination('show-plan', { planSlug: null }), null)
  })

  it('rejects external, protocol-relative, and unrelated internal destinations', () => {
    assert.equal(isAllowedPagePromptHref('https://evil.example'), false)
    assert.equal(isAllowedPagePromptHref('//evil.example'), false)
    assert.equal(isAllowedPagePromptHref('/settings'), false)
    assert.equal(isAllowedPagePromptHref('/explore/plans/staff-engineer-path'), true)
  })

  it('primes a contextual card prompt without replacing a thread or draft', () => {
    assert.equal(
      promptForFreshConversation('  Explain the trade-off in my answer.  ', false, ''),
      'Explain the trade-off in my answer.',
    )
    assert.equal(promptForFreshConversation('Replace this', true, ''), null)
    assert.equal(promptForFreshConversation('Replace this', false, 'My draft'), null)
    assert.equal(promptForFreshConversation('', false, ''), null)
    assert.equal(promptForFreshConversation('x'.repeat(20_001), false, ''), null)
  })
})
