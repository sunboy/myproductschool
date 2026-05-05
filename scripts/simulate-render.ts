import { createClient } from '@supabase/supabase-js'

const WRAPPING_TAGS = ['figure', 'svg', 'table', 'ul', 'ol', 'div', 'pre', 'blockquote', 'aside']
const BLOCK_TAG_RE = /^\s*<(svg|ul|ol|div|figure|table|pre|blockquote|aside)\b/i

function splitIntoBlocks(mdx: string): string[] {
  const blocks: string[] = []
  const lines = mdx.split('\n')
  let buffer: string[] = []
  const flush = () => { if (buffer.length) { blocks.push(buffer.join('\n')); buffer = [] } }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const openMatch = line.match(/^\s*<([a-z][a-z0-9]*)\b/i)
    const tag = openMatch?.[1]?.toLowerCase()
    if (tag && WRAPPING_TAGS.includes(tag)) {
      flush()
      const closeRe = new RegExp(`</${tag}>\\s*$`, 'i')
      if (closeRe.test(line)) { blocks.push(line); i++; continue }
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
  const { data: mod } = await s.from('learn_modules').select('id').eq('slug', 'product-sense').single()
  const { data: chapters } = await s.from('learn_chapters').select('sort_order, slug, body_mdx').eq('module_id', mod!.id).order('sort_order')
  for (const ch of chapters ?? []) {
    const blocks = splitIntoBlocks(ch.body_mdx)
    let figureBlock: string | undefined
    for (const b of blocks) {
      if (BLOCK_TAG_RE.test(b.trim()) && b.includes('<figure>')) {
        figureBlock = b
        break
      }
    }
    const ok = !!figureBlock
    const figLen = figureBlock?.length ?? 0
    const hasClosing = figureBlock?.includes('</figure>')
    const hasSvgOpen = figureBlock?.includes('<svg ')
    const hasSvgClose = figureBlock?.includes('</svg>')
    console.log(`${ch.sort_order}. ${ch.slug.padEnd(12)} fig=${ok} len=${figLen} close=${hasClosing} svg=${hasSvgOpen}/${hasSvgClose}`)
  }
}
main()
