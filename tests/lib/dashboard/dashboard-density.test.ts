import { describe, it, expect } from 'vitest'
import { pickEditorial, areaPct, PRACTICE_AREAS } from '@/lib/data/dashboard-density'
import { getCuratedFirstRepSlugs } from '@/lib/onboarding/curated-first-rep'

describe('dashboard-density', () => {
  it('lists six practice areas mapped to count disciplines', () => {
    expect(PRACTICE_AREAS.map(a => a.discipline)).toEqual(['algorithm', 'sql', 'system_design', 'data_modeling', 'analytics', 'product_sense'])
  })
  it('computes area completion percent', () => {
    expect(areaPct(12, 100)).toBe(12); expect(areaPct(0, 0)).toBe(0); expect(areaPct(3, 7)).toBe(43)
  })
  it('orders editorial picks: in progress, then saved, then newest', () => {
    const items = pickEditorial({
      inProgress: [{ kind: 'autopsy', id: 'a', title: 'A', href: '/a', readMins: 5, eyebrow: 'Autopsy · X' }],
      saved: [{ kind: 'autopsy', id: 'b', title: 'B', href: '/b', readMins: 6, eyebrow: 'Autopsy · Y' }],
      newest: [{ kind: 'module', id: 'c', title: 'C', href: '/c', readMins: 9, eyebrow: 'Module · Ch. 1' }, { kind: 'autopsy', id: 'a', title: 'A', href: '/a', readMins: 5, eyebrow: 'Autopsy · X' }, { kind: 'autopsy', id: 'd', title: 'D', href: '/d', readMins: 7, eyebrow: 'Autopsy · Z' }],
    }, 3)
    expect(items.map(i => i.id)).toEqual(['a', 'b', 'c'])
  })
  it('returns three distinct curated first reps per role', () => {
    const s = getCuratedFirstRepSlugs('swe')
    expect(s).toHaveLength(3); expect(new Set(s).size).toBe(3)
    expect(getCuratedFirstRepSlugs('unknown-role')).toHaveLength(3)
  })
})
