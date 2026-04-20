import { createClient } from '@supabase/supabase-js'

const BLOCK_TAG_RE = /^\s*<(svg|ul|ol|div|figure|table|pre|blockquote|aside)\b/i
const WRAPPING_TAGS = ['figure', 'svg', 'table', 'ul', 'ol', 'div', 'pre', 'blockquote', 'aside']

function splitIntoBlocks(mdx: string): string[] {
  const blocks: string[] = []
  const lines = mdx.split('\n')
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length === 0) return
    blocks.push(buffer.join('\n'))
    buffer = []
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const openMatch = line.match(/^\s*<([a-z][a-z0-9]*)\b/i)
    const tag = openMatch?.[1]?.toLowerCase()
    if (tag && WRAPPING_TAGS.includes(tag)) {
      flush()
      const closeRe = new RegExp(`</${tag}>\\s*$`, 'i')
      if (closeRe.test(line)) {
        blocks.push(line)
        i++
        continue
      }
      const wrapped: string[] = [line]
      i++
      while (i < lines.length) {
        wrapped.push(lines[i])
        if (closeRe.test(lines[i])) { i++; break }
        i++
      }
      blocks.push(wrapped.join('\n'))
      continue
    }
    if (line.trim() === '') { flush(); i++; continue }
    buffer.push(line); i++
  }
  flush()
  return blocks
}

async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await s.from('learn_chapters').select('body_mdx').eq('slug', 'why-flow').single()
  const blocks = splitIntoBlocks(data!.body_mdx)
  console.log(`=== ${blocks.length} blocks ===`)
  for (let i = 0; i < blocks.length; i++) {
    const first = blocks[i].split('\n')[0].slice(0, 80)
    const isTag = BLOCK_TAG_RE.test(blocks[i].trim())
    const lineCount = blocks[i].split('\n').length
    console.log(`[${i}] ${isTag ? 'BLOCK' : 'para '} (${lineCount} lines) ${first}`)
  }
}
main()
