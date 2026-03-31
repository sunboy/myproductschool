export function calculateStepScore(
  questionScores: Array<{ score: number; weight: number }>
): number {
  const weightSum = questionScores.reduce((s, q) => s + q.weight, 0)
  if (weightSum === 0) return questionScores.reduce((s, q) => s + q.score, 0) / (questionScores.length || 1)
  return questionScores.reduce((s, q) => s + (q.score * q.weight / weightSum), 0)
}
