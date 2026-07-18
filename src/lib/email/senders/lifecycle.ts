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
  /** XP multiplier from CLAUDE.md's formula: min(1 + streakDays*0.05, 1.5). Omit the stat/copy if not derivable. */
  multiplier?: number | null
  /** ISO timestamp for the streak reset (next midnight PT). Omit the deadline banner if not derivable. */
  resetAtIso?: string | null
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
  /** Completed challenges this month, when the cron already has the count in memory. */
  usageCount?: number | null
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
  previewText?: string | null
  bodyParagraphs?: string[] | null
  stats?: { label: string; value: string; sublabel?: string | null }[] | null
  deadline?: { label: string; at: string } | null
  contentCards?: { eyebrow: string; title: string; description: string; ctaLabel?: string | null; ctaUrl?: string | null }[] | null
  secondaryCta?: { label: string; url: string } | null
  repeatCta?: boolean
  tone?: 'default' | 'celebratory' | 'urgent'
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
    previewText: 'Your first rep takes about four minutes. Here is what the first week looks like.',
    eyebrow: "You're in",
    heading: greeting,
    heroImageUrl: EMAIL_ART['hatch-wave'],
    heroAlt: 'Hatch, your HackProduct coach, waving hello',
    body: 'HackProduct is where you practice the kinds of product and judgment questions that come up in interviews and on the job. You work through a real decision, write your answer, and Hatch, your coach, reviews it and shows you what a stronger answer looks like. Try one and see where you stand.',
    bodyParagraphs: [
      'Here is what the first week looks like if you stick with it: day one is one rep, just to see the format. Day two, read the feedback closely instead of just checking the score, that is where the actual learning happens. By day three the pattern in your answers starts to show, and that pattern is what Hatch is really tracking.',
    ],
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
  const streakDays = input.streakDays
  const multiplier = input.multiplier ?? null
  const hasDeadline = Boolean(input.resetAtIso && !Number.isNaN(new Date(input.resetAtIso).getTime()))

  const body = multiplier != null
    ? `You have practiced ${streakDays} days in a row. That is not a vanity number: the XP multiplier it earns is real, every challenge you complete right now pays out ${multiplier}x, and it took ${streakDays} days to build.`
    : `You have practiced ${streakDays} days in a row. That took real, consecutive days of showing up, and it resets to zero the moment you skip one.`

  const stats = multiplier != null
    ? [
        { label: 'Current streak', value: `${streakDays} days` },
        { label: 'XP multiplier', value: `${multiplier}x`, sublabel: 'Resets if the streak breaks' },
      ]
    : [{ label: 'Current streak', value: `${streakDays} days` }]

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'streak_reminder',
    subject: `Day ${streakDays}. Your streak resets at midnight.`,
    previewText: 'One four-minute session keeps the multiplier you built.',
    eyebrow: 'Practice streak',
    heading: `${streakDays} days of showing up.`,
    tone: 'default',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    body,
    bodyParagraphs: [
      'One session tonight keeps it. Skip today and the counter goes back to 1, and the multiplier goes with it. A Quick Take counts, and it takes about four minutes.',
    ],
    stats,
    deadline: hasDeadline
      ? { label: 'Streak resets at midnight PT tonight', at: input.resetAtIso as string }
      : null,
    ctaLabel: 'Keep the streak',
    ctaUrl: input.url ?? appUrl('/challenges'),
    secondaryCta: { label: 'Do a 4-minute Quick Take', url: appUrl('/dashboard#quick-take') },
  })
}

export function sendWeeklyDigestEmail(admin: SupabaseClient, input: WeeklyDigestInput) {
  const { challengesCompleted, xpEarned } = input
  const strongest = input.strongestCompetency
  const weakest = input.weakestCompetency

  if (challengesCompleted <= 0) {
    return sendTransactionalEmail(admin, {
      ...input,
      kind: 'weekly_digest',
      subject: 'Your week on HackProduct',
      previewText: 'A quiet week. Easy to fix with one rep.',
      eyebrow: 'Weekly digest',
      heading: 'A quiet week. Easy to fix.',
      tone: 'default',
      heroImageUrl: EMAIL_ART['hatch-insight'],
      body: 'No completed reps this week. That happens, and it is easy to fix: one challenge, worked through honestly, tells you more than a week of reading about product thinking would.',
      ctaLabel: 'Open your dashboard',
      ctaUrl: input.url ?? appUrl('/dashboard'),
    })
  }

  const stats = [
    { label: 'Challenges', value: String(challengesCompleted) },
    { label: 'XP earned', value: String(xpEarned) },
    ...(strongest ? [{ label: 'Strongest area', value: strongest }] : []),
    ...(weakest ? [{ label: 'Focus area', value: weakest }] : []),
  ]

  const body = strongest && weakest
    ? `You put in real reps this week. The numbers below are the summary, but the more useful part is the pattern: your ${strongest} answers are consistently landing, and ${weakest} is where the next gains are.`
    : `You put in real reps this week. ${challengesCompleted} challenge${challengesCompleted === 1 ? '' : 's'} completed, ${xpEarned} XP earned. Keep the pace and the pattern in your answers will start to show.`

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'weekly_digest',
    subject: `Your week: ${challengesCompleted} challenges, ${xpEarned} XP`,
    previewText: strongest && weakest
      ? `Your ${strongest} answers are landing. ${weakest} is where the next gains are.`
      : `${challengesCompleted} challenges completed, ${xpEarned} XP earned this week.`,
    eyebrow: 'Weekly digest',
    heading: 'Here is what your practice added up to.',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-insight'],
    body,
    stats,
    bodyParagraphs: [
      input.recommendationCopy
        ?? (weakest
          ? `Pick one ${weakest} challenge this week and treat it as the main event. One deliberate rep on a weak area moves your profile more than three on a strong one.`
          : 'Pick one challenge this week and treat it as the main event. One deliberate rep moves your profile more than several rushed ones.'),
    ],
    ctaLabel: 'Open your dashboard',
    ctaUrl: input.url ?? appUrl('/dashboard'),
    secondaryCta: weakest ? { label: `Practice ${weakest}`, url: appUrl('/challenges') } : null,
    repeatCta: true,
    aiDynamic: Boolean(input.recommendationCopy),
  })
}

export function sendChallengeCompletionEmail(admin: SupabaseClient, input: ChallengeCompletionInput) {
  const stats = [
    ...(input.scoreLabel ? [{ label: 'Score', value: input.scoreLabel }] : []),
    ...(input.xpEarned != null ? [{ label: 'XP earned', value: String(input.xpEarned) }] : []),
  ]

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'challenge_completion',
    subject: `Your feedback on ${input.challengeTitle} is ready`,
    previewText: 'What a stronger answer does differently, while the attempt is still fresh.',
    eyebrow: 'Practice complete',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    heroAlt: 'Hatch celebrating your finished attempt',
    heading: input.challengeTitle,
    body: `Hatch finished reviewing your answer on ${input.challengeTitle}, and there is something notable in it worth reading now, not later.`,
    bodyParagraphs: [
      'The feedback names what a stronger answer does differently, specifically, not a generic score. That comparison is most useful while the attempt is still fresh in your head.',
      'Read it while the attempt is fresh.',
    ],
    stats: stats.length > 0 ? stats : null,
    ctaLabel: 'Read your feedback',
    ctaUrl: input.url ?? appUrl('/dashboard'),
  })
}

export function sendResumeChallengeEmail(admin: SupabaseClient, input: ResumeChallengeInput) {
  const whereStopped = input.currentStep
    ? `You were on the ${input.currentStep} part of ${input.challengeTitle}.`
    : `You started ${input.challengeTitle} but did not finish it.`

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'resume_challenge',
    subject: `Pick up where you left off: ${input.challengeTitle}`,
    previewText: 'The thinking you already did is saved. It goes stale in your head, not in the app.',
    eyebrow: 'Still in progress',
    heading: 'Pick up where you left off',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch pointing back to your unfinished work',
    body: 'The thinking you already did on this one is saved. What is not saved is the context in your head, and that goes stale fast. Finishing now costs a few minutes; finishing next week costs re-reading everything first.',
    contentCards: [
      {
        eyebrow: 'Paused rep',
        title: input.challengeTitle,
        description: `${whereStopped} Finish it and Hatch reviews your answer the moment you submit, showing you exactly what a stronger answer does differently.`,
        ctaLabel: 'Continue',
        ctaUrl: input.resumeUrl,
      },
    ],
    ctaLabel: 'Continue',
    ctaUrl: input.resumeUrl,
  })
}

export function sendUpgradeNudgeEmail(admin: SupabaseClient, input: UpgradeNudgeInput) {
  const usageLine = input.usageCount != null && input.usageCount > 0
    ? `You have used your ${input.usageCount} free challenge${input.usageCount === 1 ? '' : 's'} this month. Pro removes that ceiling and adds the parts people find most useful when they are preparing seriously.`
    : 'You have been getting through the free practice. Pro opens up a lot more of it, plus the parts people find most useful when they are preparing seriously.'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'upgrade_nudge',
    subject: 'Get more out of HackProduct',
    previewText: 'More reps a month, live interview sessions, and a full picture of your gaps.',
    eyebrow: 'More practice, more feedback',
    heading: 'Ready for more?',
    heroImageUrl: EMAIL_ART['hatch-unlock'],
    heroAlt: 'Hatch unlocking more practice',
    body: usageLine,
    bodyParagraphs: [
      'Finish this rep, then decide. The upgrade is there when the free tier starts feeling like a ceiling, not before.',
    ],
    valueBullets: [
      'Practice 80 questions a month instead of 3',
      'Run full live interview sessions with spoken feedback',
      'See your strengths and gaps across everything you have done',
      'Read 40+ deep breakdowns of real product decisions',
    ],
    ctaLabel: 'See Pro',
    ctaUrl: input.url ?? appUrl('/pricing'),
    repeatCta: true,
  })
}

export function sendResumeArticleEmail(admin: SupabaseClient, input: ResumeArticleInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'resume_article',
    subject: `You were partway through ${input.articleTitle}`,
    previewText: 'The back half is where the team got it right or wrong, and why.',
    eyebrow: 'Saved for you',
    heading: `Finish reading ${input.articleTitle}`,
    heroImageUrl: EMAIL_ART['hatch-read'],
    heroAlt: 'Hatch reading',
    body: 'You started this one but did not get to the end. The most useful part, what the team got right and wrong and why, is in the back half.',
    bodyParagraphs: [
      'Here is where you left off.',
    ],
    contentCards: [
      {
        eyebrow: 'Saved for you',
        title: input.articleTitle,
        description: 'A real product decision, broken down: what the team chose, what they gave up, and whether it worked. The back half covers the tradeoff that made or broke it.',
        ctaLabel: 'Keep reading',
        ctaUrl: input.articleUrl,
      },
    ],
    ctaLabel: 'Keep reading',
    ctaUrl: input.articleUrl,
  })
}

export function sendPromotionEmail(admin: SupabaseClient, input: PromotionInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'promotion',
    subject: input.heading,
    previewText: input.previewText ?? null,
    eyebrow: input.eyebrow ?? 'News from HackProduct',
    heading: input.heading,
    heroImageUrl: input.heroImageUrl ?? EMAIL_ART['hatch-wave'],
    heroAlt: 'Hatch',
    body: input.body,
    bodyParagraphs: input.bodyParagraphs ?? null,
    valueBullets: input.valueBullets ?? null,
    stats: input.stats ?? null,
    deadline: input.deadline ?? null,
    contentCards: input.contentCards ?? null,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    secondaryCta: input.secondaryCta ?? null,
    repeatCta: input.repeatCta ?? undefined,
    tone: input.tone ?? undefined,
  })
}

export function sendLeadMagnetUnlockEmail(admin: SupabaseClient, input: LeadMagnetUnlockInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    dedupeKey: input.dedupeKey || `lead_magnet_unlock:${input.sourceSlug}:${input.to ?? ''}`,
    kind: 'lead_magnet_unlock',
    subject: input.subject,
    previewText: input.subject,
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
  const stats = [
    ...(input.strongestLabel ? [{ label: 'Strongest', value: input.strongestLabel }] : []),
    ...(input.focusLabel ? [{ label: 'Focus', value: input.focusLabel }] : []),
  ]

  const body = input.strongestLabel && input.focusLabel
    ? `A quick read on where your answers are getting sharper and where a little more practice would pay off. ${input.strongestLabel} is consistently strong right now; ${input.focusLabel} is worth a look next.`
    : 'A quick read on where your answers are getting sharper and where a little more practice would pay off.'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'paid_insight',
    tone: 'celebratory',
    subject: 'Your week on HackProduct',
    previewText: input.focusLabel ? `${input.focusLabel} is where the next gains are.` : 'A quick read on where your practice is landing.',
    eyebrow: 'Your progress',
    heading: 'Here is what stood out this week',
    heroImageUrl: EMAIL_ART['hatch-insight'],
    heroAlt: 'Hatch with a chart',
    body,
    stats: stats.length > 0 ? stats : null,
    bodyParagraphs: input.focusLabel
      ? [`Pick one ${input.focusLabel} challenge this week and work it all the way through before moving on. One finished rep on the focus area beats three half-finished ones anywhere else.`]
      : null,
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
    previewText: 'One rep is enough to see exactly what a real evaluator would flag.',
    eyebrow: 'Still waiting on you',
    heading: 'One rep is all it takes to see how this works',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch pointing toward your first challenge',
    body: 'You signed up but have not run a single interview or challenge yet. The first one takes about 4 minutes, and Hatch grades it the moment you submit so you can see exactly what a real evaluator would flag.',
    contentCards: [
      {
        eyebrow: 'First rep',
        title: 'Pick your first challenge',
        description: 'A real product decision, the kind that shows up in interviews and on the job. Write your answer, submit it, and Hatch reviews it immediately against the same criteria a real panel would use.',
        ctaLabel: 'Start your first interview',
        ctaUrl: appUrl('/first-run'),
      },
    ],
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}

export function sendActivationDay3Email(admin: SupabaseClient, input: ActivationDripInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'activation_day3',
    subject: 'A real product decision, broken down',
    previewText: 'The fastest way to judge this tool is to try one rep, not read about it.',
    eyebrow: 'Worth four minutes',
    heading: 'See how a real product call gets graded',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch gesturing toward unfinished work',
    body: 'Most people judge a tool like this by trying it once, not by reading about it. HackProduct has autopsies of real product decisions, plus short interview reps that Hatch grades against the same criteria a real panel would use.',
    contentCards: [
      {
        eyebrow: 'First rep',
        title: 'Pick one and see where you land',
        description: 'Same evaluation criteria a real interview panel uses. You get specific feedback on your answer, not a generic score, the moment you submit.',
        ctaLabel: 'Start your first interview',
        ctaUrl: appUrl('/first-run'),
      },
    ],
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}

export function sendActivationDay7Email(admin: SupabaseClient, input: ActivationDripInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'activation_day7',
    subject: 'Last nudge: your account is set up and waiting',
    previewText: 'This is the last email in this series.',
    eyebrow: 'Last check-in',
    heading: 'Your account is ready whenever you are',
    heroImageUrl: EMAIL_ART['hatch-point'],
    heroAlt: 'Hatch waiting by an unfinished challenge',
    body: 'A week in and the account is still sitting untouched. This is the last email in this series, no pressure.',
    bodyParagraphs: [
      'If product interviews or sharpening product thinking is still something you care about, the first rep takes about 4 minutes and Hatch will tell you exactly where you stand.',
    ],
    contentCards: [
      {
        eyebrow: 'First rep',
        title: 'One last challenge to try',
        description: 'Four minutes, one real product decision, immediate feedback on what a stronger answer would look like. If it is not for you, that is a fine answer too.',
        ctaLabel: 'Start your first interview',
        ctaUrl: appUrl('/first-run'),
      },
    ],
    ctaLabel: 'Start your first interview',
    ctaUrl: input.url ?? appUrl('/first-run'),
  })
}
