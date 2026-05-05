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

export const HatchFeedbackSchema = z.object({
  overall_score: z.number().min(0).max(100),
  dimensions: z.array(FeedbackDimensionSchema).length(4),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  detected_patterns: z.array(DetectedPatternSchema),
})

export type ValidatedHatchFeedback = z.infer<typeof HatchFeedbackSchema>

export function clampFeedbackScores(feedback: ValidatedHatchFeedback): ValidatedHatchFeedback {
  return {
    ...feedback,
    overall_score: Math.min(100, Math.max(0, feedback.overall_score)),
    dimensions: feedback.dimensions.map(d => ({
      ...d,
      score: Math.min(10, Math.max(0, d.score)),
    })),
  }
}

// ── V2 Feedback Schema (FLOW-based, per-step criteria) ──────

const CriterionScoreSchema = z.object({
  criterion_id: z.string(),
  score: z.enum(['strong', 'partial', 'needs_work']),
  evidence: z.string(),
  coaching: z.string(),
})

const StepFeedbackSchema = z.object({
  step: z.enum(['frame', 'list', 'optimize', 'win']),
  criteria_scores: z.array(CriterionScoreSchema),
  weighted_score: z.number().min(0).max(1),
  competency_signal: z.object({
    primary: z.string(),
    signal: z.string(),
    framework_hint: z.string(),
  }),
  step_summary: z.string(),
})

const MentalModelBreakdownSchema = z.object({
  competency: z.string(),
  demonstrated: z.string(),
  missed: z.string(),
  score: z.number().min(0).max(100),
})

export const V2FeedbackSchema = z.object({
  overall_score: z.number().min(0).max(100),
  overall: z.string(),
  steps: z.array(StepFeedbackSchema),
  mental_models_breakdown: z.array(MentalModelBreakdownSchema),
  weakest_competency: z.string(),
  next_recommendation: z.string(),
  detected_patterns: z.array(DetectedPatternSchema),
})

export type ValidatedV2Feedback = z.infer<typeof V2FeedbackSchema>

export function clampV2FeedbackScores(feedback: ValidatedV2Feedback): ValidatedV2Feedback {
  return {
    ...feedback,
    overall_score: Math.min(100, Math.max(0, feedback.overall_score)),
    steps: feedback.steps.map(s => ({
      ...s,
      weighted_score: Math.min(1, Math.max(0, s.weighted_score)),
    })),
  }
}
