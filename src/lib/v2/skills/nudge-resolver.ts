import type { FlowStep, RoleLens } from '@/lib/types'

export function resolveNudge(baseNudge: string | null, step: FlowStep, roleLens: RoleLens, reasoningMove?: string): string {
  const roleNudge = roleLens[`${step}_nudge` as keyof RoleLens] as string | null
  const parts: string[] = []
  if (reasoningMove) {
    parts.push(reasoningMove)
  }
  if (baseNudge) {
    parts.push(baseNudge)
  }
  if (roleNudge) {
    parts.push(`${roleLens.short_label} lens: ${roleNudge}`)
  }
  return parts.join('\n\n')
}
