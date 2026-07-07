import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendCustomHtmlEmail } from '@/lib/email/transactional'
import { configuredFromEmail } from '@/lib/email/client'
import {
  NEWSLETTER_COLOR as COLOR,
  escapeHtml,
  markdownToEmailHtml,
  markdownToPlainText,
} from '@/lib/email/newsletter-markdown'

export { markdownToEmailHtml } from '@/lib/email/newsletter-markdown'

const NEWSLETTER_HEADER_URL = 'https://www.hackproduct.com/hatch/newsletter-header.png'

interface RenderNewsletterEmailInput {
  title: string
  dek?: string | null
  bodyMarkdown: string
  heroImageUrl?: string | null
  hatchIntro?: string | null
  unsubscribeUrl: string
  canonicalUrl: string
}

export function renderNewsletterEmail(input: RenderNewsletterEmailInput) {
  const bodyHtml = markdownToEmailHtml(input.bodyMarkdown)
  const hatchIntroHtml = input.hatchIntro
    ? `
          <div style="margin:0 0 22px;padding:16px 18px;background:${COLOR.bg};border:1px solid ${COLOR.border};border-radius:14px;">
            <p style="margin:0;color:${COLOR.ink};font-size:14px;line-height:1.65;font-style:italic;">${escapeHtml(input.hatchIntro)}</p>
          </div>`
    : ''

  const heroBlock = input.heroImageUrl
    ? `
          <div style="text-align:center;">
            <img src="${escapeHtml(input.heroImageUrl)}" alt="" width="560" style="width:100%;max-width:560px;height:auto;display:block;" />
          </div>`
    : ''

  const dekHtml = input.dek
    ? `<p style="margin:8px 0 0;color:${COLOR.faint};font-size:15px;line-height:1.5;">${escapeHtml(input.dek)}</p>`
    : ''

  const html = `
    <div style="margin:0;padding:0;background:${COLOR.bg};font-family:Inter,Arial,sans-serif;color:${COLOR.ink};">
      <div style="max-width:600px;margin:0 auto;padding:36px 20px;">
        <div style="margin-bottom:20px;text-align:center;">
          <img src="${NEWSLETTER_HEADER_URL}" alt="The HackProduct Letter" style="height:44px;width:auto;display:inline-block;" />
        </div>
        <div style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:18px;overflow:hidden;">
          ${heroBlock}
          <div style="padding:28px 26px 8px;">
            <h1 style="margin:0;color:${COLOR.ink};font-size:26px;line-height:1.2;letter-spacing:-.02em;font-weight:800;">${escapeHtml(input.title)}</h1>
            ${dekHtml}
          </div>
          <div style="padding:18px 26px 26px;">
            ${hatchIntroHtml}
            ${bodyHtml}
            <div style="margin-top:22px;text-align:center;">
              <a href="${escapeHtml(input.canonicalUrl)}" style="display:inline-block;background:${COLOR.primary};color:${COLOR.primaryText};border:1px solid ${COLOR.primary};text-decoration:none;border-radius:999px;padding:12px 24px;font-weight:700;font-size:14px;line-height:1;">Read on the blog</a>
            </div>
            <p style="margin:26px 0 0;color:${COLOR.ink};font-size:15px;line-height:1.6;">&mdash; Hatch, HackProduct's coach</p>
          </div>
        </div>
        <p style="margin:18px 0 0;color:${COLOR.faint};font-size:12px;line-height:1.6;">
          You are receiving this because you subscribed to The HackProduct Letter (or have a HackProduct account).
          <br /><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${COLOR.primary};text-decoration:underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `

  const text = [
    input.title,
    input.dek ?? null,
    '',
    input.hatchIntro ?? null,
    input.hatchIntro ? '' : null,
    markdownToPlainText(input.bodyMarkdown),
    '',
    `Read on the blog: ${input.canonicalUrl}`,
    '',
    "— Hatch, HackProduct's coach",
    '',
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ]
    .filter((part): part is string => part !== null)
    .join('\n')

  return { html, text }
}

/** Extracts the bare addr-spec from a "Name <addr>" or plain "addr" from-string. */
function extractAddrSpec(fromEmail: string) {
  const match = /<([^>]+)>/.exec(fromEmail)
  return (match ? match[1] : fromEmail).trim()
}

interface SendNewsletterIssueEmailInput {
  dedupeKey: string
  to: string
  subject: string
  title: string
  dek?: string | null
  bodyMarkdown: string
  heroImageUrl?: string | null
  hatchIntro?: string | null
  unsubscribeUrl: string
  canonicalUrl: string
}

export function sendNewsletterIssueEmail(admin: SupabaseClient, input: SendNewsletterIssueEmailInput) {
  const { html, text } = renderNewsletterEmail({
    title: input.title,
    dek: input.dek,
    bodyMarkdown: input.bodyMarkdown,
    heroImageUrl: input.heroImageUrl,
    hatchIntro: input.hatchIntro,
    unsubscribeUrl: input.unsubscribeUrl,
    canonicalUrl: input.canonicalUrl,
  })

  const from = process.env.RESEND_NEWSLETTER_FROM?.trim()
    || `Hatch (HackProduct) <${extractAddrSpec(configuredFromEmail())}>`

  return sendCustomHtmlEmail(admin, {
    dedupeKey: input.dedupeKey,
    to: input.to,
    subject: input.subject,
    html,
    text,
    from,
    headers: {
      'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })
}
