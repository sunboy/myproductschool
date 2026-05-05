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

const AnswerSchema = z.enum(['A', 'B', 'C', 'D'])

export const CalibrationSubmitSchema = z.object({
  role: z.enum(VALID_ONBOARDING_ROLES).optional(),
  answers: z.object({
    frame: AnswerSchema,
    list: AnswerSchema,
    optimize: AnswerSchema,
    win: AnswerSchema,
  }),
})

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
