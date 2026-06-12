/**
 * PostHog event-name constants and typed property shapes.
 *
 * Rules:
 * - Client events  → import { trackEvent } from '@/lib/posthog/client'
 * - Server events  → import { captureServerImmediate } from '@/lib/posthog/server'
 * - Always use these constants so names stay consistent across surfaces.
 * - Never let analytics throw into a request path — the wrappers handle that.
 */

// ─── Auth / Onboarding ────────────────────────────────────────────────────────

/** Fired (server) immediately after a new user is created via email/password. */
export const EVENT_USER_SIGNED_UP = 'user_signed_up'
export interface UserSignedUpProps {
  method: 'email_password' | 'oauth'
  provider?: string
}

/**
 * Fired (server) when an auth-funnel request fails for any reason the user
 * sees an error for. `code` carries the internal apiError code (e.g.
 * 'turnstile_failed', 'rate_limited', 'signup_failed') so a success-rate
 * collapse is alertable even while MASK_API_ERRORS hides messages from users.
 */
export const EVENT_AUTH_SIGNUP_FAILED = 'auth_signup_failed'
export const EVENT_AUTH_MAGIC_LINK_FAILED = 'auth_magic_link_failed'
export const EVENT_AUTH_PASSWORD_RESET_FAILED = 'auth_password_reset_failed'
export interface AuthFailureProps {
  code: string
  status: number
}

/** Fired (client) when the user advances a step of the onboarding flow. */
export const EVENT_ONBOARDING_STEP = 'onboarding_step'
export interface OnboardingStepProps {
  step: string        // e.g. 'role', 'context', 'goal', 'timeline', 'company'
  step_index: number
}

/** Fired (server) when calibration completes and the score is written. */
export const EVENT_CALIBRATION_COMPLETED = 'calibration_completed'
export interface CalibrationCompletedProps {
  weakest_move: string
  total_score: number
}

// ─── Challenges ───────────────────────────────────────────────────────────────

/**
 * Fired (client) when an attempt is created and the workspace mounts.
 * Already wired in FlowWorkspace — standardise via this constant.
 */
export const EVENT_CHALLENGE_STARTED = 'challenge_started'
export interface ChallengeStartedProps {
  challenge_id: string
  attempt_id: string
  challenge_type?: string
  from_domain?: string
  from_plan?: string
}

/** Fired (client) when the user advances to the next FLOW step. */
export const EVENT_CHALLENGE_STEP_ADVANCED = 'challenge_step_advanced'
export interface ChallengeStepAdvancedProps {
  challenge_id: string
  attempt_id: string
  step: string   // 'frame' | 'list' | 'optimize' | 'win'
}

/**
 * Fired (server) when a challenge attempt is graded and marked completed.
 * Already wired in /api/challenges/[id]/complete — standardise via this constant.
 */
export const EVENT_CHALLENGE_COMPLETED = 'challenge_completed'
export interface ChallengeCompletedProps {
  challenge_id: string
  grade_label: string
  total_score: number
  max_score: number
  xp_awarded: number
  from_plan?: string | null
}

// ─── Autopsy / Article reader ─────────────────────────────────────────────────

/** Fired (client) once on mount when the reader renders. Required for the article-resume cron. */
export const EVENT_AUTOPSY_OPENED = 'autopsy_opened'
export interface AutopsyOpenedProps {
  slug: string
}

/**
 * Fired (client) as the reader scrolls into each stage section.
 * Required for the article-resume cron — must include sectionIndex and pct.
 */
export const EVENT_AUTOPSY_SECTION_VIEWED = 'autopsy_section_viewed'
export interface AutopsySectionViewedProps {
  slug: string
  section_index: number
  pct: number          // scroll % at the time the section entered the viewport
}

/** Fired (client) when the user reaches the closing section (100% of article). */
export const EVENT_AUTOPSY_FINISHED = 'autopsy_finished'
export interface AutopsyFinishedProps {
  slug: string
}

// ─── Pricing / Upgrade funnel ─────────────────────────────────────────────────

/** Fired (client) when the pricing page mounts. */
export const EVENT_PRICING_VIEWED = 'pricing_viewed'
// No required extra props — page metadata is enough.

/** Fired (client) when the user clicks "Start trial" / "Get Analytics" and the fetch starts. */
export const EVENT_CHECKOUT_STARTED = 'checkout_started'
export interface CheckoutStartedProps {
  plan: string          // 'monthly' | 'annual' | 'analytics_monthly' | 'analytics_annual'
}

/** Fired (server, Stripe webhook) when a checkout.session.completed event confirms a new subscription. */
export const EVENT_UPGRADED = 'upgraded'
export interface UpgradedProps {
  plan: string
  interval: 'month' | 'year'
  currency: string
}

// ─── Study Plans ──────────────────────────────────────────────────────────────

/** Fired (client) when the study plans list page mounts. */
export const EVENT_STUDY_PLAN_VIEWED = 'study_plan_viewed'
export interface StudyPlanViewedProps {
  plan_slug: string
}

/** Fired (client) when the user enrolls in a study plan from the detail page. */
export const EVENT_STUDY_PLAN_ENROLLED = 'study_plan_enrolled'
export interface StudyPlanEnrolledProps {
  plan_slug: string
}

/** Fired (client) when the user opens a chapter row in the study plan detail. */
export const EVENT_STUDY_PLAN_CHAPTER_OPENED = 'study_plan_chapter_opened'
export interface StudyPlanChapterOpenedProps {
  plan_slug: string
  chapter_index: number
  pct: number           // user's current progress % in the plan
}

/** Fired (client) when all chapters/challenges in a plan are completed. */
export const EVENT_STUDY_PLAN_COMPLETED = 'study_plan_completed'
export interface StudyPlanCompletedProps {
  plan_slug: string
}

// ─── Domains ─────────────────────────────────────────────────────────────────

/** Fired (client) when a domain detail page mounts. */
export const EVENT_DOMAIN_VIEWED = 'domain_viewed'
export interface DomainViewedProps {
  slug: string
  theme?: string | null
}

/** Fired (client) when the user clicks a challenge from the domain detail page. */
export const EVENT_DOMAIN_CHALLENGE_STARTED = 'domain_challenge_started_from_domain'
export interface DomainChallengeStartedProps {
  domain_slug: string
  challenge_id: string
}

// ─── Live Interviews ──────────────────────────────────────────────────────────

/** Fired (client) when the interview phase transitions to 'active'. */
export const EVENT_INTERVIEW_STARTED = 'interview_started'
export interface InterviewStartedProps {
  session_id: string
  discipline?: string | null
  mode?: string | null   // 'voice' | 'text' etc.
}

/** Fired (client) when the interview phase changes. */
export const EVENT_INTERVIEW_PHASE_CHANGED = 'interview_phase_changed'
export interface InterviewPhaseChangedProps {
  session_id: string
  phase: string          // 'loading' | 'ready' | 'active' | 'ended'
}

/** Fired (client) when the interview ends cleanly via the end button. */
export const EVENT_INTERVIEW_COMPLETED = 'interview_completed'
export interface InterviewCompletedProps {
  session_id: string
  mode?: string | null
  duration_sec?: number
  discipline?: string | null
}

/** Fired (client) on unmount / router push away while an interview is still active. */
export const EVENT_INTERVIEW_ABANDONED = 'interview_abandoned'
export interface InterviewAbandonedProps {
  session_id: string
  mode?: string | null
  duration_sec: number
  discipline?: string | null
}

// ─── Learn Chapters ───────────────────────────────────────────────────────────

/** Fired (client) when the user opens / switches to a chapter in the learn module view. */
export const EVENT_CHAPTER_OPENED = 'chapter_opened'
export interface ChapterOpenedProps {
  module_slug: string
  chapter_slug: string
  chapter_index?: number
}

/** Fired (client) when the user marks a chapter as complete (or it auto-completes). */
export const EVENT_CHAPTER_COMPLETED = 'chapter_completed'
export interface ChapterCompletedProps {
  module_slug: string
  chapter_slug: string
}
