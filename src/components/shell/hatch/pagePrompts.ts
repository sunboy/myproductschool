/**
 * Page-context starter prompts shown in Hatch's passive page bubble and as the
 * empty-chat greeting. Pure data + lookup. No React, no DOM.
 *
 * `filter-practice` and `show-plan` action variants used to exist for
 * personalized navigation backed by GET /api/hatch/pick, but FloatingHatch
 * never actually rendered a cta button for page prompts (only pagePrompt.message
 * ever reached the UI) — the actions were dead. Removed rather than left as an
 * unwired promise; every entry now either has no cta or uses `open-chat`,
 * which IS wired (opens the panel, optionally pre-filling `prompt`).
 */

export type PagePromptAction = 'open-chat'

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

export const PAGE_PROMPTS: PagePrompt[] = [
  {
    pattern: /^\/workspace\/challenges\//,
    message: 'Need a nudge on your approach?',
    cta: { label: 'Nudge me', action: 'open-chat', prompt: 'Give me a nudge on my current approach without spoiling the answer.' },
  },
  {
    pattern: /^\/challenges\/[^/]+\/feedback/,
    message: 'Want to dig into your feedback?',
    cta: { label: 'Unpack my feedback', action: 'open-chat', prompt: 'Walk me through the biggest miss in my feedback and how to fix it next rep.' },
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
    message: 'Ask me which plan fits where you are right now.',
    cta: { label: 'Ask Hatch', action: 'open-chat' },
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
    message: 'Ask me anything about picking the right rep.',
    cta: { label: 'Ask Hatch', action: 'open-chat' },
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
    cta: { label: 'Pick my rep', action: 'open-chat', prompt: 'Pick my next challenge and tell me why that one.' },
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
