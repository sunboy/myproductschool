export type VoiceRule = 'em_dash' | 'identity_leak' | 'role_framing' | 'slop'

export type VoicePattern = {
  rule: VoiceRule
  re: RegExp
  replacement: string
}

export const BANNED_SLOP = [
  'delve',
  'leverage',
  'utilize',
  'holistic',
  'robust',
  'seamlessly',
  'in order to',
  'as well as',
  'embark on',
  'navigate',
  'unlock',
  'landscape',
  'tapestry',
  'ensure',
  'tailored',
  'cutting-edge',
  'revolutionary',
  'game-changing',
  "it's worth noting",
] as const

export const SLOP_REPLACEMENTS: Record<(typeof BANNED_SLOP)[number], string> = {
  delve: 'dig',
  leverage: 'use',
  utilize: 'use',
  holistic: 'complete',
  robust: 'strong',
  seamlessly: 'smoothly',
  'in order to': 'to',
  'as well as': 'and',
  'embark on': 'start',
  navigate: 'handle',
  unlock: 'open',
  landscape: 'field',
  tapestry: 'mix',
  ensure: 'make sure',
  tailored: 'specific',
  'cutting-edge': 'new',
  revolutionary: 'major',
  'game-changing': 'important',
  "it's worth noting": 'note',
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function slopToRegex(value: string) {
  const escaped = escapeRegExp(value).replace(/\\ /g, '\\s+')
  return new RegExp(`\\b${escaped}\\b`, 'gi')
}

export const EM_DASH_PATTERNS: VoicePattern[] = [
  { rule: 'em_dash', re: /\s*(?:—|--)\s*/g, replacement: ', ' },
]

export const ROLE_FRAMING_PATTERNS: VoicePattern[] = [
  { rule: 'role_framing', re: /^you are (?:a|an)\s+/gi, replacement: '' },
  {
    rule: 'role_framing',
    re: /\bas a (?:senior\s+pm|staff\s+engineer|founding\s+engineer|product manager|data scientist|tech lead|engineer|pm|em|designer|senior|staff|founding)\b,?\s*/gi,
    replacement: '',
  },
  { rule: 'role_framing', re: /\bimagine you\b/gi, replacement: '' },
  { rule: 'role_framing', re: /\byou(?:'re| are) (?:a|an)\s+/gi, replacement: '' },
]

export const IDENTITY_LEAK_PATTERNS: VoicePattern[] = [
  {
    rule: 'identity_leak',
    re: /\bclaude\s+(?:sonnet|haiku|opus)(?:[- ]?\d+(?:\.\d+)?)?\b/gi,
    replacement: 'Hatch',
  },
  {
    rule: 'identity_leak',
    re: /\b(?:claude|sonnet|haiku|opus)(?:[- ]?\d+(?:\.\d+)?)?\b/gi,
    replacement: 'Hatch',
  },
  { rule: 'identity_leak', re: /\banthropic\b/gi, replacement: 'Hatch' },
  { rule: 'identity_leak', re: /\b(?:openai|gpt[- ]?\d?)\b/gi, replacement: 'Hatch' },
  { rule: 'identity_leak', re: /\bas an? (?:ai\s+language model|language model|ai|assistant)\b/gi, replacement: 'as Hatch' },
  { rule: 'identity_leak', re: /\b(?:my )?system prompt\b/gi, replacement: 'my instructions' },
  { rule: 'identity_leak', re: /\b(?:tool|function) call(?:ing|s)?\b/gi, replacement: '' },
  { rule: 'identity_leak', re: /\bcall my tool\b/gi, replacement: '' },
  { rule: 'identity_leak', re: /\bI'm (?:an|a) (?:large )?language model\b/gi, replacement: "I'm Hatch" },
  { rule: 'identity_leak', re: /\b(?:reasoning|thinking) tokens?\b/gi, replacement: '' },
]

export const SLOP_PATTERNS: VoicePattern[] = BANNED_SLOP.map((needle) => ({
  rule: 'slop',
  re: slopToRegex(needle),
  replacement: SLOP_REPLACEMENTS[needle],
}))

export const VOICE_PATTERNS_IN_ORDER: VoicePattern[] = [
  ...IDENTITY_LEAK_PATTERNS,
  ...EM_DASH_PATTERNS,
  ...ROLE_FRAMING_PATTERNS,
  ...SLOP_PATTERNS,
]
