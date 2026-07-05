// Product-facing names for the coaching register. The internal enum never
// reaches the user (Hatch opacity); these are the words the product says.
import type { GuidanceLevel } from '@/lib/adaptive/guidance'

export const REGISTER_LABELS: Record<GuidanceLevel, string> = {
  scaffolded: 'Hands-on',
  guided: 'Balanced',
  open: 'Peer-level',
}

export const REGISTER_TOOLTIPS: Record<GuidanceLevel, string> = {
  scaffolded: 'Hatch explains each move and names the next step while you build your footing.',
  guided: 'Hatch coaches with questions first and steps in when you are stuck.',
  open: 'Hatch reviews like a peer: terse, direct, and focused on rigor over basics.',
}

export interface AdaptiveSummary {
  guidance: GuidanceLevel
  injected: Array<{ id: string; kind: string; afterStepId: string | null; reason: string }>
  adjustments: Array<{ from: string; to: string; trigger: string; atStepId: string | null }>
}
