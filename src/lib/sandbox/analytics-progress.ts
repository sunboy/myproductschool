import { z } from 'zod'

// Learner-authored evidence for resuming work, never an authoritative score.
export const analyticsProgressSchema = z.object({
  findings: z.array(z.object({ id: z.string().min(1).max(200), text: z.string().max(8000), verdict: z.enum(['pass', 'partial', 'retry']) })).max(100),
  activeStepId: z.string().max(200).nullable(),
})
export type AnalyticsProgress = z.infer<typeof analyticsProgressSchema>

export function readAnalyticsProgress(artifact: unknown): AnalyticsProgress | null {
  if (!artifact || typeof artifact !== 'object') return null
  const adaptive = (artifact as { adaptive?: { progress?: unknown } }).adaptive
  const result = analyticsProgressSchema.safeParse(adaptive?.progress)
  return result.success ? result.data : null
}
