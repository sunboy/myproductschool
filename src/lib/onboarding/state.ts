import { z } from 'zod'

export const ONBOARDING_STEPS = [
  '/onboarding/welcome',
  '/onboarding/role',
  '/calibration',
  '/onboarding/results',
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]

export const OnboardingStateSchema = z.object({
  step: z.enum(ONBOARDING_STEPS),
  data: z.record(z.string(), z.unknown()).default({}),
})

export interface OnboardingState<TData = Record<string, unknown>> {
  step: OnboardingStep
  data: TData
  updated_at: string
}
