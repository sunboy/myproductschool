import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendCustomHtmlEmail } from '@/lib/email/transactional'
import { configuredFromEmail } from '@/lib/email/client'

// Terra palette, email-safe hex (matches transactional.ts COLOR — no CSS vars).
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

const NEWSLETTER_HEADER_URL = 'https://www.hackproduct.com/hatch/newsletter-header.png'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/** https-only (and mailto: for links), matching the safeMarkdownUrl rule in Md.tsx. */
function safeUrl(value: string, allowMailto = false) {
  const trimmed = value.trim()
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:') return trimmed
    if (allowMailto && url.protocol === 'mailto:') return trimmed
  } catch {
    return ''
  }
  return ''
}

/**
 * Small, conservative markdown → email-safe HTML converter. Deliberately not
 * a general-purpose renderer: handles the subset newsletter copy needs
 * (headings, paragraphs, bold/italic, links, lists, blockquote, inline
 * code) with inline styles only (table-safe layout, no <style> blocks,
 * no scripts, https-only link/image URLs).
 */
export function markdownToEmailHtml(markdown: string): string {
  const lines = (markdown ?? '').replace(/\r\n/g, '\n').split('\n')
  const htmlParts: string[] = []
  let paragraphBuffer: string[] = []
  let listBuffer: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let quoteBuffer: string[] = []

  const pStyle = `margin:0 0 16px;color:${COLOR.muted};font-size:15px;line-height:1.7;`
  const hStyles: Record<number, string> = {
    1: `margin:28px 0 12px;color:${COLOR.ink};font-size:22px;line-height:1.3;font-weight:800;`,
    2: `margin:24px 0 10px;color:${COLOR.ink};font-size:19px;line-height:1.35;font-weight:800;`,
    3: `margin:20px 0 8px;color:${COLOR.ink};font-size:16px;line-height:1.4;font-weight:700;`,
  }

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return
    const text = inlineToHtml(paragraphBuffer.join(' '))
    htmlParts.push(`<p style="${pStyle}">${text}</p>`)
    paragraphBuffer = []
  }

  function flushList() {
    if (listBuffer.length === 0 || !listType) return
    const itemStyle = `margin:0 0 8px;color:${COLOR.muted};font-size:15px;line-height:1.6;`
    const items = listBuffer
      .map(item => `<li style="${itemStyle}">${inlineToHtml(item)}</li>`)
      .join('')
    const tag = listType
    const listStyle = `margin:0 0 16px;padding-left:22px;`
    htmlParts.push(`<${tag} style="${listStyle}">${items}</${tag}>`)
    listBuffer = []
    listType = null
  }

  function flushQuote() {
    if (quoteBuffer.length === 0) return
    const text = inlineToHtml(quoteBuffer.join(' '))
    htmlParts.push(
      `<blockquote style="margin:0 0 16px;padding:4px 0 4px 16px;border-left:3px solid ${COLOR.primary};color:${COLOR.faint};font-size:15px;line-height:1.6;font-style:italic;">${text}</blockquote>`
    )
    quoteBuffer = []
  }

  function flushAll() {
    flushParagraph()
    flushList()
    flushQuote()
  }

  function inlineToHtml(text: string) {
    let escaped = escapeHtml(text)
    // Inline code: `code`
    escaped = escaped.replace(/`([^`]+)`/g, (_m, code: string) => {
      return `<code style="background:${COLOR.bg};border:1px solid ${COLOR.border};border-radius:4px;padding:1px 5px;font-family:ui-monospace,Menlo,monospace;font-size:13px;">${code}</code>`
    })
    // Bold: **text** or __text__
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;">$1</strong>')
    escaped = escaped.replace(/__([^_]+)__/g, '<strong style="font-weight:700;">$1</strong>')
    // Italic: *text* or _text_
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    escaped = escaped.replace(/(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>')
    // Links: [label](https://...)
    escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label: string, href: string) => {
      const url = safeUrl(href)
      if (!url) return label
      return `<a href="${escapeHtml(url)}" style="color:${COLOR.primary};text-decoration:underline;">${label}</a>`
    })
    return escaped
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line)
    const ulMatch = /^[-*]\s+(.*)$/.exec(line)
    const olMatch = /^\d+\.\s+(.*)$/.exec(line)
    const quoteMatch = /^>\s?(.*)$/.exec(line)

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      flushQuote()
      continue
    }

    if (headingMatch) {
      flushAll()
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3
      htmlParts.push(`<h${level} style="${hStyles[level]}">${inlineToHtml(headingMatch[2])}</h${level}>`)
      continue
    }

    if (quoteMatch) {
      flushParagraph()
      flushList()
      quoteBuffer.push(quoteMatch[1])
      continue
    }

    if (ulMatch) {
      flushParagraph()
      flushQuote()
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listBuffer.push(ulMatch[1])
      continue
    }

    if (olMatch) {
      flushParagraph()
      flushQuote()
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listBuffer.push(olMatch[1])
      continue
    }

    flushList()
    flushQuote()
    paragraphBuffer.push(line.trim())
  }

  flushAll()
  return htmlParts.join('\n')
}

/** Plaintext fallback: strips markdown markers, keeps line breaks readable. */
function markdownToPlainText(markdown: string): string {
  return (markdown ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '- ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .trim()
}

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
