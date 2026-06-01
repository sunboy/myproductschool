import { z } from 'zod'
import type { UserRoleV2 } from '@/lib/types'

export const CALIBRATION_MOVES = ['frame', 'list', 'optimize', 'win'] as const
export type CalibrationMove = typeof CALIBRATION_MOVES[number]
export type CalibrationScores = Record<CalibrationMove, number>

export const VALID_ONBOARDING_ROLES = [
  'swe',
  'data_eng',
  'ml_eng',
  'devops',
  'em',
  'founding_eng',
  'tech_lead',
  'pm',
  'designer',
  'data_scientist',
] as const

const VALID_PRIMARY_GOALS = ['land_pm_adjacent', 'level_up_current', 'ship_better', 'explore'] as const
const VALID_PREP_TIMELINES = ['lt_1mo', '1_3mo', 'gt_3mo', 'no_timeline'] as const
const VALID_ROLE_CONTEXTS = ['engineer_pm_interview', 'engineer_on_job', 'both'] as const

const AnswerSchema = z.enum(['A', 'B', 'C', 'D'])

export const CalibrationSubmitSchema = z.object({
  role: z.enum(VALID_ONBOARDING_ROLES).optional(),
  answers: z.object({
    frame: AnswerSchema,
    list: AnswerSchema,
    optimize: AnswerSchema,
    win: AnswerSchema,
  }),
  // New personalization fields - populated when the onboarding profile step ran
  primary_goal: z.enum(VALID_PRIMARY_GOALS).optional(),
  prep_timeline: z.enum(VALID_PREP_TIMELINES).optional(),
  role_context: z.enum(VALID_ROLE_CONTEXTS).optional(),
  target_company: z.string().optional(),
  interview_date: z.string().optional(),
})

// Weakness-move → study-plan slug map.
// 'explore' goal always yields null (route to /explore/plans index instead).
const WEAKNESS_TO_PLAN_SLUG: Record<CalibrationMove, string> = {
  frame: 'frame-like-a-pm',
  list: 'the-list-move',
  optimize: 'optimize-under-pressure',
  win: 'win-the-room',
}

export function computePersonalisedPlanSlug(
  weaknessMove: CalibrationMove,
  primaryGoal?: string | null,
): string | null {
  if (primaryGoal === 'explore') return null
  return WEAKNESS_TO_PLAN_SLUG[weaknessMove] ?? null
}

export type CalibrationSubmitInput = z.infer<typeof CalibrationSubmitSchema>

interface BuildCalibrationPersistencePayloadInput {
  userId: string
  role?: UserRoleV2
  answers: CalibrationSubmitInput['answers']
  archetype: string
  archetypeDescription: string
  weaknessMove: CalibrationMove
  scores: CalibrationScores
  now: Date | string
}

export function buildCalibrationPersistencePayload({
  userId,
  role,
  answers,
  archetype,
  archetypeDescription,
  weaknessMove,
  scores,
  now,
}: BuildCalibrationPersistencePayloadInput) {
  const timestamp = typeof now === 'string' ? now : now.toISOString()

  return {
    profileUpdate: {
      ...(role ? { preferred_role: role } : {}),
      archetype,
      archetype_description: archetypeDescription,
      weakness_move: weaknessMove,
      calibration_scores: scores,
      onboarding_completed_at: timestamp,
      updated_at: timestamp,
    },
    onboardingResponseUpsert: {
      user_id: userId,
      ...(role ? { preferred_role: role } : {}),
      calibration_scores: scores,
      archetype,
      calibration_answers: [answers],
    },
    onboardingCompletedAt: timestamp,
  }
}
