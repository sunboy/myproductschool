import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import { describe, expect, it } from 'vitest'
import {
  getMdComponents,
  mdRehypePlugins,
  mdRemarkPlugins,
  safeMarkdownUrl,
  type MdTone,
  type MdVariant,
} from '../../src/components/ui/Md'

function renderMd(markdown: string, variant: MdVariant = 'default', tone: MdTone = 'default') {
  return renderToStaticMarkup(
    <ReactMarkdown
      components={getMdComponents(variant, tone)}
      rehypePlugins={mdRehypePlugins}
      remarkPlugins={mdRemarkPlugins}
      skipHtml
      urlTransform={safeMarkdownUrl}
    >
      {markdown}
    </ReactMarkdown>
  )
}

describe('Md renderer', () => {
  it('renders headings, paragraphs, lists, blockquotes, and inline code with M3 classes', () => {
    const html = renderMd([
      '# Heading',
      '',
      'A paragraph with **bold** and `code`.',
      '',
      '- one',
      '- two',
      '',
      '> quoted',
    ].join('\n'))

    expect(html).toContain('<h1 class="font-headline')
    expect(html).toContain('<p class="font-body text-sm leading-relaxed text-on-surface')
    expect(html).toContain('<strong class="font-semibold">bold</strong>')
    expect(html).toContain('<code class="bg-surface-container-high px-1 rounded text-sm font-mono text-on-surface">code</code>')
    expect(html).toContain('<ul class="list-disc list-outside ml-5 space-y-1')
    expect(html).toContain('<blockquote class="border-l-4 border-outline-variant pl-3 text-on-surface-variant')
  })

  it('renders GFM tables, strikethrough, and autolinks', () => {
    const html = renderMd([
      '| A | B |',
      '| - | - |',
      '| 1 | ~~old~~ |',
      '',
      'https://example.com',
    ].join('\n'))

    expect(html).toContain('<table class="my-3 w-full border-collapse text-sm">')
    expect(html).toContain('<th class="border border-outline-variant px-2 py-1 text-left align-top font-bold bg-surface-container-high">A</th>')
    expect(html).toContain('<del class="line-through">old</del>')
    expect(html).toContain('<a class="text-primary underline hover:text-primary/80" href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>')
  })

  it('strips raw HTML and unsafe URL schemes', () => {
    const html = renderMd('<script>alert(1)</script>\n\n[bad](javascript:alert(1)) [http](http://example.com) [ok](/challenges/abc) [mail](mailto:founders@hackproduct.com)')

    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('href="http://example.com"')
    expect(html).toContain('<span>bad</span>')
    expect(html).toContain('<span>http</span>')
    expect(html).toContain('<a class="text-primary underline hover:text-primary/80" href="/challenges/abc">ok</a>')
    expect(html).toContain('<a class="text-primary underline hover:text-primary/80" href="mailto:founders@hackproduct.com">mail</a>')
  })

  it('supports compact and chat variants', () => {
    expect(renderMd('Compact', 'compact')).toContain('mb-0')
    expect(renderMd('Chat', 'chat')).toContain('text-xs leading-relaxed text-inherit')
  })

  it('can inherit surrounding text color for embedded prose', () => {
    expect(renderMd('Muted prose', 'compact', 'inherit')).toContain('text-inherit')
    expect(renderMd('## Muted heading', 'compact', 'inherit')).toContain('text-inherit')
  })
})
