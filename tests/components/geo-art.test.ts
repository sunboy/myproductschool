import { describe, it, expect } from 'vitest'
import { geoIndexFor, GEO_COMPOSITIONS } from '@/components/density/geo-art'

describe('geo-art', () => {
  it('has eight compositions', () => { expect(GEO_COMPOSITIONS).toHaveLength(8) })
  it('is deterministic per id and spreads across compositions', () => {
    expect(geoIndexFor('gmail-undo-send')).toBe(geoIndexFor('gmail-undo-send'))
    const set = new Set(['a','b','c','d','e','f','g','h','i','j'].map(geoIndexFor))
    expect(set.size).toBeGreaterThan(3)
  })
})
