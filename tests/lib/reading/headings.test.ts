import { describe, it, expect } from 'vitest'
import { extractHeadings, slugifyHeading } from '@/lib/reading/headings'

describe('headings', () => {
  it('slugifies', () => {
    expect(slugifyHeading('The Model Trusts Everything You Hand It')).toBe('the-model-trusts-everything-you-hand-it')
  })
  it('extracts h2/h3 from markdown, ignoring fenced code', () => {
    const md = '# Title\n\n## The model trusts everything\ntext\n```\n## not a heading\n```\n### Where poison enters\n## What to do on Monday'
    expect(extractHeadings(md)).toEqual([
      { id: 'the-model-trusts-everything', label: 'The model trusts everything', level: 2 },
      { id: 'where-poison-enters', label: 'Where poison enters', level: 3 },
      { id: 'what-to-do-on-monday', label: 'What to do on Monday', level: 2 },
    ])
  })
})
