export type Plan = 'free' | 'pro'
export type Role = 'user' | 'admin'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ChallengeMode = 'solo' | 'live' | 'guided' | 'freeform' | 'quick-take'
export type FeedbackDimension = 'diagnostic_accuracy' | 'metric_fluency' | 'framing_precision' | 'recommendation_strength'

export const DIMENSION_LABELS: Record<FeedbackDimension, string> = {
  diagnostic_accuracy: 'Diagnostic Accuracy',
  metric_fluency: 'Metric Fluency',
  framing_precision: 'Framing Precision',
  recommendation_strength: 'Recommendation Strength',
}

export const FLOW_MOVE_LABELS: Record<FlowMove, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export type UserRole = 'SWE' | 'Data Eng' | 'ML Eng' | 'DevOps' | 'EM' | 'Founding Eng'
export type FlowMove = 'frame' | 'list' | 'optimize' | 'win'
export type Paradigm = 'traditional' | 'ai-assisted' | 'agentic' | 'ai-native'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  plan: Plan
  role: Role
  streak_days: number
  xp_total: number
  onboarding_completed_at: string | null
  preferred_role: UserRole | null
  archetype: string | null
  archetype_description: string | null
  streak_shield_count: number
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
  sub_questions?: string[]
  paradigm?: string | null
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

export interface ChallengeDiscussion {
  id: string
  challenge_id: string
  user_id: string
  content: string
  is_expert_pick: boolean
  upvote_count: number
  created_at: string
  username?: string
  reply_count?: number
  upvoted_by?: string[]
}

export interface AnalyticsSummary {
  productiq_score: number
  productiq_delta: number
  streak_days: number
  total_attempts: number
  dimensions: Record<FeedbackDimension, { score: number; delta: number; sparkline: number[] }>
  weekly_activity: number[]
  recent_attempts: RecentAttempt[]
}

export interface RecentAttempt {
  id: string
  challenge_title: string
  domain: string
  score: number
  status: 'completed' | 'in_progress'
  created_at: string
  trend: number[]
}

export interface Framework {
  id: string
  name: string
  purpose: string
  steps: string[]
  when_to_use: string
  domain?: string
}

export interface GlossaryTerm {
  term: string
  fullName?: string
  definition: string
  conceptId?: string
}

export interface WeeklyDigest {
  period: string
  challenges_completed: number
  patterns_resolved: string[]
  top_delta: { dimension: string; change: number }
  insight: string
}

export interface ProfileData {
  name: string
  email: string
  role: string
  tier: 'free' | 'pro'
  member_since: string
  avatar_initials: string
}

/* ── v2 FLOW Move Types ───────────────────────────────────── */

export interface MoveLevel {
  id: string
  user_id: string
  move: FlowMove
  level: number
  progress_pct: number
  xp: number
  created_at: string
  updated_at: string
}

export interface MoveLevelHistory {
  id: string
  user_id: string
  move: FlowMove
  xp_delta: number
  source: 'challenge' | 'quick-take' | 'calibration' | 'cohort'
  source_id: string | null
  created_at: string
}

/* ── v2 Study Plans ───────────────────────────────────────── */

export interface StudyPlan {
  id: string
  title: string
  slug: string
  description: string | null
  move_tag: FlowMove | null
  role_tags: string[]
  challenge_count: number
  estimated_hours: number
  is_published: boolean
  created_at: string
}

export interface StudyPlanChapterChallenge {
  id: string
  title: string
  difficulty: string
  paradigm?: string | null
}

export interface StudyPlanChapter {
  id: string
  plan_id: string
  title: string
  order_index: number
  challenge_ids: string[]
  challenges?: StudyPlanChapterChallenge[]
  created_at: string
}

export interface UserStudyPlan {
  id: string
  user_id: string
  plan_id: string
  started_at: string
  progress_pct: number
  is_active: boolean
  completed_challenges: string[]
}

/* ── v2 Cohort ────────────────────────────────────────────── */

export interface CohortChallenge {
  id: string
  title: string
  prompt_text: string
  difficulty: Difficulty
  move_tag: FlowMove | null
  week_start: string
  week_end: string
  is_active: boolean
  created_at: string
}

export interface CohortSubmission {
  id: string
  user_id: string
  cohort_challenge_id: string
  response_text: string
  score: number | null
  feedback_json: Record<string, unknown> | null
  submitted_at: string
}

/* ── v2 Settings ──────────────────────────────────────────── */

export interface UserSettings {
  id: string
  user_id: string
  notifications: {
    weekly_summary: boolean
    streak_reminder: boolean
    new_challenges: boolean
    cohort_updates: boolean
  }
  daily_goal_count: number
  preferred_role: UserRole | null
  created_at: string
  updated_at: string
}

/* ── v2 Extended Challenge Prompt ─────────────────────────── */

export interface ChallengePromptV2 extends ChallengePrompt {
  paradigm: Paradigm | null
  move_tags: FlowMove[]
  is_premium: boolean
  role_tags: string[]
}

/* ── v2 Onboarding Calibration ────────────────────────────── */

export interface CalibrationScores {
  frame: number
  list: number
  optimize: number
  win: number
}

export interface CalibrationResults {
  scores: CalibrationScores
  archetype: string
  archetype_description: string
  starting_levels: Record<FlowMove, number>
  percentile: number
}

/* ── v2 Share Card ────────────────────────────────────────── */

export interface ShareCardData {
  score: number
  challenge_title: string
  move: FlowMove
  user_display_name: string
  xp_earned: number
  percentile: number
  share_url: string
}

/* ── v2 Career Benchmark ──────────────────────────────────── */

export interface CareerBenchmark {
  levels: { title: string; percentile: number }[]
  user_level: string
}

/* ── v2 Challenge Steps ───────────────────────────────────── */

export interface ChallengeStep {
  id: string
  challenge_id: string
  move: FlowMove
  step_index: number
  prompt: string
  hint: string | null
  recommended: string | null
  pattern_title: string | null
  pattern_body: string | null
  trap_ids: string[]
  scaffold_options: string[]
}

/* ── v2 Quick Takes ───────────────────────────────────────── */

export interface QuickTake {
  id: string
  scenario_text: string
  paradigm: Paradigm
  move: FlowMove
  active_date: string
}

/* ── v2 Thinking Traps ────────────────────────────────────── */

export interface ThinkingTrap {
  id: string
  name: string
  description: string
  fix_suggestion: string
}

/* ── v2 Session Events ────────────────────────────────────── */

export interface SessionEvent {
  id: string
  user_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}
