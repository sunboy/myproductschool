// Quiz config for the /go/failure-mode lead magnet.
// 4 MCQ steps, one per FLOW move, drawn from the calibration question bank.
// Silent scoring (no instant-reveal) so the result feels diagnostic, not graded.
// Import-safe on both server and client: no server-only deps.

import type { MagnetQuizConfig, QuizAnswers } from '@/lib/lead-magnets/quiz-types'
import { QUESTIONS } from '@/lib/calibration/questions'
import {
  scoreMove,
  deriveArchetype,
  weakestMoveOf,
  type MoveScores,
} from '@/lib/calibration/derive'

// Map calibration quality → instant-player tier for Hatch reactions.
const QUALITY_TO_TIER: Record<string, 'best' | 'good' | 'surface' | 'wrong'> = {
  best: 'best',
  good_but_incomplete: 'good',
  surface: 'surface',
  plausible_wrong: 'wrong',
}

// Compact phrasings for the mobile instant player. Same options, same
// scoring; just trimmed to a tappable length. Keyed by `${move}:${optionId}`.
const SHORT_CONTEXTS: Record<string, string> = {
  frame:
    'Weekly active users are down 30% in two months. Tickets say the dashboard feels slow, but the logs show no regression. Leadership wants a fix this sprint.',
  list:
    'A finance app keeps new users for two weeks, then they stop logging. Adding one entry takes five taps. Three engineers are free next sprint.',
  optimize:
    'Variant A cuts cart abandonment 18% but adds 40 seconds to checkout. Variant B is 25 seconds faster but does not move abandonment. One ships.',
  win:
    'A legacy export format serves 12% of users but eats engineering time. Sales fears churn, engineering wants it gone, the CEO wants a call this week.',
}

const SHORT_TEXTS: Record<string, string> = {
  'frame:A': 'Pull the data first: what did users stop doing before they churned?',
  'frame:B': 'Profile the dashboard and add a loading skeleton.',
  'frame:C': 'Survey churned users and ask why they left.',
  'frame:D': 'Escalate to engineering so leadership sees action this sprint.',
  'list:A': 'Put four different levers on the table: quick-add, auto-import, streaks, zero-effort mode.',
  'list:B': 'Cut the add-entry flow from five taps to two and A/B test it.',
  'list:C': 'Send a daily push reminder to log spending.',
  'list:D': 'Drop manual logging entirely and import bank data instead.',
  'optimize:A': 'Name the deciding metric, revenue per visitor, model both, ship the winner.',
  'optimize:B': 'Ship A: fewer abandoned carts means more revenue.',
  'optimize:C': 'Ship B: a faster checkout is a better experience.',
  'optimize:D': 'Run a third variant that combines the best of both.',
  'win:A': 'Propose a 90-day sunset with migration tooling, a churn guardrail, and an offer for sales.',
  'win:B': 'Agree to deprecate and announce the date in release notes.',
  'win:C': 'Tell sales the 12% does not represent real revenue.',
  'win:D': 'Ask the CEO to make the final call.',
}

// Map the four calibration questions directly into MagnetQuiz steps.
// step.id = move key so answers are keyed by move for scoring.
const buildSteps = () =>
  QUESTIONS.map((q) => ({
    kind: 'mcq' as const,
    id: q.move,
    context: q.scenario,
    shortContext: SHORT_CONTEXTS[q.move],
    prompt: q.q,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
      shortText: SHORT_TEXTS[`${q.move}:${o.id}`],
      tier: QUALITY_TO_TIER[o.quality],
    })),
    // No reveal — silent scoring keeps the diagnostic feel.
  }))

// One authored line per move describing what skipping it looks like under pressure.
const MOVE_INSIGHTS: Record<string, string> = {
  frame:
    'Skipping Frame means committing to a solution before checking whether the stated problem is the real one. The answer sounds decisive but lands on the wrong thing.',
  list:
    'Skipping List means generating variations of one idea rather than structurally different options. It looks like creative thinking but narrows the decision space before it opens.',
  optimize:
    'Skipping Optimize means naming what you would pick without naming what you give up. The recommendation floats without a criterion anyone can challenge or verify.',
  win:
    'Skipping Win means ending without a falsifiable claim. The answer lands as intent rather than strategy, and no one can tell whether it worked.',
}

// For each move, the 'best' option text acts as the concrete sampleRewrite.
function getBestOptionText(move: string): string {
  const question = QUESTIONS.find((q) => q.move === move)
  if (!question) return ''
  const best = question.options.find((o) => o.quality === 'best')
  return best?.text ?? ''
}

const MOVE_LABELS: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

export const failureModeQuizConfig: MagnetQuizConfig = {
  magnet: 'failure-mode',
  version: 1,
  steps: buildSteps(),
  deriveResult(answers: QuizAnswers) {
    // Score each move 0-100.
    const scores: MoveScores = {
      frame: scoreMove('frame', typeof answers.frame === 'string' ? answers.frame : ''),
      list: scoreMove('list', typeof answers.list === 'string' ? answers.list : ''),
      optimize: scoreMove('optimize', typeof answers.optimize === 'string' ? answers.optimize : ''),
      win: scoreMove('win', typeof answers.win === 'string' ? answers.win : ''),
    }

    const archetype = deriveArchetype(scores)
    const weakestMove = weakestMoveOf(scores)

    // What the user actually picked for their weakest move.
    const pickedId =
      typeof answers[weakestMove] === 'string' ? (answers[weakestMove] as string) : ''
    const weakestQuestion = QUESTIONS.find((q) => q.move === weakestMove)
    const pickedOptionText =
      weakestQuestion?.options.find((o) => o.id === pickedId)?.text ?? ''

    const dimensions = [
      { key: 'frame', label: 'Frame', value: scores.frame, max: 100 },
      { key: 'list', label: 'List', value: scores.list, max: 100 },
      { key: 'optimize', label: 'Optimize', value: scores.optimize, max: 100 },
      { key: 'win', label: 'Win', value: scores.win, max: 100 },
    ]

    return {
      band: {
        key: archetype.key,
        label: archetype.name,
        blurb: archetype.description,
      },
      dimensions,
      recommendedNext: {
        label: `Run a ${MOVE_LABELS[weakestMove]} rep`,
        href: '/challenges',
      },
      detail: {
        weakestMove,
        weakestMoveLabel: MOVE_LABELS[weakestMove],
        pickedOptionText,
        sampleRewrite: getBestOptionText(weakestMove),
        moveInsight: MOVE_INSIGHTS[weakestMove] ?? '',
        scores,
      },
    }
  },
}
