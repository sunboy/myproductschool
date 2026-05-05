import type { OnboardingState, OnboardingStep } from '@/lib/onboarding/state'

export async function getOnboardingState<TData = Record<string, unknown>>() {
  const response = await fetch('/api/onboarding/state', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) return null

  const body = await response.json() as { state?: OnboardingState<TData> | null }
  return body.state ?? null
}

export async function saveOnboardingState<TData extends Record<string, unknown>>(
  step: OnboardingStep,
  data: TData
) {
  const response = await fetch('/api/onboarding/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, data }),
  })

  if (!response.ok) return null

  const body = await response.json() as { state?: OnboardingState<TData> | null }
  return body.state ?? null
}

export async function clearOnboardingState() {
  await fetch('/api/onboarding/state', { method: 'DELETE' })
}
