import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { configuredFromEmail, configuredReplyTo, getResendClient } from '@/lib/email/client'

type BillingEmailKind =
  | 'premium_signup_receipt'
  | 'renewal_receipt'
  | 'payment_failed'
  | 'cancellation_scheduled'
  | 'subscription_reactivated'
  | 'subscription_ended'
  | 'plan_changed'

interface BillingEmailInput {
  kind: BillingEmailKind
  dedupeKey: string
  userId?: string | null
  to?: string | null
  customerEmail?: string | null
  customerName?: string | null
  planLabel?: string | null
  amountPaid?: number | null
  amountDue?: number | null
  currency?: string | null
  periodEnd?: string | null
  invoiceUrl?: string | null
  invoicePdf?: string | null
  hostedPaymentUrl?: string | null
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function actionButton(href: string | null | undefined, label: string) {
  if (!href) return ''
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#2d5a3d;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700;font-size:14px;">
      ${escapeHtml(label)}
    </a>
  `
}

function emailCopy(input: BillingEmailInput) {
  const plan = input.planLabel ?? 'HackProduct Pro'
  const amountPaid = formatMoney(input.amountPaid, input.currency)
  const amountDue = formatMoney(input.amountDue, input.currency)
  const periodEnd = formatDate(input.periodEnd)

  switch (input.kind) {
    case 'premium_signup_receipt':
      return {
        subject: 'Welcome to HackProduct Pro',
        eyebrow: 'Premium active',
        heading: 'Your Pro workspace is ready.',
        body: `You're now on ${plan}. Your receipt is ready in Stripe, and Pro limits are active in HackProduct.`,
        detail: amountPaid ? `Amount paid: ${amountPaid}` : null,
        cta: actionButton(input.invoiceUrl ?? input.invoicePdf, 'View receipt'),
      }
    case 'renewal_receipt':
      return {
        subject: 'Your HackProduct Pro receipt',
        eyebrow: 'Renewal paid',
        heading: 'Thanks for staying sharp with Pro.',
        body: `Your ${plan} subscription renewed successfully.`,
        detail: [amountPaid ? `Amount paid: ${amountPaid}` : null, periodEnd ? `Next cycle starts after ${periodEnd}.` : null].filter(Boolean).join(' '),
        cta: actionButton(input.invoiceUrl ?? input.invoicePdf, 'View invoice'),
      }
    case 'payment_failed':
      return {
        subject: 'Action needed: HackProduct payment failed',
        eyebrow: 'Payment failed',
        heading: 'Your Pro renewal needs attention.',
        body: `Stripe could not collect payment for ${plan}. Update your billing details to keep premium access uninterrupted.`,
        detail: amountDue ? `Amount due: ${amountDue}` : null,
        cta: actionButton(input.hostedPaymentUrl ?? input.invoiceUrl, 'Fix payment'),
      }
    case 'cancellation_scheduled':
      return {
        subject: 'HackProduct Pro cancellation scheduled',
        eyebrow: 'Plan change',
        heading: 'Your Pro access stays active for now.',
        body: `Your ${plan} subscription is set to end at the close of the current billing period.`,
        detail: periodEnd ? `Access continues through ${periodEnd}.` : null,
        cta: '',
      }
    case 'subscription_reactivated':
      return {
        subject: 'HackProduct Pro is active again',
        eyebrow: 'Plan active',
        heading: 'Your Pro subscription will continue.',
        body: `Cancellation was removed from your ${plan} subscription.`,
        detail: periodEnd ? `Your next billing date is ${periodEnd}.` : null,
        cta: '',
      }
    case 'subscription_ended':
      return {
        subject: 'HackProduct Pro has ended',
        eyebrow: 'Subscription ended',
        heading: 'Your account is now on the free plan.',
        body: 'You can still practice with free monthly limits. Upgrade again any time from Settings.',
        detail: null,
        cta: actionButton(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings`, 'Open settings'),
      }
    case 'plan_changed':
      return {
        subject: 'HackProduct Pro plan updated',
        eyebrow: 'Billing updated',
        heading: `You're now on ${plan}.`,
        body: 'Your billing interval and Pro access have been updated.',
        detail: periodEnd ? `Next billing date: ${periodEnd}.` : null,
        cta: '',
      }
  }
}

function renderEmail(input: BillingEmailInput) {
  const copy = emailCopy(input)
  const name = input.customerName?.trim()
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
  const detail = copy.detail
    ? `<p style="margin:16px 0 0;color:#4f5a51;font-size:14px;line-height:1.6;">${escapeHtml(copy.detail)}</p>`
    : ''

  return `
    <div style="margin:0;padding:0;background:#f8f3ea;font-family:Inter,Arial,sans-serif;color:#233028;">
      <div style="max-width:560px;margin:0 auto;padding:36px 20px;">
        <div style="margin-bottom:20px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/images/wordmark.png" alt="HackProduct" style="height:40px;width:auto;" />
        </div>
        <div style="background:#ffffff;border:1px solid #d7d2c8;border-radius:18px;overflow:hidden;">
          <div style="background:#2d5a3d;padding:22px 24px;color:#ffffff;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;color:rgba(255,255,255,.62);">${escapeHtml(copy.eyebrow)}</div>
            <h1 style="margin:8px 0 0;font-size:25px;line-height:1.15;letter-spacing:-.02em;">${escapeHtml(copy.heading)}</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 14px;color:#233028;font-size:15px;line-height:1.7;">${greeting}</p>
            <p style="margin:0;color:#4f5a51;font-size:15px;line-height:1.7;">${escapeHtml(copy.body)}</p>
            ${detail}
            ${copy.cta ? `<div style="margin-top:24px;">${copy.cta}</div>` : ''}
          </div>
        </div>
        <p style="margin:18px 0 0;color:#74796e;font-size:12px;line-height:1.6;">
          HackProduct billing is processed securely by Stripe. Replies go to the HackProduct team.
        </p>
      </div>
    </div>
  `
}

function renderTextEmail(input: BillingEmailInput) {
  const copy = emailCopy(input)
  const name = input.customerName?.trim()
  const parts = [
    copy.heading,
    '',
    name ? `Hi ${name},` : 'Hi,',
    copy.body,
    copy.detail ?? null,
    input.invoiceUrl ? `View invoice: ${input.invoiceUrl}` : null,
    input.invoicePdf ? `Invoice PDF: ${input.invoicePdf}` : null,
    input.hostedPaymentUrl ? `Payment link: ${input.hostedPaymentUrl}` : null,
  ].filter(Boolean)

  return parts.join('\n')
}

async function resolveRecipient(admin: SupabaseClient, input: BillingEmailInput) {
  if (input.to) return input.to
  if (input.customerEmail) return input.customerEmail
  if (!input.userId) return null

  const { data } = await admin.auth.admin.getUserById(input.userId)
  return data.user?.email ?? null
}

async function hasSentBillingEmail(admin: SupabaseClient, dedupeKey: string) {
  const { data } = await admin
    .from('billing_email_events')
    .select('id, status')
    .eq('dedupe_key', dedupeKey)
    .eq('status', 'sent')
    .maybeSingle()

  return !!data
}

export async function sendBillingEmail(admin: SupabaseClient, input: BillingEmailInput) {
  const to = await resolveRecipient(admin, input)
  const resend = getResendClient()
  if (!to || !resend) return
  if (await hasSentBillingEmail(admin, input.dedupeKey)) return

  const copy = emailCopy(input)

  try {
    const { data, error } = await resend.emails.send(
      {
        from: configuredFromEmail(),
        to,
        replyTo: configuredReplyTo(),
        subject: copy.subject,
        html: renderEmail({ ...input, to }),
        text: renderTextEmail({ ...input, to }),
      },
      { idempotencyKey: input.dedupeKey.slice(0, 256) }
    )

    await admin.from('billing_email_events').upsert({
      dedupe_key: input.dedupeKey,
      stripe_event_id: input.dedupeKey.split(':')[0] ?? null,
      user_id: input.userId ?? null,
      recipient: to,
      template: input.kind,
      status: error ? 'failed' : 'sent',
      resend_email_id: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
  } catch (error) {
    await admin.from('billing_email_events').upsert({
      dedupe_key: input.dedupeKey,
      stripe_event_id: input.dedupeKey.split(':')[0] ?? null,
      user_id: input.userId ?? null,
      recipient: to,
      template: input.kind,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Resend error',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
  }
}

export function planLabelFromInterval(interval?: string | null) {
  return interval === 'year' ? 'HackProduct Pro Annual' : 'HackProduct Pro Monthly'
}

export function invoicePeriodEnd(invoice: Stripe.Invoice) {
  const line = invoice.lines?.data?.[0]
  const periodEnd = line?.period?.end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}
