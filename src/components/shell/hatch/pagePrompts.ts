/**
 * Page-context starter prompts shown when the Hatch chat panel opens with no messages.
 * Pure data + lookup. No React, no DOM.
 */

export interface PagePrompt {
  pattern: RegExp
  message: string
}

export const PAGE_PROMPTS: PagePrompt[] = [
  { pattern: /^\/workspace\/challenges\//, message: 'Need a nudge on your approach?' },
  { pattern: /^\/challenges\/[^/]+\/feedback/, message: 'Want to dig into your feedback?' },
  { pattern: /^\/explore\/modules\//, message: 'Want me to unpack this chapter?' },
  { pattern: /^\/learn\//, message: 'Want me to unpack this chapter?' },
  { pattern: /^\/explore\/plans\//, message: 'Thinking about this plan? I can tell you if it fits your gaps.' },
  { pattern: /^\/explore\/domains\//, message: 'Want to know which challenges here will help you most?' },
  { pattern: /^\/explore/, message: 'Not sure where to start? Tell me your role.' },
  { pattern: /^\/challenges/, message: 'I can filter these to the FLOW move you need most.' },
  { pattern: /^\/live-interviews/, message: 'Tell me the company, role, or discipline you want to practice.' },
  { pattern: /^\/progress/, message: 'Want to understand what your numbers actually mean?' },
  { pattern: /^\/dashboard/, message: 'Ready to pick your first challenge today?' },
]

export function getPagePrompt(pathname: string): string {
  for (const { pattern, message } of PAGE_PROMPTS) {
    if (pattern.test(pathname)) return message
  }
  return 'Ask me anything about FLOW or product thinking.'
}
