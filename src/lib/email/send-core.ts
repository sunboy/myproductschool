import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeAiOutput } from '@/lib/ai/sanitize'
import { EMAIL_ART } from '@/lib/email/art'
import { configuredFromEmail, configuredReplyTo, getResendClient } from '@/lib/email/client'
import {
  accentImage,
  contentCards,
  emailShell,
  footerBlock,
  heroImage,
  pillButton,
  signoffBlock,
  statGrid,
  toneHeaderBlock,
  urgencyBanner,
  valueBulletList,
  escapeHtml,
  COLOR,
  type EmailContentCard,
  type EmailDeadline,
  type EmailStat,
  type EmailTone,
} from '@/lib/email/layout'

export type TransactionalEmailKind =
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
  | 'lead_magnet_unlock'
  | 'activation_day1'
  | 'activation_day3'
  | 'activation_day7'
  | 'growth_report'

export interface BaseTransactionalInput {
  dedupeKey: string
  userId?: string | null
  to?: string | null
  name?: string | null
  unsubscribeUrl?: string | null
}

















interface SecondaryCta {
  label: string
  url: string
}

export interface TransactionalEmailPayload extends BaseTransactionalInput {
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
  /** Additional body paragraphs rendered after `body` (each its own <p>). */
  bodyParagraphs?: string[] | null
  /**
   * Footer line explaining why the recipient got this email. Defaults to the
   * account-holder line; lead-magnet emails override it since leads have no
   * account.
   */
  audienceNote?: string | null
  /** Inbox preview line shown after the subject. Falls back to `body`. */
  previewText?: string | null
  /** 2x2 stat cards (digest numbers, receipt facts). */
  stats?: EmailStat[] | null
  /** REAL deadline strip — requires an actual date or nothing renders. */
  deadline?: EmailDeadline | null
  /** Bordered content cards after the prose (Educative pattern). */
  contentCards?: EmailContentCard[] | null
  /** Repeat the primary CTA before the sign-off (long emails only). */
  repeatCta?: boolean
  /** Hatch sign-off text; undefined = default line, null = suppressed. */
  signoff?: string | null
}

export function appUrl(path = '/') {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return new URL(path, base).toString()
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
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

export function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
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
 * preview harness (/admin/emails) and its test-send route.
 */
export function renderEmailForPreview(input: TransactionalEmailPayload) {
  return { html: renderHtmlEmail(input), text: renderTextEmail(input) }
}

function renderHtmlEmail(input: TransactionalEmailPayload) {
  const name = input.name?.trim()
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,'
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

  // Long emails repeat the primary CTA before the sign-off so the reader who
  // scrolled past the first button never has to scroll back up.
  const repeatCtaBlock =
    input.repeatCta && input.ctaUrl && input.ctaLabel
      ? `
            <div style="margin-top:26px;">
              ${pillButton(input.ctaUrl, input.ctaLabel, 'primary')}
            </div>`
      : ''

  const card = `
          ${heroImage(input.heroImageUrl, input.heroAlt)}
          ${toneHeaderBlock(input.eyebrow, input.heading, input.tone)}
          <div style="padding:24px;">
            <p style="margin:0 0 14px;color:${COLOR.ink};font-size:15px;line-height:1.7;">${greeting}</p>
            <p style="margin:0;color:${COLOR.muted};font-size:15px;line-height:1.7;">${escapeHtml(input.body)}</p>
            ${(input.bodyParagraphs ?? [])
              .map(
                (p) =>
                  `<p style="margin:14px 0 0;color:${COLOR.muted};font-size:15px;line-height:1.7;">${escapeHtml(p)}</p>`,
              )
              .join('')}
            ${detail}
            ${urgencyBanner(input.deadline)}
            ${statGrid(input.stats)}
            ${valueBulletList(input.valueBullets)}
            ${ctaBlock}
            ${contentCards(input.contentCards)}
            ${repeatCtaBlock}
            ${accentImage(input.accentImageUrl)}
            ${signoffBlock(input.signoff)}
          </div>`

  return emailShell({
    card,
    footer: footerBlock({ audienceNote: input.audienceNote, unsubscribeUrl: input.unsubscribeUrl }),
    previewText: input.previewText ?? input.body,
  })
}

function renderTextEmail(input: TransactionalEmailPayload) {
  const bullets =
    input.valueBullets && input.valueBullets.length > 0
      ? input.valueBullets.map(b => `- ${b}`).join('\n')
      : null
  const stats =
    input.stats && input.stats.length > 0
      ? input.stats.map(s => `${s.label}: ${s.value}${s.sublabel ? ` (${s.sublabel})` : ''}`).join('\n')
      : null
  const cards =
    input.contentCards && input.contentCards.length > 0
      ? input.contentCards
          .map(c => [`${c.eyebrow}: ${c.title}`, c.description, c.ctaUrl && c.ctaLabel ? `${c.ctaLabel}: ${c.ctaUrl}` : null].filter(Boolean).join('\n'))
          .join('\n\n')
      : null
  const deadline =
    input.deadline?.at && !Number.isNaN(new Date(input.deadline.at).getTime())
      ? input.deadline.label
      : null

  const parts = [
    input.heading,
    '',
    input.name?.trim() ? `Hi ${input.name.trim()},` : 'Hi,',
    input.body,
    ...(input.bodyParagraphs ?? []).map((p) => `\n${p}`),
    input.detail ?? null,
    deadline ? `\n${deadline}` : null,
    stats ? `\n${stats}` : null,
    bullets ? `\n${bullets}` : null,
    input.ctaUrl && input.ctaLabel ? `\n${input.ctaLabel}: ${input.ctaUrl}` : null,
    input.secondaryCta ? `${input.secondaryCta.label}: ${input.secondaryCta.url}` : null,
    cards ? `\n${cards}` : null,
    input.signoff === null ? null : `\n${input.signoff ?? '— Hatch, your HackProduct coach'}`,
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

export async function sendTransactionalEmail(admin: SupabaseClient, payload: TransactionalEmailPayload) {
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































// ─── Custom pre-rendered HTML sender (newsletter, one-off editorial sends) ────

interface SendCustomHtmlEmailInput {
  dedupeKey: string
  to: string
  subject: string
  html: string
  text: string
  from?: string
  headers?: Record<string, string>
}

/**
 * Send a fully pre-rendered HTML/text email. Reuses the same email_dedupes +
 * Resend idempotency flow as sendTransactionalEmail, but skips template
 * rendering entirely — the caller (e.g. the newsletter sender) owns the HTML.
 */
export async function sendCustomHtmlEmail(admin: SupabaseClient, input: SendCustomHtmlEmailInput) {
  const resend = getResendClient()
  if (!input.to || !resend) {
    console.warn('[email] short-circuit', {
      kind: 'custom_html',
      dedupeKey: input.dedupeKey,
      missing: !input.to && !resend ? 'recipient+resend' : !input.to ? 'recipient' : 'resend',
    })
    return
  }
  if (await hasSentTransactionalEmail(admin, input.dedupeKey)) return

  try {
    const { data, error } = await resend.emails.send(
      {
        from: input.from ?? configuredFromEmail(),
        to: input.to,
        replyTo: configuredReplyTo(),
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: input.headers,
      },
      { idempotencyKey: input.dedupeKey.slice(0, 256) }
    )

    const { error: upsertError } = await admin.from('email_dedupes').upsert({
      dedupe_key: input.dedupeKey,
      user_id: null,
      recipient: input.to,
      template: 'custom_html',
      status: error ? 'failed' : 'sent',
      resend_email_id: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
    if (upsertError) {
      console.error('[email] email_dedupes upsert failed (post-send)', {
        kind: 'custom_html',
        dedupeKey: input.dedupeKey,
        error: upsertError.message,
        code: (upsertError as { code?: string }).code,
      })
    }
  } catch (error) {
    const { error: upsertError } = await admin.from('email_dedupes').upsert({
      dedupe_key: input.dedupeKey,
      user_id: null,
      recipient: input.to,
      template: 'custom_html',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown Resend error',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'dedupe_key' })
    if (upsertError) {
      console.error('[email] email_dedupes upsert failed (catch path)', {
        kind: 'custom_html',
        dedupeKey: input.dedupeKey,
        error: upsertError.message,
        code: (upsertError as { code?: string }).code,
      })
    }
  }
}

