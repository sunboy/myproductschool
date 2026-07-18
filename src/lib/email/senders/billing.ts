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

// Billing senders (tier c: facts first, value reinforcement second, honest
// win-backs, real deadlines only).

export interface PaymentEmailInput extends BaseTransactionalInput {
  planLabel?: string | null
  amount?: number | null
  currency?: string | null
  periodEnd?: string | null
  url?: string | null
}

export function sendPaymentReceiptEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const amount = formatMoney(input.amount, input.currency)
  const periodEnd = formatDate(input.periodEnd)
  const planLabel = input.planLabel ?? 'HackProduct Pro'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_receipt',
    subject: 'Your HackProduct receipt',
    previewText: amount ? `${amount} received. Here is what it covers this month.` : 'Here is what your payment covers this month.',
    eyebrow: 'Payment received',
    heading: 'Your payment is complete.',
    tone: 'default',
    body: `Your ${planLabel} payment went through. The stats below are the receipt; the rest of this email is what that payment keeps active.`,
    bodyParagraphs: [
      'Here is what that covers this month:',
    ],
    stats: [
      amount ? { label: 'Amount', value: amount } : null,
      { label: 'Plan', value: planLabel },
      periodEnd ? { label: 'Next billing date', value: periodEnd } : null,
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
    ],
    ctaLabel: 'View billing',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export interface PaymentFailedInput extends PaymentEmailInput {
  /** Epoch seconds Stripe will retry the charge (invoice.next_payment_attempt). */
  retryAtIso?: string | null
}

export function sendPaymentFailedEmail(admin: SupabaseClient, input: PaymentFailedInput) {
  const amount = formatMoney(input.amount, input.currency)
  const planLabel = input.planLabel ?? 'HackProduct Pro'
  const retryDate = formatDate(input.retryAtIso)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_failed',
    subject: 'Action needed: your HackProduct payment failed',
    previewText: retryDate ? `Stripe will retry on ${retryDate}. Fix it sooner and nothing pauses.` : 'Update billing details to keep Pro access active.',
    eyebrow: 'Payment failed',
    heading: 'Your Pro renewal needs attention.',
    tone: 'urgent',
    body: `Stripe could not collect payment for ${planLabel}. Update your billing details and your access continues without interruption.`,
    bodyParagraphs: [
      'Until this is fixed, here is what pauses: Pro practice limits drop back to the free tier, and live interview sessions are unavailable.',
      'It usually takes under a minute.',
    ],
    stats: [
      amount ? { label: 'Amount due', value: amount } : null,
      { label: 'Plan', value: planLabel },
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    deadline: input.retryAtIso && retryDate
      ? { label: `Stripe retries payment on ${retryDate}`, at: input.retryAtIso }
      : null,
    ctaLabel: 'Fix payment',
    ctaUrl: input.url ?? appUrl('/settings'),
    repeatCta: true,
  })
}

export function sendPaymentActionRequiredEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const planLabel = input.planLabel ?? 'HackProduct Pro'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'payment_action_required',
    subject: 'Action needed: authorize your HackProduct renewal',
    previewText: 'Your bank asked for one more confirmation before it processes the charge.',
    eyebrow: 'Authorize renewal',
    heading: 'One quick step to keep your Pro access.',
    tone: 'urgent',
    body: `Your bank is asking for one more confirmation before it processes your ${planLabel} renewal. This is a standard verification step, not a sign anything is wrong on our end.`,
    bodyParagraphs: [
      'Confirm it from your account and the renewal completes automatically. It takes about 30 seconds.',
    ],
    ctaLabel: 'Authorize renewal',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}

export function sendTrialEndingEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const formattedDate = formatDate(input.periodEnd)
  const price = formatMoney(input.amount, input.currency)
  const planLabel = input.planLabel ?? 'HackProduct Pro'
  const daysLeft = (() => {
    if (!input.periodEnd) return null
    const end = new Date(input.periodEnd)
    if (Number.isNaN(end.getTime())) return null
    const diffMs = end.getTime() - Date.now()
    return Math.max(1, Math.round(diffMs / (24 * 60 * 60 * 1000)))
  })()

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'trial_ending',
    subject: formattedDate ? `Your Pro trial ends ${formattedDate}` : 'Your HackProduct Pro trial ends soon',
    previewText: 'No surprise charges is the whole point of this email.',
    eyebrow: 'Trial ending',
    heading: daysLeft ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your Pro trial.` : 'Your Pro trial is ending soon.',
    tone: 'urgent',
    heroImageUrl: EMAIL_ART['hatch-unlock'],
    body: formattedDate
      ? `Your 7-day Pro trial ends on ${formattedDate}. After that, ${planLabel} starts automatically${price ? ` at ${price}` : ''} unless you cancel first. No surprise charges is the whole point of this email.`
      : `Your 7-day Pro trial is ending soon. After that, ${planLabel} starts automatically${price ? ` at ${price}` : ''} unless you cancel first. No surprise charges is the whole point of this email.`,
    bodyParagraphs: [
      'Here is what stays if you keep Pro, so the decision is easy:',
      formattedDate
        ? `If Pro is not for you right now, cancel in one click from settings before ${formattedDate} and you will not be charged. Everything you practiced stays on your account either way.`
        : 'If Pro is not for you right now, cancel in one click from settings and you will not be charged. Everything you practiced stays on your account either way.',
    ],
    valueBullets: [
      '80 practice questions a month instead of 3',
      'Live interview sessions with spoken feedback',
      'Strengths and gaps tracked across everything you do',
      '40+ breakdowns of real product decisions',
    ],
    deadline: input.periodEnd && formattedDate
      ? { label: `Trial ends ${formattedDate}`, at: input.periodEnd }
      : null,
    ctaLabel: 'Keep Pro',
    ctaUrl: input.url ?? appUrl('/settings'),
    secondaryCta: { label: 'Manage or cancel', url: appUrl('/settings') },
  })
}

export function sendAffiliatePayoutEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const amount = formatMoney(input.amount, input.currency)

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'affiliate_payout',
    subject: 'Your HackProduct affiliate payout is on the way',
    previewText: amount ? `${amount} is headed to your connected account.` : 'Your referral commission is on the way.',
    eyebrow: 'Affiliate payout',
    heading: 'Your referral commission was paid.',
    tone: 'celebratory',
    body: amount
      ? `${amount} from your HackProduct referrals is on its way to your connected account. Thanks for sending people our way.`
      : 'Your HackProduct affiliate payout is on its way to your connected account. Thanks for sending people our way.',
    stats: [
      amount ? { label: 'Amount', value: amount } : null,
      { label: 'Destination', value: 'Connected Stripe account' },
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    ctaLabel: 'View affiliate dashboard',
    ctaUrl: input.url ?? appUrl('/affiliate'),
  })
}

export function sendCancellationConfirmedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'cancellation_confirmed',
    subject: 'HackProduct Pro has ended',
    previewText: 'Free practice limits are still there whenever you want a rep.',
    eyebrow: 'Subscription ended',
    heading: 'Your account is now on Free.',
    tone: 'default',
    body: 'Your Pro subscription has ended and your account is back on the Free plan. Nothing you built is gone.',
    bodyParagraphs: [
      'Free still includes: 3 practice challenges a month, your full history and feedback, and streak and XP tracking.',
      'If a heavier practice week comes up, Pro is one click away, and your progress picks up right where you left it.',
    ],
    ctaLabel: 'Open dashboard',
    ctaUrl: input.url ?? appUrl('/dashboard'),
    secondaryCta: { label: 'See Pro again', url: appUrl('/settings') },
  })
}

export function sendCancellationScheduledEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)
  const planLabel = input.planLabel ?? 'HackProduct Pro'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'cancellation_scheduled',
    subject: 'HackProduct Pro cancellation scheduled',
    previewText: periodEnd ? `Pro access continues through ${periodEnd}, then moves to Free.` : 'Pro access continues until the current period ends.',
    eyebrow: 'Plan change',
    heading: 'Pro stays active for now.',
    tone: 'default',
    body: `${planLabel} is set to end at the close of the current billing period. You keep full Pro access until then, and you will not be charged again.`,
    bodyParagraphs: [
      'After that date, your account moves to Free: 3 practice challenges a month, with your full history and progress intact.',
      'Changed your mind? Reactivating takes one click and keeps your current billing date.',
    ],
    stats: [
      { label: 'Plan', value: planLabel },
      periodEnd ? { label: 'Access ends', value: periodEnd } : null,
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    deadline: input.periodEnd && periodEnd
      ? { label: `Pro access ends ${periodEnd}`, at: input.periodEnd }
      : null,
    ctaLabel: 'Manage subscription',
    ctaUrl: input.url ?? appUrl('/settings'),
    secondaryCta: { label: 'Keep Pro', url: appUrl('/settings') },
  })
}

export function sendSubscriptionReactivatedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)
  const planLabel = input.planLabel ?? 'HackProduct Pro'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'subscription_reactivated',
    subject: 'HackProduct Pro is active again',
    previewText: periodEnd ? `Billing continues on ${periodEnd}. Nothing else changes.` : 'Your Pro subscription will continue.',
    eyebrow: 'Plan active',
    heading: 'Your Pro subscription will continue.',
    tone: 'celebratory',
    body: `The scheduled cancellation on ${planLabel} was removed. Your access continues without a gap.`,
    stats: [
      { label: 'Plan', value: planLabel },
      periodEnd ? { label: 'Next billing date', value: periodEnd } : null,
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    ctaLabel: 'Open dashboard',
    ctaUrl: input.url ?? appUrl('/dashboard'),
  })
}

export function sendPlanChangedEmail(admin: SupabaseClient, input: PaymentEmailInput) {
  const periodEnd = formatDate(input.periodEnd)
  const planLabel = input.planLabel ?? 'HackProduct Pro'

  return sendTransactionalEmail(admin, {
    ...input,
    kind: 'plan_changed',
    subject: 'HackProduct Pro plan updated',
    previewText: periodEnd ? `Your next charge is on ${periodEnd} at the new plan.` : 'Your billing interval and access have been updated.',
    eyebrow: 'Billing updated',
    heading: `You're now on ${planLabel}.`,
    tone: 'default',
    body: `Your billing interval changed to ${planLabel}. Your Pro access is unaffected and continues without interruption.`,
    stats: [
      { label: 'New plan', value: planLabel },
      periodEnd ? { label: 'Next billing date', value: periodEnd } : null,
    ].filter((s): s is NonNullable<typeof s> => s !== null),
    ctaLabel: 'View billing',
    ctaUrl: input.url ?? appUrl('/settings'),
  })
}
