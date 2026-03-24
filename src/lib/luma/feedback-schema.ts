// NOTE: This file requires 'zod' as a dependency.
// zod is not currently in package.json — run `npm install zod` before using this module.
import { z } from 'zod'

const FeedbackDimensionSchema = z.object({
  dimension: z.enum(['diagnostic_accuracy', 'metric_fluency', 'framing_precision', 'recommendation_strength']),
  score: z.number().min(0).max(10),
  commentary: z.string(),
  suggestions: z.array(z.string()),
})

const DetectedPatternSchema = z.object({
  pattern_id: z.string().regex(/^FP-\d{2}$/),
  pattern_name: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  question: z.string().optional(),
})

export const LumaFeedbackSchema = z.object({
  overall_score: z.number().min(0).max(100),
  dimensions: z.array(FeedbackDimensionSchema).length(4),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  detected_patterns: z.array(DetectedPatternSchema),
})

export type ValidatedLumaFeedback = z.infer<typeof LumaFeedbackSchema>

export function clampFeedbackScores(feedback: ValidatedLumaFeedback): ValidatedLumaFeedback {
  return {
    ...feedback,
    overall_score: Math.min(100, Math.max(0, feedback.overall_score)),
    dimensions: feedback.dimensions.map(d => ({
      ...d,
      score: Math.min(10, Math.max(0, d.score)),
    })),
  }
}
