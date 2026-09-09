/** An absent evaluation must remain absent; never invent a learner score. */
export function feedbackSummaryScore(raw: number | null, dimensions: ReadonlyArray<{ score: number }>): number | null {
  if (raw !== null && Number.isFinite(raw)) return Math.round(Math.max(0, Math.min(100, raw)))
  const scored = dimensions.filter(item => Number.isFinite(item.score))
  if (!scored.length) return null
  return Math.round(Math.max(0, Math.min(100, scored.reduce((total, item) => total + item.score, 0) / scored.length * 10)))
}
