import type { FlowStep, RoleLens } from '@/lib/types'

export function resolveNudge(baseNudge: string | null, step: FlowStep, roleLens: RoleLens): string {
  const roleNudge = roleLens[`${step}_nudge` as keyof RoleLens] as string | null
  if (!baseNudge && !roleNudge) return ''
  if (!roleNudge) return baseNudge ?? ''
  if (!baseNudge) return roleNudge
  return `${baseNudge}\n\n💡 As a ${roleLens.short_label}: ${roleNudge}`
}
