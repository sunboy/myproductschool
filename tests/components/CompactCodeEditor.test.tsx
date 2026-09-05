import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@monaco-editor/react', () => ({
  default: () => null,
  loader: { config: vi.fn(), __getMonacoInstance: () => null, init: vi.fn() },
}))
import { MonacoCodeEditor } from '@/components/challenge/MonacoCodeEditor'

describe('compact code input', () => {
  it('renders the saved buffer immediately without waiting for Monaco', () => {
    const html = renderToStaticMarkup(createElement(MonacoCodeEditor, {
      value: 'SELECT *\nFROM orders;', language: 'sql', onChange: vi.fn(), preferPlainEditor: true,
    }))
    expect(html).toContain('SELECT *\nFROM orders;')
    expect(html).toContain('aria-label="sql code editor"')
    expect(html).toContain('autoCapitalize="off"')
    expect(html).not.toContain('Loading editor')
  })
  it('locks editing during submission and escapes code as text', () => {
    const html = renderToStaticMarkup(createElement(MonacoCodeEditor, {
      value: '<script>alert(1)</script>', language: 'javascript', onChange: vi.fn(), preferPlainEditor: true, readOnly: true,
    }))
    expect(html).toContain('readOnly=""')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
