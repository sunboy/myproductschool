import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeAiOutput } from '@/lib/ai/sanitize'
import { configuredFromEmail, configuredReplyTo, getResendClient } from '@/lib/email/client'

type TransactionalEmailKind =
  | 'verification'
  | 'magic_link'
  | 'password_reset'
  | 'streak_reminder'
  | 'weekly_digest'
  | 'challenge_completion'
  | 'payment_receipt'
  | 'payment_failed'
  | 'trial_ending'
  | 'affiliate_payout'
  | 'cancellation_confirmed'
  | 'cancellation_scheduled'
  | 'subscription_reactivated'
  | 'plan_changed'
  | 'discussion_reply'
  | 'account_deleted'
  | 'abuse_report'

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

function actionButton(href: string | null | undefined, label: string | null | undefined) {
  if (!href || !label) return ''
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#2d5a3d;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700;font-size:14px;">
      ${escapeHtml(label)}
    </a>
  `
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

function renderHtmlEmail(input: TransactionalEmailPayload) {
  const name = input.name?.trim()
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  const detail = input.detail
    ? `<p style="margin:16px 0 0;color:#4f5a51;font-size:14px;line-height:1.6;">${escapeHtml(input.detail)}</p>`
    : ''

  return `
    <div style="margin:0;padding:0;background:#f8f3ea;font-family:Inter,Arial,sans-serif;color:#233028;">
      <div style="max-width:560px;margin:0 auto;padding:36px 20px;">
        <div style="margin-bottom:20px;">
          <img src="${appUrl('/images/wordmark.png')}" alt="HackProduct" style="height:40px;width:auto;" />
        </div>
        <div style="background:#ffffff;border:1px solid #d7d2c8;border-radius:18px;overflow:hidden;">
          <div style="background:#2d5a3d;padding:22px 24px;color:#ffffff;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;color:rgba(255,255,255,.62);">${escapeHtml(input.eyebrow)}</div>
            <h1 style="margin:8px 0 0;font-size:25px;line-height:1.15;letter-spacing:-.02em;">${escapeHtml(input.heading)}</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 14px;color:#233028;font-size:15px;line-height:1.7;">${greeting}</p>
            <p style="margin:0;color:#4f5a51;font-size:15px;line-height:1.7;">${escapeHtml(input.body)}</p>
            ${detail}
            ${input.ctaUrl ? `<div style="margin-top:24px;">${actionButton(input.ctaUrl, input.ctaLabel)}</div>` : ''}
          </div>
        </div>
        <p style="margin:18px 0 0;color:#74796e;font-size:12px;line-height:1.6;">
          You are receiving this because you have a HackProduct account.
          ${input.unsubscribeUrl ? `<br /><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#2d5a3d;text-decoration:underline;">Unsubscribe</a>` : ''}
        </p>
      </div>
    </div>
  `
}

function renderTextEmail(input: TransactionalEmailPayload) {
  const parts = [
    input.heading,
    '',
    input.name?.trim() ? `Hi ${input.name.trim()},` : 'Hi,',
    input.body,
    input.detail ?? null,
    input.ctaUrl && input.ctaLabel ? `${input.ctaLabel}: ${input.ctaUrl}` : null,
    input.unsubscribeUrl ? `Unsubscribe: ${input.unsubscribeUrl}` : null,
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
  if (!to || !resend) return
  if (await hasSentTransactionalEmail(admin, payload.dedupeKey)) return

  try {
    const emailPayload = cleanAiDynamicText({ ...payload, to })
    const { data, error } = await resend.emails.send(
      {
        from: configuredFromEmail(),
        to,
        replyTo: configuredReplyTo(),
        subject: payload.subject,
        html: renderHtmlEmail(emailPayload),
        text: renderTextEmail(emailPayload),
      },
      { idempotencyKey: payload.dedupeKey.slice(0, 256) }
    )

    await admin.from('email_dedupes').upsert({
      dedupe_key: payload.dedupeKey,
      user_id: payload.userId ?? null,
      recipient: to,
      template: payload.kind,
      status: error ? 'failed' : 'sent',
      resend_email_id: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
  } catch (error) {
    await admin.from('email_dedupes').upsert({
      dedupe_key: payload.dedupeKey,
      user_id: payload.userId ?? null,
      recipient: to,
      template: payload.kind,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Resend error',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
  }
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
