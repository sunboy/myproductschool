/**
 * Prompts for the /go/mock lead magnet.
 * Three 60-second product situations, each authored so the answer
 * can be graded on a single FLOW move.
 *
 * Import-safe on both server and client: no server-only deps.
 */

export interface MockPrompt {
  id: string
  /** The question the user answers in 60 seconds. */
  prompt: string
  /** 2-3 sentences of situation context shown above the prompt. */
  context: string
}

export const MOCK_PROMPTS: MockPrompt[] = [
  {
    id: 'metric-drop',
    context:
      'A B2B SaaS product tracks weekly active users as its north-star metric. ' +
      'Last week the metric dropped 18% despite no deployment, no pricing change, and no visible bug reports. ' +
      'The engineering team says the infrastructure is clean.',
    prompt:
      'What is the most likely category of root cause, and what would you check first to confirm it?',
  },
  {
    id: 'ai-feature-go-no-go',
    context:
      'A consumer fintech app wants to ship an AI assistant that reads a user\'s transaction history and gives spending advice. ' +
      'The model is accurate in testing, latency is under two seconds, and legal has cleared the data use. ' +
      'The PM needs a go/no-go recommendation before the sprint ends.',
    prompt:
      'What is the strongest argument against shipping now, and what would have to be true for that concern to be resolved?',
  },
  {
    id: 'prioritization-constraint',
    context:
      'A three-person product team has six features requested by different enterprise customers, each promised within the same quarter. ' +
      'Engineering capacity allows exactly two of the six to ship. ' +
      'Sales is pushing for the two largest contract values; customer success says the two highest-churn-risk accounts need different features.',
    prompt:
      'What is the criterion you would use to pick the two features, and why does that criterion take priority over the others?',
  },
]
