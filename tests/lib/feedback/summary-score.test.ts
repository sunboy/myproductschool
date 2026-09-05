import { describe, expect, it } from 'vitest'
import { feedbackSummaryScore } from '@/lib/feedback/summary-score'
describe('feedback summary score', () => {
  it('never invents a score for qualitative-only feedback', () => expect(feedbackSummaryScore(null, [])).toBeNull())
  it('preserves a real zero score', () => expect(feedbackSummaryScore(0, [{ score: 8 }])).toBe(0))
  it('can summarize valid dimension scores', () => expect(feedbackSummaryScore(null, [{ score: 6 }, { score: 8 }])).toBe(70))
  it('does not display invalid scores', () => expect(feedbackSummaryScore(NaN, [{ score: NaN }])).toBeNull())
})
