function isMarkdownLine(line: string) {
  return /^(\s{0,3}[-*+]\s+|\s{0,3}\d+\.\s+|\s{0,3}#{1,6}\s+|\s{0,3}>\s+|\s{0,3}\|)/.test(line)
}

function normalizeLine(line: string) {
  return line
    .replace(/^\s*[\u2022\u2023\u25e6]\s+/u, '- ')
    .replace(/^(\s*\d+)\)\s+/, '$1. ')
    .trim()
}

export function formatFeedbackMarkdown(value: string | null | undefined) {
  const text = (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  if (!text) return ''
  if (text.includes('```')) return text

  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map(normalizeLine)
        .filter(Boolean)

      if (lines.length <= 1) return lines[0] ?? ''
      if (lines.every(isMarkdownLine)) return lines.join('\n')

      const looksLikeList = lines.length <= 6 && lines.every((line) => line.length <= 180)
      if (looksLikeList) {
        return lines.map((line) => `- ${line.replace(/^[-*+]\s+/, '')}`).join('\n')
      }

      return lines.join('\n\n')
    })
    .filter(Boolean)
    .join('\n\n')
}
