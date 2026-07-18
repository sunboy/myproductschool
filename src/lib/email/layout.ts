import 'server-only'

import { EMAIL_BRAND } from '@/lib/email/art'

/**
 * Shared email chrome: the ONE place the palette, shell, and section renderers
 * live. transactional.ts and newsletter.ts compose these; billing.ts was
 * deleted in the same change (its live helpers moved to
 * src/lib/stripe/invoice-helpers.ts).
 *
 * Everything renders to inline-styled HTML strings (no CSS vars, no external
 * styles) because mail clients strip everything else. Keep total HTML under
 * ~100KB or Gmail clips the message.
 */

export type EmailTone = 'default' | 'celebratory' | 'urgent'

// Email-safe palette. `primary` is deliberately DARKER than the app's Terra
// primary (#4a7c59): white button/header text on #4a7c59 fails contrast in
// several clients, so emails use the same hue family one step deeper. Do not
// "fix" this back to the app token.
export const COLOR = {
  bg: '#f8f3ea',
  card: '#ffffff',
  border: '#d7d2c8',
  ink: '#233028',
  muted: '#4f5a51',
  faint: '#74796e',
  primary: '#2d5a3d',
  primaryText: '#ffffff',
  amber: '#705c30',
  amberBg: '#fdf3dc',
  amberBorder: '#e8d5a4',
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function toneHeader(tone: EmailTone | undefined) {
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

export function pillButton(
  href: string | null | undefined,
  label: string | null | undefined,
  variant: 'primary' | 'secondary' = 'primary'
) {
  if (!href || !label) return ''
  const styles =
    variant === 'primary'
      ? `background:${COLOR.primary};color:${COLOR.primaryText};border:1px solid ${COLOR.primary};`
      : `background:#ffffff;color:${COLOR.primary};border:1px solid ${COLOR.border};`
  return `<a href="${escapeHtml(href)}" style="display:inline-block;${styles}text-decoration:none;border-radius:999px;padding:12px 22px;font-weight:700;font-size:14px;line-height:1;">${escapeHtml(label)}</a>`
}

export function heroImage(url: string | null | undefined, alt: string | null | undefined) {
  if (!url) return ''
  return `
          <div style="text-align:center;padding:26px 24px 0;">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(alt ?? 'Hatch')}" width="132" style="width:132px;height:auto;display:inline-block;" />
          </div>`
}

export function valueBulletList(bullets: string[] | null | undefined) {
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

export function accentImage(url: string | null | undefined) {
  if (!url) return ''
  return `
            <div style="text-align:center;margin-top:22px;">
              <img src="${escapeHtml(url)}" alt="Hatch" width="96" style="width:96px;height:auto;display:inline-block;opacity:.95;" />
            </div>`
}

/** One stat cell of the 2x2 stat grid. */
export interface EmailStat {
  label: string
  value: string
  sublabel?: string | null
}

/**
 * 2x2 stat card grid (weekly digest numbers, receipts, score summaries).
 * Plain nested tables so Outlook keeps the columns.
 */
export function statGrid(stats: EmailStat[] | null | undefined) {
  if (!stats || stats.length === 0) return ''
  const cell = (stat: EmailStat | undefined) => {
    if (!stat) return '<td style="width:50%;padding:6px;"></td>'
    return `
              <td style="width:50%;padding:6px;" valign="top">
                <div style="background:${COLOR.bg};border:1px solid ${COLOR.border};border-radius:12px;padding:14px 16px;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:${COLOR.faint};">${escapeHtml(stat.label)}</div>
                  <div style="margin-top:6px;font-size:22px;font-weight:800;color:${COLOR.ink};line-height:1.1;">${escapeHtml(stat.value)}</div>
                  ${stat.sublabel ? `<div style="margin-top:4px;font-size:12px;color:${COLOR.muted};">${escapeHtml(stat.sublabel)}</div>` : ''}
                </div>
              </td>`
  }
  const rows: string[] = []
  for (let i = 0; i < stats.length; i += 2) {
    rows.push(`<tr>${cell(stats[i])}${cell(stats[i + 1])}</tr>`)
  }
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px -6px 0;width:calc(100% + 12px);border-collapse:separate;">
              ${rows.join('')}
            </table>`
}

/**
 * Real-deadline strip. Renders NOTHING without an actual date: urgency in
 * HackProduct emails is only ever a fact (streak reset time, trial end date,
 * payment retry window), never manufactured scarcity.
 */
export interface EmailDeadline {
  label: string
  /** ISO date/time the deadline refers to. Invalid or absent = no banner. */
  at: string
}

export function urgencyBanner(deadline: EmailDeadline | null | undefined) {
  if (!deadline?.at || !deadline.label) return ''
  const date = new Date(deadline.at)
  if (Number.isNaN(date.getTime())) return ''
  return `
            <div style="margin-top:20px;background:${COLOR.amberBg};border:1px solid ${COLOR.amberBorder};border-radius:12px;padding:12px 16px;">
              <span style="font-size:13.5px;font-weight:700;color:${COLOR.amber};">&#9200; ${escapeHtml(deadline.label)}</span>
            </div>`
}

/**
 * Bordered content card (the Educative pattern): uppercase eyebrow, bold
 * title, CTA button, then a 2-3 sentence description that sells the content
 * itself. Used for digest recommendations, the paused challenge in resume
 * emails, suggested first reps in the activation drip.
 */
export interface EmailContentCard {
  eyebrow: string
  title: string
  description: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export function contentCards(cards: EmailContentCard[] | null | undefined) {
  if (!cards || cards.length === 0) return ''
  return cards
    .map(
      card => `
            <div style="margin-top:20px;border:2px solid ${COLOR.primary};border-radius:14px;padding:20px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:${COLOR.primary};">${escapeHtml(card.eyebrow)}</div>
              <div style="margin-top:8px;font-size:19px;font-weight:800;color:${COLOR.ink};line-height:1.25;">${escapeHtml(card.title)}</div>
              ${card.ctaUrl && card.ctaLabel ? `<div style="margin-top:14px;">${pillButton(card.ctaUrl, `${card.ctaLabel} →`)}</div>` : ''}
              <p style="margin:14px 0 0;color:${COLOR.muted};font-size:14.5px;line-height:1.65;">${escapeHtml(card.description)}</p>
            </div>`
    )
    .join('')
}

/** Hatch sign-off. `null` suppresses it (internal/admin emails). */
export function signoffBlock(signoff: string | null | undefined) {
  if (signoff === null) return ''
  const text = signoff ?? '— Hatch, your HackProduct coach'
  return `
            <p style="margin:26px 0 0;color:${COLOR.muted};font-size:14.5px;line-height:1.6;font-style:italic;">${escapeHtml(text)}</p>`
}

/**
 * Hidden preview text: the line inbox list views show after the subject.
 * Padded with invisible characters so clients do not pull body text in after it.
 */
export function preheader(text: string | null | undefined) {
  if (!text) return ''
  const pad = '&nbsp;&zwnj;'.repeat(60)
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(text)}${pad}</div>`
}

export interface EmailFooterInput {
  audienceNote?: string | null
  unsubscribeUrl?: string | null
}

export function footerBlock({ audienceNote, unsubscribeUrl }: EmailFooterInput) {
  return `
        <p style="margin:18px 0 0;color:${COLOR.faint};font-size:12px;line-height:1.6;">
          ${escapeHtml(audienceNote ?? 'You are receiving this because you have a HackProduct account.')}
          ${unsubscribeUrl ? `<br /><a href="${escapeHtml(unsubscribeUrl)}" style="color:${COLOR.primary};text-decoration:underline;">Unsubscribe</a>` : ''}
        </p>`
}

export interface EmailShellInput {
  /** Pre-rendered inner card content (everything inside the white card). */
  card: string
  footer: string
  previewText?: string | null
}

/** Outer shell: preheader + cream background + wordmark + white card + footer. */
export function emailShell({ card, footer, previewText }: EmailShellInput) {
  return `
    <div style="margin:0;padding:0;background:${COLOR.bg};font-family:Inter,Arial,sans-serif;color:${COLOR.ink};">
      ${preheader(previewText)}
      <div style="max-width:560px;margin:0 auto;padding:36px 20px;">
        <div style="margin-bottom:20px;text-align:left;">
          <img src="${EMAIL_BRAND.wordmark}" alt="HackProduct" style="height:40px;width:auto;" />
        </div>
        <div style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:18px;overflow:hidden;">
          ${card}
        </div>
        ${footer}
      </div>
    </div>
  `
}

export function toneHeaderBlock(eyebrow: string, heading: string, tone: EmailTone | undefined) {
  const header = toneHeader(tone)
  return `
          <div style="background:${header.bar};padding:22px 24px;color:#ffffff;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;color:${header.eyebrow};">${escapeHtml(eyebrow)}</div>
            <h1 style="margin:8px 0 0;font-size:25px;line-height:1.15;letter-spacing:-.02em;">${escapeHtml(heading)}</h1>
          </div>`
}
