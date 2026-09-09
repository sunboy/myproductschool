import { describe, it, expect } from 'vitest'
import { GUT_CALLS } from '@/lib/calibration/gut-calls'
import { QUESTIONS } from '@/lib/calibration/questions'

describe('gut-calls', () => {
  it('covers all four moves with four options each, mapped to real option ids', () => {
    expect(GUT_CALLS.map(g => g.move)).toEqual(QUESTIONS.map(q => q.move))
    GUT_CALLS.forEach((g, i) => {
      expect(g.options).toHaveLength(4)
      g.options.forEach(o => expect(QUESTIONS[i].options.map(x => x.id)).toContain(o.optionId))
      expect(g.headline.length).toBeLessThan(200)
      g.options.forEach(o => { expect(o.title.length).toBeLessThan(60); expect(o.reason.length).toBeLessThan(60) })
    })
  })
})
