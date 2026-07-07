// Pure markdown → email-safe HTML helpers for the newsletter renderer.
// Deliberately split out of newsletter.ts (which is 'server-only') so this
// pure, side-effect-free logic stays unit-testable with plain node:test.

// Terra palette, email-safe hex (matches transactional.ts COLOR — no CSS vars).
export const NEWSLETTER_COLOR = {
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

export function escapeHtml(value: string) {
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
  const COLOR = NEWSLETTER_COLOR
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
export function markdownToPlainText(markdown: string): string {
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
