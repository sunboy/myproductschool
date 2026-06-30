import { coerceDifficulty, type PracticeDifficulty } from '@/lib/practice/difficulty'

// Canonical challenge-completion XP formula, shared across every challenge type
// (FLOW, coding/SQL, canvas). FLOW lives in the complete route; coding and canvas
// call this from their submit routes. Keeping the math in one place means the
// reward is identical regardless of how a challenge is graded.
//
//   base_xp   = difficulty_base × (total_score / max_score)
//   difficulty_base: easy=50, medium=100, hard=150
//   streak_multiplier = min(1 + streak_days × 0.05, 1.5)   // +5%/day, caps at 1.5× at 10 days
//   xp_earned = round(base_xp × streak_multiplier)
const DIFFICULTY_BASE: Record<PracticeDifficulty, number> = { easy: 50, medium: 100, hard: 150 }

export function calculateChallengeXp(
  totalScore: number,
  maxScore: number,
  difficulty: string | null | undefined,
  streakDays: number,
): number {
  if (!maxScore || maxScore <= 0) return 0
  // Coerce legacy DB values (warmup/standard/advanced/staff_plus) to the canonical
  // bucket so XP is correct until the difficulty column is rewritten.
  const bucket = coerceDifficulty(difficulty) ?? 'easy'
  const difficultyBase = DIFFICULTY_BASE[bucket]
  const baseXp = Math.round(difficultyBase * (totalScore / maxScore))
  const streakMultiplier = Math.min(1 + (streakDays ?? 0) * 0.05, 1.5)
  return Math.round(baseXp * streakMultiplier)
}
