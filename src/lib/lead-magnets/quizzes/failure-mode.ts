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

// Map the four calibration questions directly into MagnetQuiz steps.
// step.id = move key so answers are keyed by move for scoring.
const buildSteps = () =>
  QUESTIONS.map((q) => ({
    kind: 'mcq' as const,
    id: q.move,
    context: q.scenario,
    prompt: q.q,
    options: q.options.map((o) => ({
      id: o.id,
      text: o.text,
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
