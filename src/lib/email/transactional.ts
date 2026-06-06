import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeAiOutput } from '@/lib/ai/sanitize'
import { EMAIL_ART, EMAIL_BRAND } from '@/lib/email/art'
import { configuredFromEmail, configuredReplyTo, getResendClient } from '@/lib/email/client'

type TransactionalEmailKind =
  | 'welcome'
  | 'verification'
  | 'magic_link'
  | 'password_reset'
  | 'streak_reminder'
  | 'weekly_digest'
  | 'challenge_completion'
  | 'payment_receipt'
  | 'payment_failed'
  | 'payment_action_required'
  | 'trial_ending'
  | 'affiliate_payout'
  | 'cancellation_confirmed'
  | 'cancellation_scheduled'
  | 'subscription_reactivated'
  | 'plan_changed'
  | 'discussion_reply'
  | 'account_deleted'
  | 'abuse_report'
  | 'product_feedback'
  | 'resume_challenge'
  | 'upgrade_nudge'
  | 'resume_article'
  | 'promotion'
  | 'paid_insight'

interface BaseTransactionalInput {
  dedupeKey: string
  userId?: string | null
  to?: string | null
  name?: string | null
  unsubscribeUrl?: string | null
}

interface LinkEmailInput extends BaseTransactionalInput {
  url: string
}

interface WelcomeInput extends Omit<BaseTransactionalInput, 'dedupeKey'> {
  userId: string
}

interface StreakReminderInput extends BaseTransactionalInput {
  streakDays: number
  url?: string | null
}

interface WeeklyDigestInput extends BaseTransactionalInput {
  challengesCompleted: number
  xpEarned: number
  strongestCompetency?: string | null
  weakestCompetency?: string | null
  recommendationCopy?: string | null
  url?: string | null
}

interface ChallengeCompletionInput extends BaseTransactionalInput {
  challengeTitle: string
  scoreLabel?: string | null
  xpEarned?: number | null
  url?: string | null
}

interface PaymentEmailInput extends BaseTransactionalInput {
  planLabel?: string | null
  amount?: number | null
  currency?: string | null
  periodEnd?: string | null
  url?: string | null
}

interface DiscussionReplyInput extends BaseTransactionalInput {
  challengeTitle?: string | null
  replyAuthor?: string | null
  excerpt?: string | null
  url: string
}

interface AbuseReportEmailInput extends BaseTransactionalInput {
  reportId: string
  targetType: string
  category: string
  targetUrl?: string | null
  message?: string | null
}

interface ProductFeedbackEmailInput extends BaseTransactionalInput {
  feedbackId: string
  kind: string
  rating: number
  path?: string | null
  message?: string | null
}

interface ResumeChallengeInput extends BaseTransactionalInput {
  challengeTitle: string
  currentStep?: string | null
  resumeUrl: string
}

interface UpgradeNudgeInput extends BaseTransactionalInput {
  url?: string | null
}

interface ResumeArticleInput extends BaseTransactionalInput {
  articleTitle: string
  articleUrl: string
}

interface PromotionInput extends BaseTransactionalInput {
  heading: string
  body: string
  ctaLabel: string
  ctaUrl: string
  valueBullets?: string[] | null
  heroImageUrl?: string | null
  eyebrow?: string | null
}

interface PaidInsightInput extends BaseTransactionalInput {
  strongestCompetency?: string | null
  strongestLabel?: string | null
  focusCompetency?: string | null
  focusLabel?: string | null
  recentWins?: string[] | null
  url?: string | null
}

type EmailTone = 'default' | 'celebratory' | 'urgent'

interface SecondaryCta {
  label: string
  url: string
}

interface TransactionalEmailPayload extends BaseTransactionalInput {
  kind: TransactionalEmailKind
  subject: string
  eyebrow: string
  heading: string
  body: string
  detail?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  aiDynamic?: boolean
  from?: string
  /** Presentation extras — all optional, default to the plain card when unset. */
  heroImageUrl?: string | null
  heroAlt?: string | null
  accentImageUrl?: string | null
  valueBullets?: string[] | null
  secondaryCta?: SecondaryCta | null
  tone?: EmailTone
}

function appUrl(path = '/') {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return new URL(path, base).toString()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency ?? 'usd').toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `$${(amount / 100).toFixed(2)}`
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Terra palette, email-safe hex (no CSS vars in mail clients).
const COLOR = {
  bg: '#f8f3ea',
  card: '#ffffff',
  border: '#d7d2c8',
  ink: '#233028',
  muted: '#4f5a51',
  faint: '#74796e',
  primary: '#2d5a3d',
  primaryText: '#ffffff',
  amber: '#705c30',
}

function toneHeader(tone: EmailTone | undefined) {
  // Header bar background + eyebrow accent per tone. Default = forest green.
  switch (tone) {
    case 'celebratory':
      // Forest green with a warm amber eyebrow to feel like a win.
      return { bar: COLOR.primary, eyebrow: '#e7c98c' }
    case 'urgent':
      // Deeper, warmer green-brown to read as "needs attention" without alarm red.
      return { bar: '#5e4a2e', eyebrow: 'rgba(255,255,255,.7)' }
    default:
      return { bar: COLOR.primary, eyebrow: 'rgba(255,255,255,.62)' }
  }
}

function pillButton(href: string | null | undefined, label: string | null | undefined, variant: 'primary' | 'secondary' = 'primary') {
  if (!href || !label) return ''
  const styles =
    variant === 'primary'
      ? `background:${COLOR.primary};color:${COLOR.primaryText};border:1px solid ${COLOR.primary};`
      : `background:#ffffff;color:${COLOR.primary};border:1px solid ${COLOR.border};`
  return `<a href="${escapeHtml(href)}" style="display:inline-block;${styles}text-decoration:none;border-radius:999px;padding:12px 22px;font-weight:700;font-size:14px;line-height:1;">${escapeHtml(label)}</a>`
}

function heroImage(url: string | null | undefined, alt: string | null | undefined) {
  if (!url) return ''
  return `
          <div style="text-align:center;padding:26px 24px 0;">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(alt ?? 'Hatch')}" width="132" style="width:132px;height:auto;display:inline-block;" />
          </div>`
}

function valueBulletList(bullets: string[] | null | undefined) {
  if (!bullets || bullets.length === 0) return ''
  const rows = bullets
    .map(
      bullet => `
            <tr>
              <td valign="top" style="padding:6px 10px 6px 0;color:${COLOR.primary};font-size:15px;font-weight:800;line-height:1.5;">&#10003;</td>
              <td valign="top" style="padding:6px 0;color:${COLOR.ink};font-size:15px;line-height:1.5;">${escapeHtml(bullet)}</td>
            </tr>`
    )
    .join('')
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 0;width:100%;">
              ${rows}
            </table>`
}

function accentImage(url: string | null | undefined) {
  if (!url) return ''
  return `
            <div style="text-align:center;margin-top:22px;">
              <img src="${escapeHtml(url)}" alt="Hatch" width="96" style="width:96px;height:auto;display:inline-block;opacity:.95;" />
            </div>`
}

function cleanAiDynamicText(input: TransactionalEmailPayload) {
  if (!input.aiDynamic) return input

  const body = sanitizeAiOutput({
    text: input.body,
    route: `email:${input.kind}`,
    model: 'email-template',
    userId: input.userId,
  }).text

  const detail = input.detail
    ? sanitizeAiOutput({
      text: input.detail,
      route: `email:${input.kind}`,
      model: 'email-template',
      userId: input.userId,
    }).text
    : input.detail

  return { ...input, body, detail }
}

/**
 * Render an email payload to HTML + text without sending. Pure; used by the
 * template preview script (scripts/preview-emails.ts). Not part of the send path.
 */
export function renderEmailForPreview(input: TransactionalEmailPayload) {
  return { html: renderHtmlEmail(input), text: renderTextEmail(input) }
}

function renderHtmlEmail(input: TransactionalEmailPayload) {
  const name = input.name?.trim()
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  const header = toneHeader(input.tone)
  const detail = input.detail
    ? `<p style="margin:16px 0 0;color:${COLOR.muted};font-size:14px;line-height:1.6;">${escapeHtml(input.detail)}</p>`
    : ''

  const ctaBlock =
    input.ctaUrl || input.secondaryCta
      ? `
            <div style="margin-top:26px;">
              ${input.ctaUrl ? pillButton(input.ctaUrl, input.ctaLabel, 'primary') : ''}
              ${input.secondaryCta ? `<span style="display:inline-block;width:10px;">&nbsp;</span>${pillButton(input.secondaryCta.url, input.secondaryCta.label, 'secondary')}` : ''}
            </div>`
      : ''

  return `
    <div style="margin:0;padding:0;background:${COLOR.bg};font-family:Inter,Arial,sans-serif;color:${COLOR.ink};">
      <div style="max-width:560px;margin:0 auto;padding:36px 20px;">
        <div style="margin-bottom:20px;text-align:left;">
          <img src="${EMAIL_BRAND.wordmark}" alt="HackProduct" style="height:40px;width:auto;" />
        </div>
        <div style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:18px;overflow:hidden;">
          ${heroImage(input.heroImageUrl, input.heroAlt)}
          <div style="background:${header.bar};padding:22px 24px;color:#ffffff;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;color:${header.eyebrow};">${escapeHtml(input.eyebrow)}</div>
            <h1 style="margin:8px 0 0;font-size:25px;line-height:1.15;letter-spacing:-.02em;">${escapeHtml(input.heading)}</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 14px;color:${COLOR.ink};font-size:15px;line-height:1.7;">${greeting}</p>
            <p style="margin:0;color:${COLOR.muted};font-size:15px;line-height:1.7;">${escapeHtml(input.body)}</p>
            ${detail}
            ${valueBulletList(input.valueBullets)}
            ${ctaBlock}
            ${accentImage(input.accentImageUrl)}
          </div>
        </div>
        <p style="margin:18px 0 0;color:${COLOR.faint};font-size:12px;line-height:1.6;">
          You are receiving this because you have a HackProduct account.
          ${input.unsubscribeUrl ? `<br /><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${COLOR.primary};text-decoration:underline;">Unsubscribe</a>` : ''}
        </p>
      </div>
    </div>
  `
}

function renderTextEmail(input: TransactionalEmailPayload) {
  const bullets =
    input.valueBullets && input.valueBullets.length > 0
      ? input.valueBullets.map(b => `- ${b}`).join('\n')
      : null

  const parts = [
    input.heading,
    '',
    input.name?.trim() ? `Hi ${input.name.trim()},` : 'Hi,',
    input.body,
    input.detail ?? null,
    bullets ? `\n${bullets}` : null,
    input.ctaUrl && input.ctaLabel ? `\n${input.ctaLabel}: ${input.ctaUrl}` : null,
    input.secondaryCta ? `${input.secondaryCta.label}: ${input.secondaryCta.url}` : null,
    input.unsubscribeUrl ? `\nUnsubscribe: ${input.unsubscribeUrl}` : null,
  ].filter(Boolean)

  return parts.join('\n')
}

async function resolveRecipient(admin: SupabaseClient, input: BaseTransactionalInput) {
  if (input.to) return input.to
  if (!input.userId) return null

  const { data } = await admin.auth.admin.getUserById(input.userId)
  return data.user?.email ?? null
}

async function hasSentTransactionalEmail(admin: SupabaseClient, dedupeKey: string) {
  const { data } = await admin
    .from('email_dedupes')
    .select('id, status')
    .eq('dedupe_key', dedupeKey)
    .eq('status', 'sent')
    .maybeSingle()

  return !!data
}

async function sendTransactionalEmail(admin: SupabaseClient, payload: TransactionalEmailPayload) {
  const to = await resolveRecipient(admin, payload)
  const resend = getResendClient()
  if (!to || !resend) {
    console.warn('[email] short-circuit', {
      kind: payload.kind,
      dedupeKey: payload.dedupeKey,
      missing: !to && !resend ? 'recipient+resend' : !to ? 'recipient' : 'resend',
      userId: payload.userId ?? null,
    })
    return
  }
  if (await hasSentTransactionalEmail(admin, payload.dedupeKey)) return

  try {
    const emailPayload = cleanAiDynamicText({ ...payload, to })
    const { data, error } = await resend.emails.send(
      {
        from: payload.from ?? configuredFromEmail(),
        to,
        replyTo: configuredReplyTo(),
        subject: payload.subject,
        html: renderHtmlEmail(emailPayload),
        text: renderTextEmail(emailPayload),
      },
      { idempotencyKey: payload.dedupeKey.slice(0, 256) }
    )

    const { error: upsertError } = await admin.from('email_dedupes').upsert({
      dedupe_key: payload.dedupeKey,
      user_id: payload.userId ?? null,
      recipient: to,
      template: payload.kind,
      status: error ? 'failed' : 'sent',
      resend_email_id: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
    if (upsertError) {
      console.error('[email] email_dedupes upsert failed (post-send)', {
        kind: payload.kind,
        dedupeKey: payload.dedupeKey,
        error: upsertError.message,
        code: (upsertError as { code?: string }).code,
      })
    }
  } catch (error) {
    const { error: upsertError } = await admin.from('email_dedupes').upsert({
      dedupe_key: payload.dedupeKey,
      user_id: payload.userId ?? null,
      recipient: to,
      template: payload.kind,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Resend error',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
    if (upsertError) {
      console.error('[email] email_dedupes upsert failed (catch path)', {
        kind: payload.kind,
        dedupeKey: payload.dedupeKey,
        error: upsertError.message,
        code: (upsertError as { code?: string }).code,
      })
    }
  }
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

export function sendVerificationEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'verification',
    subject: 'Confirm your HackProduct email',
    eyebrow: 'Email verification',
    heading: 'Confirm your email.',
    body: 'Open the confirmation link to finish setting up your account.',
    ctaLabel: 'Confirm email',
    ctaUrl: input.url,
  })
}

export function sendMagicLinkEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'magic_link',
    subject: 'Your HackProduct magic link',
    eyebrow: 'Sign in',
    heading: 'Use this link to sign in.',
    body: 'This link signs you in securely and expires soon.',
    ctaLabel: 'Sign in',
    ctaUrl: input.url,
  })
}

export function sendPasswordResetEmail(admin: SupabaseClient, input: LinkEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'password_reset',
    subject: 'Reset your HackProduct password',
    eyebrow: 'Password reset',
    heading: 'Choose a new password.',
    body: 'Open the reset link and choose a new password for your account.',
    ctaLabel: 'Reset password',
    ctaUrl: input.url,
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

export function sendPaymentReceiptEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const amount = formatMoney(input.amount, input.currency)
  const periodEnd = formatDate(input.periodEnd)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_receipt',
    subject: 'Your HackProduct receipt',
    eyebrow: 'Payment received',
    heading: 'Your payment is complete.',
    body: `Your ${input.planLabel ?? 'HackProduct Pro'} payment was received.`,
    detail: [amount ? `Amount paid: ${amount}` : null, periodEnd ? `Next billing date: ${periodEnd}.` : null].filter(Boolean).join(' '),
    ctaLabel: 'View billing',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export function sendPaymentFailedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const amount = formatMoney(input.amount, input.currency)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_failed',
    subject: 'Action needed: HackProduct payment failed',
    eyebrow: 'Payment failed',
    heading: 'Your Pro renewal needs attention.',
    body: `Stripe could not collect payment for ${input.planLabel ?? 'HackProduct Pro'}. Update billing details to keep Pro access active.`,
    detail: amount ? `Amount due: ${amount}` : null,
    ctaLabel: 'Fix payment',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export function sendPaymentActionRequiredEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_action_required',
    subject: 'Action needed: authorize your HackProduct renewal',
    eyebrow: 'Authorize renewal',
    heading: 'One quick step to keep your Pro access.',
    body: 'Your bank is asking you to authorize this renewal. Click below to complete it, takes 30 seconds.',
    ctaLabel: 'Authorize renewal',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export function sendTrialEndingEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const trialEnd = formatDate(input.periodEnd)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'trial_ending',
    subject: 'Your HackProduct Pro trial ends soon',
    eyebrow: 'Trial ending',
    heading: 'Your Pro trial ends tomorrow.',
    body: `${input.planLabel ?? 'HackProduct Pro'} starts automatically after your 7-day free trial unless you cancel before then.`,
    detail: trialEnd ? `Trial ends on ${trialEnd}.` : null,
    ctaLabel: 'Manage billing',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export function sendAffiliatePayoutEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const amount = formatMoney(input.amount, input.currency)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'affiliate_payout',
    subject: 'Your HackProduct affiliate payout is on the way',
    eyebrow: 'Affiliate payout',
    heading: 'Your referral commission was paid.',
    body: 'Stripe is sending your HackProduct affiliate payout to your connected account.',
    detail: amount ? `Payout amount: ${amount}` : null,
    ctaLabel: 'View affiliate dashboard',
    ctaUrl: input.url ?? appUrl('/affiliate'),
  })
}

export function sendCancellationConfirmedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'cancellation_confirmed',
    subject: 'HackProduct Pro has ended',
    eyebrow: 'Subscription ended',
    heading: 'Your account is now on Free.',
    body: 'Free monthly practice limits are still available from your dashboard.',
    ctaLabel: 'Open dashboard',
    ctaUrl: input.url ?? appUrl('/dashboard'),
  })
}

export function sendCancellationScheduledEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'cancellation_scheduled',
    subject: 'HackProduct Pro cancellation scheduled',
    eyebrow: 'Plan change',
    heading: 'Pro stays active for now.',
    body: `${input.planLabel ?? 'HackProduct Pro'} is set to end at the close of the current billing period.`,
    detail: periodEnd ? `Access continues through ${periodEnd}.` : null,
  })
}

export function sendSubscriptionReactivatedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'subscription_reactivated',
    subject: 'HackProduct Pro is active again',
    eyebrow: 'Plan active',
    heading: 'Your Pro subscription will continue.',
    body: `Cancellation was removed from ${input.planLabel ?? 'HackProduct Pro'}.`,
    detail: periodEnd ? `Your next billing date is ${periodEnd}.` : null,
  })
}

export function sendPlanChangedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'plan_changed',
    subject: 'HackProduct Pro plan updated',
    eyebrow: 'Billing updated',
    heading: `You're now on ${input.planLabel ?? 'HackProduct Pro'}.`,
    body: 'Your billing interval and Pro access have been updated.',
    detail: periodEnd ? `Next billing date: ${periodEnd}.` : null,
  })
}

export function sendDiscussionReplyEmail(admin: SupabaseClient, input: DiscussionReplyInput) {
  const detail = input.excerpt
    ? `"${input.excerpt.slice(0, 180)}${input.excerpt.length > 180 ? '...' : ''}"`
    : null

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'discussion_reply',
    subject: 'New reply on your HackProduct discussion',
    eyebrow: 'Discussion reply',
    heading: input.challengeTitle ?? 'Someone replied to your comment.',
    body: `${input.replyAuthor ?? 'Someone'} replied to your discussion comment.`,
    detail,
    ctaLabel: 'View reply',
    ctaUrl: input.url,
  })
}

export function sendAccountDeletedEmail(admin: SupabaseClient, input: BaseTransactionalInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'account_deleted',
    subject: 'Your HackProduct account was deleted',
    eyebrow: 'Account deleted',
    heading: 'Your account has been deleted.',
    body: 'Your HackProduct account and profile data have been removed.',
  })
}

export function sendAbuseReportEmail(admin: SupabaseClient, input: AbuseReportEmailInput) {
  const detail = [
    `Report ID: ${input.reportId}`,
    `Surface: ${input.targetType}`,
    `Category: ${input.category}`,
    input.message ? `Message: ${input.message.slice(0, 500)}` : null,
    input.targetUrl ? `Target: ${input.targetUrl}` : null,
  ].filter(Boolean).join(' | ')

  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'abuse_report',
    subject: 'New HackProduct abuse report',
    eyebrow: 'Abuse report',
    heading: 'A report needs review.',
    body: 'A user reported content in HackProduct.',
    detail,
    ctaLabel: input.targetUrl ? 'Open reported surface' : null,
    ctaUrl: input.targetUrl ?? null,
  })
}

export function sendProductFeedbackEmail(admin: SupabaseClient, input: ProductFeedbackEmailInput) {
  const detail = [
    `Feedback ID: ${input.feedbackId}`,
    `Kind: ${input.kind}`,
    `Rating: ${input.rating}/5`,
    input.path ? `Path: ${input.path}` : null,
    input.message ? `Message: ${input.message.slice(0, 700)}` : null,
  ].filter(Boolean).join(' | ')

  return sendTransactionalEmail(admin, {
    ...input,
    to: input.to ?? configuredReplyTo(),
    kind: 'product_feedback',
    subject: 'New HackProduct feedback',
    eyebrow: 'Product feedback',
    heading: 'A user sent feedback.',
    body: 'Review the latest in-app feedback from HackProduct.',
    detail,
    ctaLabel: input.path ? 'Open surface' : null,
    ctaUrl: input.path ? appUrl(input.path) : null,
  })
}

// ─── Lifecycle / conversion senders (free users) ──────────────────────────────

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
