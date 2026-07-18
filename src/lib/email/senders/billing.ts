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

// Billing senders (tier c: facts first, value reinforcement second).

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
