export function analyzeTrend(recentScores: number[]): { trend: string; slope: number } {
  if (recentScores.length < 3) return { trend: 'insufficient_data', slope: 0 }
  const n = recentScores.length
  const xMean = (n - 1) / 2
  const yMean = recentScores.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (recentScores[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  return { trend: slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'steady', slope: Math.round(slope * 1000) / 1000 }
}
