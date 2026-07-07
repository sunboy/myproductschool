// Reading time estimate for blog_posts.reading_minutes. 220 wpm matches the
// commonly cited average adult silent-reading speed for online prose.
const WORDS_PER_MINUTE = 220

/**
 * Strips the syntax noise that would otherwise inflate a naive word count
 * (code fences, image/link markup, heading hashes) before counting words.
 */
function stripMarkdownSyntax(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#-]/g, ' ')
}

export function estimateReadingMinutes(markdown: string): number {
  const text = stripMarkdownSyntax(markdown ?? '').trim()
  if (!text) return 1

  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}
