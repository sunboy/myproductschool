/**
 * Format a raw score value as a display string in "X.X / 5" format.
 *
 * Handles two storage conventions:
 *   - 0–1 normalised float  → multiply by 5 before formatting
 *   - 1–5 raw scale         → format directly
 *
 * Returns null when the input is null or undefined.
 */
export function formatScore(score: number | null | undefined): string | null {
  if (score == null) return null
  const scaled = score <= 1 ? score * 5 : score
  return `${scaled.toFixed(1)} / 5`
}
