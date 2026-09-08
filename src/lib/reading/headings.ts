export interface Heading { id: string; label: string; level: 2 | 3 }

export const slugifyHeading = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')

/** Extracts h2/h3 headings from raw markdown, skipping fenced code blocks. */
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue }
    if (fenced) continue
    const m = line.match(/^(##|###)\s+(.+?)\s*#*\s*$/)
    if (m) out.push({ id: slugifyHeading(m[2]), label: m[2].trim(), level: m[1].length as 2 | 3 })
  }
  return out
}
