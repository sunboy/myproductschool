/**
 * Strip markdown formatting from text before passing to TTS.
 * Removes symbols that would be read aloud verbatim (**, *, #, etc.)
 * while preserving numbers, punctuation, and the actual words.
 */
export function stripMarkdownForSpeech(text: string): string {
  return text
    // Fenced code blocks — replace with empty string
    .replace(/```[\s\S]*?```/g, '')
    // Inline code — keep the content, drop the backticks
    .replace(/`([^`]*)`/g, '$1')
    // Single backtick with no pair — drop it
    .replace(/`/g, '')
    // Bold (**text** or __text__)
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/__([^_]*)__/g, '$1')
    // Italic (*text* or _text_)
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/_([^_]*)_/g, '$1')
    // Remaining stray asterisks
    .replace(/\*/g, '')
    .replace(/_/g, ' ')
    // Headings at line start
    .replace(/^#{1,6}\s+/gm, '')
    // Blockquotes
    .replace(/^>\s+/gm, '')
    // Collapse extra whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
