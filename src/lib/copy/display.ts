export function cleanDisplayCopy(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/\s*(?:—|--|&mdash;)\s*/g, ', ')
    .replace(/[ \t]+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function cardSummary(value: string | null | undefined, maxChars = 140): string {
  let text = cleanDisplayCopy(value)
  // Strip fenced code blocks (``` ... ```)
  text = text.replace(/```[\s\S]*?```/g, '')
  // Strip inline code
  text = text.replace(/`[^`]*`/g, '')
  // Strip markdown headings
  text = text.replace(/^#{1,6}\s+/gm, '')
  // Strip bold/italic markers
  text = text.replace(/\*\*([^*]*)\*\*/g, '$1').replace(/__([^_]*)__/g, '$1')
  text = text.replace(/\*([^*]*)\*/g, '$1').replace(/_([^_]*)_/g, '$1')
  // Strip bullets at start of line
  text = text.replace(/^[-*]\s+/gm, '')
  // Strip pipe table lines
  text = text.replace(/^.*\|.*$/gm, '')
  // Collapse repeated newlines / whitespace to single space
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxChars) {
    text = text.slice(0, maxChars).replace(/\s+\S*$/, '') + '...'
  }
  return text
}
