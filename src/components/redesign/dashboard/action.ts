import type { ResumeOrStartAction } from '@/components/dashboard/cards/resume-or-start'
import { challengePath } from '@/lib/challenges/challengeNumber'

interface ResumeChallenge {
  id: string
  slug?: string | null
  display_number?: number | null
  challenge_type?: string | null
}

export function canonicalResumeHref(challenge: ResumeChallenge) {
  return `${challengePath(challenge)}?resume=1`
}

export function resolveDashboardAction({
  resume,
  first,
  next,
  hasAnyAttempts,
}: {
  resume: ResumeOrStartAction | null
  first: ResumeOrStartAction | null
  next: ResumeOrStartAction | null
  hasAnyAttempts: boolean
}): ResumeOrStartAction | null {
  if (resume) return resume
  if (!hasAnyAttempts && first) return first
  return next
}

export function quickTakeForReturningUser<T>(quickTake: T | null, hasAnyAttempts: boolean): T | null {
  return hasAnyAttempts ? quickTake : null
}
