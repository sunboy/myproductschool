import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { markdownToEmailHtml } from '@/lib/email/newsletter-markdown'

describe('markdownToEmailHtml', () => {
  it('renders headings, paragraphs, bold, italic, and inline code', () => {
    const html = markdownToEmailHtml(
      '## A heading\n\nSome **bold** and *italic* text with `inline code`.'
    )
    assert.match(html, /<h2[^>]*>A heading<\/h2>/)
    assert.match(html, /<strong[^>]*>bold<\/strong>/)
    assert.match(html, /<em>italic<\/em>/)
    assert.match(html, /<code[^>]*>inline code<\/code>/)
  })

  it('renders unordered and ordered lists', () => {
    const html = markdownToEmailHtml('- one\n- two\n\n1. first\n2. second')
    assert.match(html, /<ul[^>]*><li[^>]*>one<\/li><li[^>]*>two<\/li><\/ul>/)
    assert.match(html, /<ol[^>]*><li[^>]*>first<\/li><li[^>]*>second<\/li><\/ol>/)
  })

  it('renders blockquotes', () => {
    const html = markdownToEmailHtml('> a quoted line')
    assert.match(html, /<blockquote[^>]*>a quoted line<\/blockquote>/)
  })

  it('keeps https links and strips non-https/javascript URLs', () => {
    const safe = markdownToEmailHtml('[HackProduct](https://www.hackproduct.com)')
    assert.match(safe, /<a href="https:\/\/www\.hackproduct\.com"[^>]*>HackProduct<\/a>/)

    const unsafe = markdownToEmailHtml('[click me](javascript:alert(1))')
    assert.doesNotMatch(unsafe, /<a /)
    assert.match(unsafe, /click me/)

    const httpLink = markdownToEmailHtml('[insecure](http://example.com)')
    assert.doesNotMatch(httpLink, /<a /)
  })

  it('escapes raw HTML and script tags in source markdown', () => {
    const html = markdownToEmailHtml('<script>alert(1)</script> and some text')
    assert.doesNotMatch(html, /<script>/)
    assert.match(html, /&lt;script&gt;/)
  })

  it('never emits a <style> or <script> block regardless of input', () => {
    const html = markdownToEmailHtml('<style>body{color:red}</style>\n\nNormal paragraph.')
    assert.doesNotMatch(html, /<style/)
    assert.doesNotMatch(html, /<script/)
  })
})
