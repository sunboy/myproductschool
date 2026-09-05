/**
 * Page-context starter prompts shown in Hatch's passive page bubble and as the
 * empty-chat greeting. Pure data + lookup. No React, no DOM.
 *
 * Every entry carries a `cta` so the bubble is never a dead end: either it
 * pre-fills the chat with a concrete first message (`open-chat`), or it runs a
 * personalized navigation (`filter-practice`, `show-plan`) backed by
 * GET /api/hatch/pick. FloatingHatch owns the execution.
 */

export type PagePromptAction = 'open-chat' | 'filter-practice' | 'show-plan'

export interface PagePromptCta {
  label: string
  action: PagePromptAction
  /** First-person message pre-filled into the chat input for `open-chat`. */
  prompt?: string
}

export interface PagePrompt {
  pattern: RegExp
  message: string
  cta?: PagePromptCta
}

export interface HatchPickResponse {
  weakestMove?: string
  planSlug?: string | null
}

const SAFE_PLAN_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Keep personalized Hatch navigation inside the two app surfaces page prompts
 * are allowed to open. The API returns data, not a trusted redirect target, so
 * callers must run every derived href through this allowlist before router.push.
 */
export function isAllowedPagePromptHref(href: string): boolean {
  if (href === '/challenges?discipline=product_sense') return true
  return /^\/explore\/plans\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(href)
}

export function pagePromptDestination(
  action: PagePromptAction,
  pick?: HatchPickResponse | null,
): string | null {
  if (action === 'filter-practice') {
    return '/challenges?discipline=product_sense'
  }

  if (action !== 'show-plan' || !pick?.planSlug || !SAFE_PLAN_SLUG.test(pick.planSlug)) {
    return null
  }

  const href = `/explore/plans/${pick.planSlug}`
  return isAllowedPagePromptHref(href) ? href : null
}

/** Return a safe prompt only when opening it cannot replace user work. */
export function promptForFreshConversation(
  candidate: unknown,
  hasMessages: boolean,
  currentInput: string,
): string | null {
  if (typeof candidate !== 'string' || hasMessages || currentInput.trim().length > 0) return null
  const prompt = candidate.trim()
  if (!prompt || candidate.length > 20_000) return null
  return prompt
}

export const PAGE_PROMPTS: PagePrompt[] = [
  {
    pattern: /^\/workspace\/challenges\//,
    message: 'Need a nudge on your approach?',
    cta: { label: 'Nudge me', action: 'open-chat', prompt: 'Give me a nudge on my current approach without spoiling the answer.' },
  },
  {
    pattern: /^\/challenges\/[^/]+\/feedback/,
    message: 'Want to dig into your feedback?',
    cta: { label: 'Unpack my feedback', action: 'open-chat', prompt: 'Walk me through the biggest miss in my feedback and how to fix it next time.' },
  },
  {
    pattern: /^\/explore\/modules\//,
    message: 'Want me to walk you through this chapter?',
    cta: { label: 'Key ideas', action: 'open-chat', prompt: 'What are the two ideas in this chapter I should actually remember?' },
  },
  {
    pattern: /^\/learn\//,
    message: 'Want me to walk you through this chapter?',
    cta: { label: 'Key ideas', action: 'open-chat', prompt: 'What are the two ideas in this chapter I should actually remember?' },
  },
  {
    pattern: /^\/explore\/plans\/.+/,
    message: 'Thinking about this plan? I can tell you if it fits your gaps.',
    cta: { label: 'Check the fit', action: 'open-chat', prompt: 'Does this study plan fit my current gaps, or is there a better one for me?' },
  },
  {
    pattern: /^\/explore\/plans\/?$/,
    message: 'One of these plans matches your weakest FLOW move.',
    cta: { label: 'Show my plan', action: 'show-plan' },
  },
  {
    pattern: /^\/explore\/domains\//,
    message: 'Want to know which challenges here will help you most?',
    cta: { label: 'Point me', action: 'open-chat', prompt: 'Which challenges in this topic would close my weakest gap fastest?' },
  },
  {
    pattern: /^\/explore/,
    message: 'Not sure where to start? Tell me your role.',
    cta: { label: 'Help me choose', action: 'open-chat', prompt: 'Help me pick where to start. What should you know about my role and goal?' },
  },
  {
    pattern: /^\/challenges/,
    message: 'I can filter these to the FLOW move you need most.',
    cta: { label: 'Filter to my gap', action: 'filter-practice' },
  },
  {
    pattern: /^\/live-interviews/,
    message: 'Tell me the company, role, or discipline you want to practice.',
    cta: { label: 'Pick for me', action: 'open-chat', prompt: 'Pick an interview discipline for me based on what I need to practice most.' },
  },
  {
    pattern: /^\/progress/,
    message: 'Want to understand what your numbers actually mean?',
    cta: { label: 'Read my numbers', action: 'open-chat', prompt: 'What do my progress numbers say I should work on next?' },
  },
  {
    pattern: /^\/dashboard/,
    message: 'Ready to pick your first challenge today?',
    cta: { label: 'Pick my challenge', action: 'open-chat', prompt: 'Pick my next challenge and tell me why that one.' },
  },
  {
    pattern: /^\/cohort/,
    message: 'Curious how your week compares? I can point out where to close the gap.',
    cta: { label: 'Close the gap', action: 'open-chat', prompt: 'Where am I losing ground against my cohort this week?' },
  },
  {
    pattern: /^\/settings/,
    message: 'Tuning your setup? I can explain what any of these settings change.',
    cta: { label: 'Explain settings', action: 'open-chat', prompt: 'Which of these settings actually change my practice experience?' },
  },
  {
    pattern: /^\/simulation/,
    message: 'Mid-interview nerves are normal. Ask me anything between questions.',
    cta: { label: 'Quick reset', action: 'open-chat', prompt: 'Give me a 30 second reset before the next question.' },
  },
  {
    pattern: /^\/notes/,
    message: 'Your notes feed my coaching. Want me to pull a theme out of them?',
    cta: { label: 'Find a theme', action: 'open-chat', prompt: 'Pull one theme out of my notes that I should practice this week.' },
  },
]

const DEFAULT_PROMPT: PagePrompt = {
  pattern: /.*/,
  message: 'Ask me anything about FLOW or product thinking.',
  cta: { label: 'Ask Hatch', action: 'open-chat' },
}

export function getPagePromptEntry(pathname: string): PagePrompt {
  for (const entry of PAGE_PROMPTS) {
    if (entry.pattern.test(pathname)) return entry
  }
  return DEFAULT_PROMPT
}

export function getPagePrompt(pathname: string): string {
  return getPagePromptEntry(pathname).message
}
