import { describe, it, expect } from 'vitest'
import { searchScopeFor } from '@/lib/shell/search-scope'

describe('search-scope', () => {
  it('scopes the top-bar search per route', () => {
    expect(searchScopeFor('/challenges', 1470)).toEqual({ placeholder: 'Search 1470 challenges by title, company, technique', buildHref: expect.any(Function) })
    expect(searchScopeFor('/challenges').buildHref('two sum')).toBe('/challenges?q=two%20sum')
    expect(searchScopeFor('/explore').placeholder).toBe('Search guides, companies, or skills')
    expect(searchScopeFor('/explore').buildHref('gmail')).toBe('/explore?q=gmail')
    expect(searchScopeFor('/dashboard').buildHref('sql')).toBe('/challenges?q=sql')
    expect(searchScopeFor('/live-interviews').buildHref('stripe')).toBe('/live-interviews?q=stripe')
  })
})
