export type Plan = 'free' | 'pro'
export type Role = 'user' | 'admin'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ChallengeMode = 'spotlight' | 'workshop' | 'live' | 'solo'
export type FeedbackDimension = 'diagnostic_accuracy' | 'metric_fluency' | 'framing_precision' | 'recommendation_strength'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  plan: Plan
  role: Role
  streak_days: number
  xp_total: number
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Domain {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string | null
  order_index: number
  is_published: boolean
  created_at: string
}

export interface Concept {
  id: string
  domain_id: string
  title: string
  definition: string
  example: string | null
  difficulty: Difficulty
  tags: string[]
  order_index: number
  created_at: string
}

export interface Flashcard {
  id: string
  concept_id: string
  front: string
  back: string
  hint: string | null
  created_at: string
}

export interface ChallengePrompt {
  id: string
  domain_id: string
  title: string
  prompt_text: string
  difficulty: Difficulty
  tags: string[]
  estimated_minutes: number
  is_published: boolean
  created_at: string
}

export interface ChallengeAttempt {
  id: string
  user_id: string
  prompt_id: string
  mode: ChallengeMode
  response_text: string | null
  started_at: string
  submitted_at: string | null
  score: number | null
  feedback_json: LumaFeedbackItem[] | null
  created_at: string
}

export interface LumaFeedbackItem {
  dimension: FeedbackDimension
  score: number
  commentary: string
  suggestions: string[]
}

export interface ModelAnswer {
  id: string
  prompt_id: string
  answer_text: string
  key_points: string[]
  created_by: string | null
  created_at: string
}

export interface VocabularyProgress {
  id: string
  user_id: string
  concept_id: string
  confidence: number
  next_review_at: string
  review_count: number
  created_at: string
  updated_at: string
}

export interface CompanyProfile {
  id: string
  slug: string
  name: string
  industry: string | null
  stage: 'early' | 'growth' | 'enterprise' | null
  product_focus: string | null
  interview_style: string | null
  notes: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: Plan
  status: SubscriptionStatus
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// Enriched types for UI
export interface DomainWithProgress extends Domain {
  concept_count: number
  challenge_count: number
  completed_challenges: number
  progress_percentage: number
}

export interface ConceptWithProgress extends Concept {
  vocabulary_progress: VocabularyProgress | null
  domain: Pick<Domain, 'slug' | 'title'>
}

export interface ChallengeWithDomain extends ChallengePrompt {
  domain: Pick<Domain, 'slug' | 'title' | 'icon'>
  attempt_count: number
  best_score: number | null
  is_completed: boolean
}

// ── Failure Pattern Detection ─────────────────────────────

export interface FailurePattern {
  pattern_id: string  // 'FP-01' through 'FP-14'
  pattern_name: string
  confidence: number  // 0-1
  evidence: string
  question?: string
}

export interface UserFailurePattern {
  id: string
  user_id: string
  attempt_id: string | null
  pattern_id: string
  pattern_name: string
  confidence: number
  evidence: string
  question: string | null
  created_at: string
}

export interface PatternSummary {
  user_id: string
  pattern_id: string
  pattern_name: string
  occurrence_count: number
  last_seen: string
  avg_confidence: number
}

export interface Prescription {
  type: 'prescription' | 'onboarding' | 'explore'
  primary_pattern?: {
    pattern_id: string
    pattern_name: string
    occurrence_count: number
    last_seen: string
  }
  prescription?: {
    mode: string
    challenge_slug: string
    challenge_title: string
    reason: string
  }
  secondary_patterns?: Array<{
    pattern_id: string
    pattern_name: string
    occurrence_count: number
  }>
  confidence_calibration?: {
    avg_mismatch: number
    tendency: 'overconfident' | 'underconfident' | 'calibrated'
    detail: string
  }
  message?: string  // for onboarding/explore fallback types
}
