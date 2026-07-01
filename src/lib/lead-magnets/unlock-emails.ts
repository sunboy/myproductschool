// Personalized unlock-email builders for the /go/* lead magnets.
//
// The capture API has the visitor's computed quiz result at send time, so the
// unlock email can deliver real substance from THEIR result instead of generic
// teaser copy. Each builder returns full copy (subject through bullets) or
// null, in which case the API falls back to the static copy in config.ts.
//
// Server-side only consumers (the API route + nurture cron); keep import-safe
// regardless.

import type { LeadMagnetUnlockCopy } from '@/lib/lead-magnets/config'
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import { ARCHETYPES, weakestMoveOf, type MoveScores, type CalibrationMoveKey } from '@/lib/calibration/deriveArchetype'
import { QUESTIONS } from '@/lib/calibration/questions'

const MOVE_LABELS: Record<CalibrationMoveKey, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

// What skipping each move costs in a live interview, written for email.
const MOVE_COSTS: Record<CalibrationMoveKey, string> = {
  frame:
    'In a live round, skipping Frame is the most expensive mistake there is. You commit to a direction before checking whether the stated problem is the real one, so everything after sounds decisive and lands on the wrong target. Interviewers reject these answers fast because the miss happens in the first thirty seconds.',
  list:
    'In a live round, skipping List looks like fluency and costs you the offer. You generate three versions of the same idea instead of three different mechanisms, and the interviewer reads it as a narrow decision space. Strong candidates put structurally different levers on the table before picking one.',
  optimize:
    'In a live round, skipping Optimize is what makes an answer feel like opinion. You name what you would pick without naming what you give up, so the recommendation floats with no criterion anyone can challenge. Interviewers score the named tradeoff, not the pick.',
  win:
    'In a live round, skipping Win means your answer ends as intent instead of strategy. There is no falsifiable claim, no metric with a threshold, no way to know whether the call worked. The interviewer hears a plan with no scoreboard, and plans without scoreboards do not get staffed.',
}

function bestOptionText(move: CalibrationMoveKey): string {
  const q = QUESTIONS.find((x) => x.move === move)
  return q?.options.find((o) => o.quality === 'best')?.text ?? ''
}

function buildFailureModeEmail(result: MagnetResultPayload): LeadMagnetUnlockCopy | null {
  const dims = result.dimensions
  if (!dims) return null
  const scores: MoveScores = {
    frame: dims.frame ?? 0,
    list: dims.list ?? 0,
    optimize: dims.optimize ?? 0,
    win: dims.win ?? 0,
  }
  const archetype = ARCHETYPES[result.band] ?? null
  if (!archetype) return null
  const weakest = weakestMoveOf(scores)
  const weakestLabel = MOVE_LABELS[weakest]
  const rewrite = bestOptionText(weakest)

  return {
    subject: `${archetype.name}: the move you skip, and the rewrite that fixes it`,
    eyebrow: 'Your result',
    heading: `${archetype.name}. Here is the full read.`,
    body: `Across the four scenarios you just worked, your strongest pattern is the one that earned the label: ${archetype.description}`,
    bodyParagraphs: [
      `The move that needs attention is ${weakestLabel}, your lowest of the four (${scores[weakest]}/100). ${MOVE_COSTS[weakest]}`,
      rewrite
        ? `Here is what the strong version of your weakest scenario actually does: "${rewrite}" Compare that to the option you picked. The difference is not knowledge, it is the order of the reasoning, and order is trainable.`
        : `The fix is not more knowledge, it is the order of the reasoning, and order is trainable.`,
      `This matters more in 2026 than it did two years ago. Product-sense rounds are no longer scored on frameworks recited from prep guides; interviewers map your answer onto the moves you just practiced and reject on the one you skip. The candidates who pass are the ones who trained the skipped move until it ran under pressure.`,
      `Your full report breaks the result into the six thinking skills behind the four moves, shows which two your ${weakestLabel} score connects to, and lays out a 7-day plan with one focused rep per day. It is printable, and the link below is yours, no account needed.`,
      `When you want to train rather than read, HackProduct is the gym this diagnostic came from: 104 real product decisions to practice on, graded move by move by Hatch, the same coach that just scored you, plus system design, SQL, coding, and live AI interview rounds in one place.`,
    ],
    ctaLabel: 'Open your full report',
    ctaUrl: '/go/failure-mode',
    valueBullets: [
      `Your six-skill profile, with the two skills behind your ${weakestLabel} score`,
      'The strong-answer rewrite for the exact scenario you missed',
      'A printable 7-day plan, one rep per day, weakest move first',
    ],
  }
}

type UnlockEmailBuilder = (result: MagnetResultPayload) => LeadMagnetUnlockCopy | null

const BUILDERS: Record<string, UnlockEmailBuilder> = {
  'failure-mode': buildFailureModeEmail,
}

/**
 * Personalized unlock-email copy for a magnet + captured result, or null when
 * the magnet has no builder (or the result is missing fields), in which case
 * callers fall back to the static config copy.
 */
export function buildUnlockEmailCopy(
  slug: string,
  result: unknown,
): LeadMagnetUnlockCopy | null {
  const builder = BUILDERS[slug]
  if (!builder || !result || typeof result !== 'object') return null
  try {
    return builder(result as MagnetResultPayload)
  } catch {
    return null
  }
}
