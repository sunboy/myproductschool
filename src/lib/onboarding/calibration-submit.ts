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

// Personalised study plan mapping. The 4 weakness-move plans (frame-like-a-pm,
// the-list-move, optimize-under-pressure, win-the-room) were retired and
// unpublished, so personalization keys off the onboarding role/goal/timeline
// and maps only to published plans that have real chapters. The submit route
// still verifies the slug against study_plans before returning it, so a future
// retirement degrades to a hidden CTA instead of a 404.
type OnboardingRole = (typeof VALID_ONBOARDING_ROLES)[number]

const ROLE_TO_PLAN_SLUG: Record<OnboardingRole, string> = {
  swe: 'staff-engineer-path',
  data_eng: 'data-eng-to-product',
  ml_eng: 'ai-product-fluency',
  devops: 'devops-to-product',
  em: 'em-product-leadership',
  founding_eng: 'founding-engineer',
  tech_lead: 'staff-engineer-path',
  pm: 'ai-product-fluency',
  designer: 'ai-product-fluency',
  data_scientist: 'data-eng-to-product',
}

export function computePersonalisedPlanSlug({
  role,
  primaryGoal,
  prepTimeline,
}: {
  role?: string | null
  primaryGoal?: string | null
  prepTimeline?: string | null
}): string | null {
  if (primaryGoal === 'explore') return null
  // An interview inside a month outranks role: prep urgency wins.
  if (prepTimeline === 'lt_1mo') return '7-day-interview-prep'
  const rolePlan =
    role && role in ROLE_TO_PLAN_SLUG ? ROLE_TO_PLAN_SLUG[role as OnboardingRole] : null
  // PMs and unknown roles chasing a PM-adjacent move get the interview loop.
  if (primaryGoal === 'land_pm_adjacent' && (!rolePlan || role === 'pm')) {
    return '7-day-interview-prep'
  }
  return rolePlan ?? 'ai-product-fluency'
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
