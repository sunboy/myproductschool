import 'server-only'

import { EMAIL_ART } from '@/lib/email/art'
import type { TransactionalEmailKind, TransactionalEmailPayload } from '@/lib/email/send-core'

/**
 * Realistic sample payloads for the email preview harness (/admin/emails).
 * One entry per TransactionalEmailKind. Copy here is illustrative only: the
 * real copy lives in src/lib/email/senders/* per docs/notes/email-copy-brief.md.
 * Deadlines are computed relative to "now" so urgency banners render live.
 */

const DEFAULT_FROM = 'HackProduct <billing@hackproduct.com>'
const FOUNDERS_FROM = 'HackProduct <founders@hackproduct.com>'

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600e3).toISOString()
}

function daysFromNow(days: number) {
  return hoursFromNow(days * 24)
}

export const SAMPLE_FROM: Record<TransactionalEmailKind, string> = {
  welcome: FOUNDERS_FROM,
  verification: DEFAULT_FROM,
  magic_link: DEFAULT_FROM,
  password_reset: DEFAULT_FROM,
  streak_reminder: DEFAULT_FROM,
  weekly_digest: DEFAULT_FROM,
  challenge_completion: DEFAULT_FROM,
  payment_receipt: DEFAULT_FROM,
  payment_failed: DEFAULT_FROM,
  payment_action_required: DEFAULT_FROM,
  trial_ending: DEFAULT_FROM,
  affiliate_payout: DEFAULT_FROM,
  cancellation_confirmed: DEFAULT_FROM,
  cancellation_scheduled: DEFAULT_FROM,
  subscription_reactivated: DEFAULT_FROM,
  plan_changed: DEFAULT_FROM,
  discussion_reply: DEFAULT_FROM,
  account_deleted: DEFAULT_FROM,
  abuse_report: DEFAULT_FROM,
  product_feedback: DEFAULT_FROM,
  resume_challenge: DEFAULT_FROM,
  upgrade_nudge: DEFAULT_FROM,
  resume_article: DEFAULT_FROM,
  promotion: DEFAULT_FROM,
  paid_insight: DEFAULT_FROM,
  lead_magnet_unlock: DEFAULT_FROM,
  activation_day1: DEFAULT_FROM,
  activation_day3: DEFAULT_FROM,
  activation_day7: DEFAULT_FROM,
  growth_report: DEFAULT_FROM,
}

export const EMAIL_SAMPLES: Record<TransactionalEmailKind, TransactionalEmailPayload> = {
  welcome: {
    kind: 'welcome',
    dedupeKey: 'sample:welcome',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    from: FOUNDERS_FROM,
    subject: 'Welcome to HackProduct, Priya',
    previewText: 'Your first rep takes four minutes. Here is what the first week looks like.',
    eyebrow: 'Welcome',
    heading: "Let's get your first rep in.",
    tone: 'default',
    heroImageUrl: EMAIL_ART['hatch-wave'],
    heroAlt: 'Hatch waving hello',
    body: 'You just joined a practice gym for product thinking, not a course. Every challenge is a real decision, broken into four moves: Frame, List, Optimize, Win.',
    bodyParagraphs: [
      'Your first week looks like this: day one, one rep, just to feel the format. Day two, read the feedback closely, it names what a stronger answer does differently. Day three, the pattern starts to show in your own reasoning.',
      'Tonight is a good night for day one.',
    ],
    valueBullets: [
      'Practice real product decisions, not trivia',
      'Feedback that names the specific reasoning move you missed',
      'Progress tracked across six competencies, not a single score',
    ],
    ctaLabel: 'Start your first challenge',
    ctaUrl: 'https://www.hackproduct.com/challenges',
    audienceNote: 'You are receiving this because you created a HackProduct account.',
  },

  verification: {
    kind: 'verification',
    dedupeKey: 'sample:verification',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Verify your HackProduct email',
    previewText: 'One click and you are in.',
    eyebrow: 'Verify your email',
    heading: 'Confirm your email address.',
    body: 'Click below to verify your email and finish setting up your account. The link expires in 24 hours.',
    detail: 'If you did not create a HackProduct account, ignore this email; nothing happens without the link.',
    ctaLabel: 'Verify email',
    ctaUrl: 'https://www.hackproduct.com/api/auth/verify?token=sample-token-abc123',
    signoff: null,
  },

  magic_link: {
    kind: 'magic_link',
    dedupeKey: 'sample:magic_link',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your HackProduct sign-in link',
    previewText: 'Nobody can sign in without this email.',
    eyebrow: 'Sign in',
    heading: 'Your sign-in link is ready.',
    body: 'Click below to sign in to HackProduct. The link expires in 15 minutes and works once.',
    detail: 'Nobody can sign in without this email.',
    ctaLabel: 'Sign in',
    ctaUrl: 'https://www.hackproduct.com/api/auth/magic-link?token=sample-token-xyz789',
    signoff: null,
  },

  password_reset: {
    kind: 'password_reset',
    dedupeKey: 'sample:password_reset',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Reset your HackProduct password',
    previewText: 'This link expires in an hour.',
    eyebrow: 'Reset password',
    heading: 'Reset your password.',
    body: 'Click below to choose a new password. The link expires in 1 hour.',
    detail: 'If you did not request this, your password is unchanged.',
    ctaLabel: 'Reset password',
    ctaUrl: 'https://www.hackproduct.com/reset-password?token=sample-token-reset456',
    signoff: null,
  },

  streak_reminder: {
    kind: 'streak_reminder',
    dedupeKey: 'sample:streak_reminder',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Day 6. Your streak resets at midnight.',
    previewText: 'One four-minute session keeps the multiplier you built.',
    eyebrow: 'Practice streak',
    heading: '6 days of showing up.',
    tone: 'default',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    body: 'You have practiced 6 days in a row. That is not a vanity number: the XP multiplier it earns is real, every challenge you complete right now pays out 1.3x, and it took 6 days to build.',
    bodyParagraphs: [
      'One session tonight keeps it. Skip today and the counter goes back to 1, and the multiplier goes with it. A Quick Take counts, and it takes about four minutes.',
    ],
    stats: [
      { label: 'Current streak', value: '6 days' },
      { label: 'XP multiplier', value: '1.3x', sublabel: 'Resets if the streak breaks' },
    ],
    deadline: { label: 'Streak resets at midnight PT tonight', at: hoursFromNow(6) },
    ctaLabel: 'Keep the streak',
    ctaUrl: 'https://www.hackproduct.com/challenges',
    secondaryCta: { label: 'Do a 4-minute Quick Take', url: 'https://www.hackproduct.com/dashboard#quick-take' },
  },

  weekly_digest: {
    kind: 'weekly_digest',
    dedupeKey: 'sample:weekly_digest',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your week: 4 challenges, 210 XP',
    previewText: 'Your Frame answers are landing. Optimize is where the next gains are.',
    eyebrow: 'Weekly digest',
    heading: 'Here is what your practice added up to.',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-insight'],
    body: 'You put in real reps this week. The numbers below are the summary, but the more useful part is the pattern: your Frame answers are consistently landing, and Optimize is where the next gains are.',
    stats: [
      { label: 'Challenges', value: '4' },
      { label: 'XP earned', value: '210' },
      { label: 'Strongest area', value: 'Frame' },
      { label: 'Focus area', value: 'Optimize' },
    ],
    bodyParagraphs: [
      'Pick one Optimize challenge this week and treat it as the main event. One deliberate rep on a weak area moves your profile more than three on a strong one.',
    ],
    ctaLabel: 'Open your dashboard',
    ctaUrl: 'https://www.hackproduct.com/dashboard',
    secondaryCta: { label: 'Practice Optimize', url: 'https://www.hackproduct.com/challenges' },
    repeatCta: true,
  },

  challenge_completion: {
    kind: 'challenge_completion',
    dedupeKey: 'sample:challenge_completion',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your feedback on "Prioritizing the driver earnings redesign" is ready',
    previewText: 'Hatch found something worth naming in your Optimize answer.',
    eyebrow: 'Challenge complete',
    heading: 'Nice work finishing that one.',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    body: 'You just completed "Prioritizing the driver earnings redesign." Hatch found something worth naming in how you handled the Optimize step, and it is waiting for you in your feedback.',
    bodyParagraphs: [
      'The feedback names what a stronger answer does differently on the tradeoff you picked. Read it while the attempt is fresh.',
    ],
    stats: [
      { label: 'Score', value: '82 / 100' },
      { label: 'XP earned', value: '124' },
    ],
    ctaLabel: 'Read your feedback',
    ctaUrl: 'https://www.hackproduct.com/challenges/sample-challenge/feedback',
  },

  payment_receipt: {
    kind: 'payment_receipt',
    dedupeKey: 'sample:payment_receipt',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your HackProduct Pro receipt',
    previewText: 'Here is what this month covers.',
    eyebrow: 'Payment receipt',
    heading: 'Payment received. Thank you.',
    body: 'Your HackProduct Pro payment went through. Here is the receipt for your records.',
    bodyParagraphs: [
      'Here is what that covers this month:',
    ],
    stats: [
      { label: 'Amount', value: '$19.00' },
      { label: 'Plan', value: 'Pro monthly' },
      { label: 'Next billing date', value: 'August 18, 2026' },
    ],
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
    ],
    ctaLabel: 'View billing',
    ctaUrl: 'https://www.hackproduct.com/settings/billing',
  },

  payment_failed: {
    kind: 'payment_failed',
    dedupeKey: 'sample:payment_failed',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your HackProduct payment did not go through',
    previewText: 'It usually takes under a minute to fix.',
    eyebrow: 'Payment failed',
    heading: 'We could not charge your card.',
    tone: 'urgent',
    body: 'Your HackProduct Pro payment failed. We will retry automatically, but updating your card now avoids any interruption.',
    bodyParagraphs: [
      'Until this is resolved, these stay paused: Pro practice limits, live interview sessions, and progress tracking across all six competencies.',
      'It usually takes under a minute to fix.',
    ],
    stats: [
      { label: 'Amount due', value: '$19.00' },
      { label: 'Plan', value: 'Pro monthly' },
    ],
    deadline: { label: 'We retry the charge in 3 days', at: daysFromNow(3) },
    ctaLabel: 'Fix payment',
    ctaUrl: 'https://www.hackproduct.com/settings/billing',
  },

  payment_action_required: {
    kind: 'payment_action_required',
    dedupeKey: 'sample:payment_action_required',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'One more step to confirm your payment',
    previewText: 'Your bank asked for one more confirmation.',
    eyebrow: 'Action required',
    heading: 'Your bank needs one more confirmation.',
    tone: 'urgent',
    body: 'Your bank asked for one more confirmation before your HackProduct Pro payment can go through. This is a routine security step, not a problem with your card.',
    ctaLabel: 'Confirm payment',
    ctaUrl: 'https://www.hackproduct.com/settings/billing',
  },

  trial_ending: {
    kind: 'trial_ending',
    dedupeKey: 'sample:trial_ending',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your Pro trial ends July 21, 2026',
    previewText: 'No surprise charges is the whole point of this email.',
    eyebrow: 'Trial ending',
    heading: '3 days left on your Pro trial.',
    tone: 'urgent',
    heroImageUrl: EMAIL_ART['hatch-unlock'],
    body: 'Your 7-day Pro trial ends on July 21, 2026. After that, Pro monthly starts automatically at $19.00 unless you cancel first. No surprise charges is the whole point of this email.',
    bodyParagraphs: [
      'Here is what stays if you keep Pro, so the decision is easy:',
      'If Pro is not for you right now, cancel in one click from settings before July 21, 2026 and you will not be charged. Everything you practiced stays on your account either way.',
    ],
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
      '40+ breakdowns of real product decisions',
    ],
    deadline: { label: 'Trial ends July 21, 2026', at: daysFromNow(3) },
    ctaLabel: 'Keep Pro',
    ctaUrl: 'https://www.hackproduct.com/settings',
    secondaryCta: { label: 'Manage or cancel', url: 'https://www.hackproduct.com/settings' },
  },

  affiliate_payout: {
    kind: 'affiliate_payout',
    dedupeKey: 'sample:affiliate_payout',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your affiliate payout is on the way',
    previewText: 'Thanks for sending people our way.',
    eyebrow: 'Affiliate payout',
    heading: 'Your payout is on the way.',
    tone: 'celebratory',
    body: 'Thanks for sending people our way. Your latest affiliate payout has been sent.',
    stats: [
      { label: 'Amount', value: '$84.00' },
      { label: 'Destination', value: 'Bank account ending 4821' },
    ],
    ctaLabel: 'View affiliate dashboard',
    ctaUrl: 'https://www.hackproduct.com/affiliate',
  },

  cancellation_confirmed: {
    kind: 'cancellation_confirmed',
    dedupeKey: 'sample:cancellation_confirmed',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your HackProduct Pro subscription is canceled',
    previewText: 'Your account stays on Free, everything you practiced is still there.',
    eyebrow: 'Subscription canceled',
    heading: 'Your Pro subscription is canceled.',
    body: 'Your HackProduct Pro subscription has been canceled. Your account is now on Free.',
    bodyParagraphs: [
      'Free still includes real practice, just at a smaller volume:',
    ],
    valueBullets: [
      '3 practice challenges a month',
      'Full access to your existing progress and history',
      'Community discussions on every challenge',
    ],
    ctaLabel: 'Open dashboard',
    ctaUrl: 'https://www.hackproduct.com/dashboard',
    secondaryCta: { label: 'See Pro again', url: 'https://www.hackproduct.com/pricing' },
  },

  cancellation_scheduled: {
    kind: 'cancellation_scheduled',
    dedupeKey: 'sample:cancellation_scheduled',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your Pro plan ends August 18, 2026',
    previewText: 'You keep full Pro access until then.',
    eyebrow: 'Cancellation scheduled',
    heading: 'Your Pro plan is set to end.',
    tone: 'default',
    body: 'Your HackProduct Pro subscription is scheduled to cancel. You keep full Pro access until the date below, then your account moves to Free.',
    bodyParagraphs: [
      'Changed your mind? One click undoes this before the date below.',
    ],
    stats: [
      { label: 'Access ends', value: 'August 18, 2026' },
      { label: 'Plan after', value: 'Free' },
    ],
    deadline: { label: 'Pro access ends August 18, 2026', at: daysFromNow(31) },
    ctaLabel: 'Keep Pro',
    ctaUrl: 'https://www.hackproduct.com/settings',
    secondaryCta: { label: 'Manage subscription', url: 'https://www.hackproduct.com/settings' },
  },

  subscription_reactivated: {
    kind: 'subscription_reactivated',
    dedupeKey: 'sample:subscription_reactivated',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Welcome back to Pro',
    previewText: 'Your Pro access is active again.',
    eyebrow: 'Subscription reactivated',
    heading: 'Pro is back on.',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    body: 'Your HackProduct Pro subscription is active again. Full access is restored.',
    stats: [
      { label: 'Plan', value: 'Pro monthly' },
      { label: 'Next billing date', value: 'August 18, 2026' },
    ],
    ctaLabel: 'Open dashboard',
    ctaUrl: 'https://www.hackproduct.com/dashboard',
  },

  plan_changed: {
    kind: 'plan_changed',
    dedupeKey: 'sample:plan_changed',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your plan changed to Pro annual',
    previewText: 'Confirming the switch.',
    eyebrow: 'Plan changed',
    heading: 'Your plan is now Pro annual.',
    body: 'Your HackProduct plan has changed. Here is what is active now.',
    bodyParagraphs: [
      'Your billing cycle moved from monthly to annual, and the new rate reflects that.',
    ],
    stats: [
      { label: 'New plan', value: 'Pro annual' },
      { label: 'Next billing date', value: 'July 18, 2027' },
    ],
    ctaLabel: 'View billing',
    ctaUrl: 'https://www.hackproduct.com/settings/billing',
  },

  discussion_reply: {
    kind: 'discussion_reply',
    dedupeKey: 'sample:discussion_reply',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Arjun replied to your comment',
    previewText: 'On "Prioritizing the driver earnings redesign."',
    eyebrow: 'New reply',
    heading: 'You have a new reply.',
    body: 'Arjun replied to your comment on "Prioritizing the driver earnings redesign."',
    contentCards: [
      {
        eyebrow: 'Reply',
        title: 'Arjun',
        description: 'I think the tradeoff you named on the Optimize step undersells the support-cost side. Curious how you would defend that against a reviewer pushing back.',
        ctaLabel: 'View reply',
        ctaUrl: 'https://www.hackproduct.com/challenges/sample-challenge/discussion#reply-1',
      },
    ],
    ctaLabel: 'View reply',
    ctaUrl: 'https://www.hackproduct.com/challenges/sample-challenge/discussion#reply-1',
  },

  account_deleted: {
    kind: 'account_deleted',
    dedupeKey: 'sample:account_deleted',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your HackProduct account has been deleted',
    previewText: 'This confirms the deletion is complete.',
    eyebrow: 'Account deleted',
    heading: 'Your account has been deleted.',
    body: 'This confirms your HackProduct account, including your progress, challenge history, and profile, has been permanently deleted. This action is final.',
    signoff: null,
  },

  abuse_report: {
    kind: 'abuse_report',
    dedupeKey: 'sample:abuse_report',
    to: 'sandeeptnvs@gmail.com',
    subject: 'New abuse report submitted',
    previewText: 'Discussion comment flagged for review.',
    eyebrow: 'Abuse report',
    heading: 'A new report needs review.',
    body: 'A user flagged content for review.',
    stats: [
      { label: 'Reported by', value: 'user_8213' },
      { label: 'Content type', value: 'Discussion comment' },
    ],
    ctaLabel: 'Review in admin',
    ctaUrl: 'https://www.hackproduct.com/admin/discussions',
    signoff: null,
  },

  product_feedback: {
    kind: 'product_feedback',
    dedupeKey: 'sample:product_feedback',
    to: 'sandeeptnvs@gmail.com',
    subject: 'New product feedback submitted',
    previewText: 'From a Pro user.',
    eyebrow: 'Product feedback',
    heading: 'New feedback came in.',
    body: 'A user submitted feedback through the app.',
    stats: [
      { label: 'From', value: 'user_5510' },
      { label: 'Plan', value: 'Pro' },
    ],
    detail: 'The live interview transcript download would save me a lot of copy-pasting into my notes app.',
    signoff: null,
  },

  resume_challenge: {
    kind: 'resume_challenge',
    dedupeKey: 'sample:resume_challenge',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your Optimize step is still open',
    previewText: 'The thinking you already did is saved. Finishing it is the hard part.',
    eyebrow: 'Unfinished rep',
    heading: 'You left one step open.',
    heroImageUrl: EMAIL_ART['hatch-point'],
    body: 'The thinking you already did on "Prioritizing the driver earnings redesign" is saved, but it goes stale in your head, not in the app.',
    bodyParagraphs: [
      'You are on the Optimize step, one move away from a finished rep.',
    ],
    contentCards: [
      {
        eyebrow: 'Paused rep',
        title: 'Prioritizing the driver earnings redesign',
        description: 'You already framed the problem and listed the options. Finishing means naming the tradeoff and getting Hatch\'s read on it, about six minutes of work from here.',
        ctaLabel: 'Continue',
        ctaUrl: 'https://www.hackproduct.com/challenges/sample-challenge/workspace',
      },
    ],
    ctaLabel: 'Continue',
    ctaUrl: 'https://www.hackproduct.com/challenges/sample-challenge/workspace',
  },

  upgrade_nudge: {
    kind: 'upgrade_nudge',
    dedupeKey: 'sample:upgrade_nudge',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'You have used your 3 free challenges this month',
    previewText: 'Pro removes the monthly ceiling entirely.',
    eyebrow: 'Upgrade',
    heading: 'You are getting real use out of this.',
    heroImageUrl: EMAIL_ART['hatch-unlock'],
    body: 'You have used your 3 free challenges this month. Pro removes the monthly ceiling entirely, at 80 challenges a month instead of 3.',
    bodyParagraphs: [
      'It also adds live interview sessions with spoken feedback, and tracks your strengths and gaps across everything you practice.',
    ],
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
    ],
    ctaLabel: 'See Pro plans',
    ctaUrl: 'https://www.hackproduct.com/pricing',
    repeatCta: true,
  },

  resume_article: {
    kind: 'resume_article',
    dedupeKey: 'sample:resume_article',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'You stopped partway through "Why Superhuman charges $30/month"',
    previewText: 'The second half is where the actual pricing logic shows up.',
    eyebrow: 'Unfinished read',
    heading: 'You were halfway through this one.',
    heroImageUrl: EMAIL_ART['hatch-read'],
    body: 'You stopped partway through "Why Superhuman charges $30/month." The second half is where the actual pricing logic shows up, not just the headline number.',
    contentCards: [
      {
        eyebrow: 'Paused read',
        title: 'Why Superhuman charges $30/month',
        description: 'The breakdown of how a premium price becomes a targeting filter instead of a barrier, and what that means for the churn numbers everyone assumes are bad.',
        ctaLabel: 'Finish reading',
        ctaUrl: 'https://www.hackproduct.com/explore/autopsies/superhuman-pricing',
      },
    ],
    ctaLabel: 'Finish reading',
    ctaUrl: 'https://www.hackproduct.com/explore/autopsies/superhuman-pricing',
  },

  promotion: {
    kind: 'promotion',
    dedupeKey: 'sample:promotion',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: '3 months of Pro at half price',
    previewText: 'Ends Sunday. No code needed at checkout.',
    eyebrow: 'Limited offer',
    heading: '50% off Pro for 3 months.',
    tone: 'celebratory',
    heroImageUrl: EMAIL_ART['hatch-celebrate'],
    body: 'For a limited time, new Pro subscriptions get 50% off for the first 3 months.',
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
    ],
    deadline: { label: 'Offer ends Sunday at midnight PT', at: daysFromNow(4) },
    ctaLabel: 'Claim the discount',
    ctaUrl: 'https://www.hackproduct.com/pricing?promo=SAMPLE50',
  },

  paid_insight: {
    kind: 'paid_insight',
    dedupeKey: 'sample:paid_insight',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your competency read for July',
    previewText: 'Frame is carrying you. Optimize is the next unlock.',
    eyebrow: 'Competency insight',
    heading: 'Here is where you actually stand.',
    tone: 'celebratory',
    body: 'Across everything you practiced this month, one pattern stands out clearly enough to act on.',
    stats: [
      { label: 'Strongest', value: 'Frame' },
      { label: 'Focus', value: 'Optimize' },
    ],
    valueBullets: [
      'Your Frame answers consistently name the root cause, not the symptom',
      'Your Optimize answers name a tradeoff but rarely defend the sacrifice',
    ],
    bodyParagraphs: [
      'This week, before you submit an Optimize answer, add one sentence defending why the thing you gave up is an acceptable loss. That single addition is worth more than another full rep.',
    ],
    ctaLabel: 'See your full skill ladder',
    ctaUrl: 'https://www.hackproduct.com/progress/skill-ladder',
  },

  lead_magnet_unlock: {
    kind: 'lead_magnet_unlock',
    dedupeKey: 'sample:lead_magnet_unlock',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your copy of "The Failure Mode Playbook"',
    previewText: 'Five real teardown patterns, no fluff.',
    eyebrow: 'Your download',
    heading: 'Here is your playbook.',
    heroImageUrl: EMAIL_ART['hatch-insight'],
    body: 'Thanks for grabbing "The Failure Mode Playbook." It is five real teardown patterns pulled from products that shipped the wrong fix.',
    bodyParagraphs: [
      'No account needed to read it, just click below.',
    ],
    valueBullets: [
      'Five real failure patterns with the actual data behind them',
      'The question that would have caught each one earlier',
    ],
    ctaLabel: 'Get the playbook',
    ctaUrl: 'https://www.hackproduct.com/leads/failure-mode-playbook/download',
    audienceNote: 'You are receiving this because you requested this download.',
  },

  activation_day1: {
    kind: 'activation_day1',
    dedupeKey: 'sample:activation_day1',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'One rep is all today needs',
    previewText: 'Four minutes, one decision, no prep required.',
    eyebrow: 'Day 1',
    heading: 'Today, just one rep.',
    heroImageUrl: EMAIL_ART['hatch-wave'],
    body: 'You signed up yesterday and have not started yet. That is normal, the format takes a minute to click, but the fastest way to feel it is a single Quick Take, about four minutes.',
    contentCards: [
      {
        eyebrow: 'First rep',
        title: 'Should Instagram show like counts?',
        description: 'A short, self-contained decision with no setup needed. It is the fastest way to feel how the Frame → List → Optimize → Win format actually works.',
        ctaLabel: 'Try it now',
        ctaUrl: 'https://www.hackproduct.com/dashboard#quick-take',
      },
    ],
    ctaLabel: 'Do your first rep',
    ctaUrl: 'https://www.hackproduct.com/dashboard#quick-take',
  },

  activation_day3: {
    kind: 'activation_day3',
    dedupeKey: 'sample:activation_day3',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Two more days like day one',
    previewText: 'The pattern starts to show by day three.',
    eyebrow: 'Day 3',
    heading: 'Two reps in. Keep it going.',
    body: 'You have done two reps so far. Most people who stick with HackProduct do their third rep by day three, before the account fades into the background of their inbox.',
    contentCards: [
      {
        eyebrow: 'Next rep',
        title: 'Pricing the churn-heavy tier',
        description: 'An Optimize-heavy challenge that builds directly on the reasoning you have already practiced twice this week.',
        ctaLabel: 'Start this one',
        ctaUrl: 'https://www.hackproduct.com/challenges/sample-next',
      },
    ],
    ctaLabel: 'Do rep three',
    ctaUrl: 'https://www.hackproduct.com/challenges/sample-next',
  },

  activation_day7: {
    kind: 'activation_day7',
    dedupeKey: 'sample:activation_day7',
    to: 'sandeeptnvs@gmail.com',
    name: 'Priya',
    subject: 'Your first week, honestly assessed',
    previewText: 'This is the last nudge email you will get from us.',
    eyebrow: 'Day 7',
    heading: 'One week in. Here is the honest read.',
    body: 'A week ago you signed up. Since then you have practiced a few times, and the pattern in your answers is already visible.',
    bodyParagraphs: [
      'This is the last nudge email in this sequence. What happens next is up to whether the reps kept earning their place in your week.',
    ],
    stats: [
      { label: 'Reps this week', value: '3' },
      { label: 'XP earned', value: '145' },
    ],
    ctaLabel: 'Keep practicing',
    ctaUrl: 'https://www.hackproduct.com/challenges',
  },

  growth_report: {
    kind: 'growth_report',
    dedupeKey: 'sample:growth_report',
    to: 'sandeeptnvs@gmail.com',
    subject: 'Weekly growth report',
    previewText: 'Signups, activation, and revenue for the week.',
    eyebrow: 'Growth report',
    heading: 'This week in numbers.',
    body: 'Automated weekly summary.',
    stats: [
      { label: 'New signups', value: '212' },
      { label: 'Activated (1+ rep)', value: '134' },
      { label: 'New Pro subs', value: '18' },
      { label: 'MRR', value: '$3,420' },
    ],
    signoff: null,
  },
}

export const NEWSLETTER_SAMPLE = {
  title: 'The pricing mistake most B2B SaaS teams make twice',
  dek: 'A look at how two companies priced their way into the same churn problem, six years apart.',
  bodyMarkdown: `Most pricing postmortems focus on the number. The real story is usually about *when* the number changed relative to the product.

## The pattern

Two companies, same mistake:

- Raised prices before the product justified the increase
- Grandfathered existing customers, punishing new ones for joining late
- Blamed churn on "market conditions" for two quarters before touching the pricing page again

> "We didn't have a pricing problem. We had a sequencing problem.": a PM who lived through one of these

## What actually fixed it

The fix in both cases was not a lower price. It was **re-ordering** the rollout: ship the value first, measure adoption of the new capability, and only then move the price to match what customers were already getting.

Read the [full breakdown](https://www.hackproduct.com/blog/pricing-sequencing) for the specific metrics both teams tracked.`,
  heroImageUrl: null,
  hatchIntro: 'This one is worth reading slowly. The mistake is subtle enough that most teams repeat it.',
  unsubscribeUrl: 'https://www.hackproduct.com/api/newsletter/unsubscribe?token=sample-unsub-token',
  canonicalUrl: 'https://www.hackproduct.com/blog/pricing-sequencing',
}
