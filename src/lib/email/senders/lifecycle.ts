import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { EMAIL_ART } from '@/lib/email/art'
import { configuredReplyTo } from '@/lib/email/client'
import {
  appUrl,
  formatDate,
  formatMoney,
  sendTransactionalEmail,
  type BaseTransactionalInput,
} from '@/lib/email/send-core'

// Lifecycle / conversion senders (tier a: full long-form treatment).

export interface WelcomeInput extends Omit<BaseTransactionalInput, 'dedupeKey'> {
  userId: string
}

export interface StreakReminderInput extends BaseTransactionalInput {
  streakDays: number
  url?: string | null
}

export interface WeeklyDigestInput extends BaseTransactionalInput {
  challengesCompleted: number
  xpEarned: number
  strongestCompetency?: string | null
  weakestCompetency?: string | null
  recommendationCopy?: string | null
  url?: string | null
}

export interface ChallengeCompletionInput extends BaseTransactionalInput {
  challengeTitle: string
  scoreLabel?: string | null
  xpEarned?: number | null
  url?: string | null
}

export interface ResumeChallengeInput extends BaseTransactionalInput {
  challengeTitle: string
  currentStep?: string | null
  resumeUrl: string
}

export interface UpgradeNudgeInput extends BaseTransactionalInput {
  url?: string | null
}

export interface ResumeArticleInput extends BaseTransactionalInput {
  articleTitle: string
  articleUrl: string
}

export interface PromotionInput extends BaseTransactionalInput {
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  valueBullets?: string[] | null
  heroImageUrl?: string | null
  eyebrow?: string | null
}

export interface LeadMagnetUnlockInput extends BaseTransactionalInput {
  /** Magnet slug, e.g. 'failure-mode'. Drives the dedupe key + subject line. */
  sourceSlug: string
  subject: string
  eyebrow: string
  heading: string
  body: string
  /** Extra paragraphs after `body` — the value-dense part of the email. */
  bodyParagraphs?: string[] | null
  ctaLabel: string
  ctaUrl: string
  valueBullets?: string[] | null
  heroImageUrl?: string | null
  heroAlt?: string | null
}

export interface PaidInsightInput extends BaseTransactionalInput {
  strongestCompetency?: string | null
  strongestLabel?: string | null
  focusCompetency?: string | null
  focusLabel?: string | null
  recentWins?: string[] | null
  url?: string | null
}

export interface ActivationDripInput extends BaseTransactionalInput {
  url?: string | null
}

export function sendWelcomeEmail(admin: SupabaseClient, input: WelcomeInput) {
  const greeting = input.name ? `Welcome, ${input.name}.` : 'Welcome to HackProduct.'
  return sendTransactionalEmail(admin, {
    ...input,
    dedupeKey: `welcome:${input.userId}`,
    kind: 'welcome',
    from: 'HackProduct <founders@hackproduct.com>',
    subject: 'Welcome to HackProduct',
    eyebrow: "You're in",
    heading: greeting,
    heroImageUrl: EMAIL_ART['hatch-wave'],
    heroAlt: 'Hatch, your HackProduct coach, waving hello',
    body: 'HackProduct is where you practice the kinds of product and judgment questions that come up in interviews and on the job. You work through a real decision, write your answer, and Hatch, your coach, reviews it and shows you what a stronger answer looks like. Try one and see where you stand.',
    valueBullets: [
      'Work through real product decisions from companies you already know',
      'Get specific feedback on your answer, not a generic score',
      'See how experienced people break down the same problem',
    ],
    ctaLabel: 'Try your first one',
    ctaUrl: appUrl('/challenges'),
    secondaryCta: { label: 'See how it works', url: appUrl('/flow') },
  })
}

export function sendStreakReminderEmail(admin: SupabaseClient, input: StreakReminderInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'streak_reminder',
    subject: 'Keep your HackProduct streak alive',
    eyebrow: 'Practice streak',
    heading: `${input.streakDays}-day streak in progress.`,
    body: 'One focused practice session keeps the streak moving.',
    ctaLabel: 'Practice now',
    ctaUrl: input.url ?? appUrl('/challenges'),
  })
}

export function sendWeeklyDigestEmail(admin: SupabaseClient, input: WeeklyDigestInput) {
  const detailParts = [
    `${input.challengesCompleted} challenges completed`,
    `${input.xpEarned} XP earned`,
    input.strongestCompetency ? `Strongest area: ${input.strongestCompetency}` : null,
    input.weakestCompetency ? `Focus area: ${input.weakestCompetency}` : null,
  ].filter(Boolean)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'weekly_digest',
    subject: 'Your HackProduct weekly digest',
    eyebrow: 'Weekly digest',
    heading: 'Your practice summary is ready.',
    body: input.recommendationCopy ?? 'Review last week, then pick the next practice move.',
    detail: detailParts.join(' | '),
    ctaLabel: 'Open dashboard',
    ctaUrl: input.url ?? appUrl('/dashboard'),
    aiDynamic: Boolean(input.recommendationCopy),
  })
}

export function sendChallengeCompletionEmail(admin: SupabaseClient, input: ChallengeCompletionInput) {
  const detailParts = [
    input.scoreLabel ? `Score: ${input.scoreLabel}` : null,
    input.xpEarned != null ? `${input.xpEarned} XP earned` : null,
  ].filter(Boolean)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'challenge_completion',
    subject: 'Challenge complete',
    eyebrow: 'Practice complete',
    heading: input.challengeTitle,
    body: 'Your feedback is ready in HackProduct.',
    detail: detailParts.join(' | ') || null,
    ctaLabel: 'View feedback',
    ctaUrl: input.url ?? appUrl('/dashboard'),
  })
}

export function sendResumeChallengeEmail(admin: SupabaseClient, input: ResumeChallengeInput) {
  const stepNote = input.currentStep
    ? `You were on the ${input.currentStep} part of ${input.challengeTitle}. `
    : `You started ${input.challengeTitle} but did not finish it. `
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'resume_challenge',
    subject: `Pick up where you left off: ${input.challengeTitle}`,
    eyebrow: 'Still in progress',
    heading: 'Pick up where you left off',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch pointing back to your unfinished work',
    body: `${stepNote}It takes a few minutes to finish, and Hatch will review your answer the moment you are done.`,
    ctaLabel: 'Continue',
    ctaUrl: input.resumeUrl,
  })
}

export function sendUpgradeNudgeEmail(admin: SupabaseClient, input: UpgradeNudgeInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'upgrade_nudge',
    subject: 'Get more out of HackProduct',
    eyebrow: 'More practice, more feedback',
    heading: 'Ready for more?',
    heroImageUrl: EMAIL_ART['hatch-unlock'],
    heroAlt: 'Hatch unlocking more practice',
    body: 'You have been getting through the free practice. Pro opens up a lot more of it, plus the parts people find most useful when they are preparing seriously.',
    valueBullets: [
      'Practice 80 questions a month instead of 3',
      'Run full live interview sessions with spoken feedback',
      'See your strengths and gaps across everything you have done',
      'Read 40+ deep breakdowns of real product decisions',
    ],
    ctaLabel: 'See Pro',
    ctaUrl: input.url ?? appUrl('/pricing'),
  })
}

export function sendResumeArticleEmail(admin: SupabaseClient, input: ResumeArticleInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'resume_article',
    subject: `You were partway through ${input.articleTitle}`,
    eyebrow: 'Saved for you',
    heading: `Finish reading ${input.articleTitle}`,
    heroImageUrl: EMAIL_ART['hatch-read'],
    heroAlt: 'Hatch reading',
    body: 'You started this one but did not get to the end. The most useful part, what the team got right and wrong and why, is in the back half. Here is where you left off.',
    ctaLabel: 'Keep reading',
    ctaUrl: input.articleUrl,
  })
}

export function sendPromotionEmail(admin: SupabaseClient, input: PromotionInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'promotion',
    subject: input.heading,
    eyebrow: input.eyebrow ?? 'News from HackProduct',
    heading: input.heading,
    heroImageUrl: input.heroImageUrl ?? EMAIL_ART['hatch-wave'],
    heroAlt: 'Hatch',
    body: input.body,
    valueBullets: input.valueBullets ?? null,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
  })
}

export function sendLeadMagnetUnlockEmail(admin: SupabaseClient, input: LeadMagnetUnlockInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    dedupeKey: input.dedupeKey || `lead_magnet_unlock:${input.sourceSlug}:${input.to ?? ''}`,
    kind: 'lead_magnet_unlock',
    subject: input.subject,
    eyebrow: input.eyebrow,
    heading: input.heading,
    heroImageUrl: input.heroImageUrl ?? EMAIL_ART['hatch-unlock'],
    heroAlt: input.heroAlt ?? 'Hatch unlocking your result',
    body: input.body,
    bodyParagraphs: input.bodyParagraphs ?? null,
    valueBullets: input.valueBullets ?? null,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    audienceNote: 'You are receiving this because you requested your result at hackproduct.com.',
  })
}

export function sendPaidInsightEmail(admin: SupabaseClient, input: PaidInsightInput) {
  const detailParts = [
    input.strongestLabel ? `Strongest right now: ${input.strongestLabel}` : null,
    input.focusLabel ? `Worth a look next: ${input.focusLabel}` : null,
  ].filter(Boolean)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'paid_insight',
    tone: 'celebratory',
    subject: 'Your week on HackProduct',
    eyebrow: 'Your progress',
    heading: 'Here is what stood out this week',
    heroImageUrl: EMAIL_ART['hatch-insight'],
    heroAlt: 'Hatch with a chart',
    body: 'A quick read on where your answers are getting sharper and where a little more practice would pay off.',
    detail: detailParts.length > 0 ? detailParts.join(' | ') : null,
    valueBullets: input.recentWins && input.recentWins.length > 0 ? input.recentWins : null,
    ctaLabel: 'See your progress',
    ctaUrl: input.url ?? appUrl('/progress'),
  })
}

export function sendActivationDay1Email(admin: SupabaseClient, input: ActivationDripInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'activation_day1',
    subject: 'Your first mock interview takes about 4 minutes',
    eyebrow: 'Still waiting on you',
    heading: 'One rep is all it takes to see how this works',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch pointing toward your first challenge',
    body: 'You signed up but have not run a single interview or challenge yet. The first one takes about 4 minutes, and Hatch grades it the moment you submit so you can see exactly what a real evaluator would flag.',
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}

export function sendActivationDay3Email(admin: SupabaseClient, input: ActivationDripInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'activation_day3',
    subject: 'A real product decision, broken down',
    eyebrow: 'Worth four minutes',
    heading: 'See how a real product call gets graded',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch gesturing toward unfinished work',
    body: 'Most people judge a tool like this by trying it once, not by reading about it. HackProduct has autopsies of real product decisions, plus short interview reps that Hatch grades against the same criteria a real panel would use. Pick one and see where you land.',
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}

export function sendActivationDay7Email(admin: SupabaseClient, input: ActivationDripInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'activation_day7',
    subject: 'Last nudge: your account is set up and waiting',
    eyebrow: 'Last check-in',
    heading: 'Your account is ready whenever you are',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch waiting by an unfinished challenge',
    body: 'A week in and the account is still sitting untouched. No pressure, this is the last email in this series. If product interviews or sharpening product thinking is still something you care about, the first rep takes about 4 minutes and Hatch will tell you exactly where you stand.',
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}
