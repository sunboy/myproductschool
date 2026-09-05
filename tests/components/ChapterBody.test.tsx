import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ChapterBody } from '../../src/components/learning/ChapterBody'

const renderChapter = (body: string) => renderToStaticMarkup(<ChapterBody body_mdx={body} figures={[]} />)

describe('ChapterBody formatting regressions', () => {
  it('renders the self-attention example as math, not literal dollar markup', () => {
    const html = renderChapter(String.raw`## What Self-Attention Actually Computes

Given $n$ embeddings of dimension $d_{model}$, queries ($Q$), keys ($K$), and values ($V$).

1. Produces an $(n \times n)$ matrix.
2. Divide by $\sqrt{d_k}$.

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
$$`)
    expect(html).toContain('class="katex"')
    expect(html).toContain('class="katex-display"')
    expect(html).toContain('<math')
    expect(html).not.toContain('$n$')
    expect(html).not.toContain('$d_{model}$')
    expect(html).toContain('<ol')
  })

  it.each(['', 'python'])('keeps %s fenced code literal and keyboard-scrollable', language => {
    const html = renderChapter('```' + language + '\nQ = X * W_Q  # shape: (n, d_k)\nprint("$n$ <tag>")\n```')
    expect(html).toContain('md-code-block')
    expect(html).toContain('tabindex="0" aria-label="Code block"')
    expect(html).toContain('$n$ &lt;tag&gt;')
    expect(html).not.toContain('class="katex"')
  })

  it('supports nested lists, scrollable tables, and escaped currency', () => {
    const html = renderChapter('- Parent\n  - Child\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\nCost: \\$20 to \\$40. Use `softmax(...)`.')
    expect(html.match(/<ul /g)).toHaveLength(2)
    expect(html).toContain('md-table-scroll')
    expect(html).toContain('Cost: $20 to $40.')
    expect(html).not.toContain('class="katex"')
    expect(html).toContain('softmax(...)')
  })

  it('does not turn chapter content or math commands into executable HTML', () => {
    const html = renderChapter(String.raw`<script>alert(1)</script>

[bad](javascript:alert(1))

$\href{javascript:alert(1)}{click}$`)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('href="javascript:')
    expect(html).not.toContain('onclick=')
  })

  it('preserves prose around typed figure placeholders and safe chapter images', () => {
    const html = renderChapter('Before\n\n{{figure:0}}\n\nAfter\n\n![Example](/images/example.png)')
    expect(html).toContain('Before')
    expect(html).toContain('After')
    expect(html).not.toContain('{{figure:0}}')
    expect(html).toContain('alt="Example"')
  })
})
