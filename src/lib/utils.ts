import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IS_MOCK } from '@/lib/mock'
import { coerceDifficulty, DIFFICULTY_LABELS } from '@/lib/practice/difficulty'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function getTopDimension(dimensions: Record<string, { score: number }>): { key: string; score: number } {
  return Object.entries(dimensions).reduce(
    (best, [key, val]) => val.score > best.score ? { key, score: val.score } : best,
    { key: '', score: 0 }
  )
}

export function isMockMode(): boolean {
  return IS_MOCK
}

export function difficultyLabel(d: string): string {
  const canonical = coerceDifficulty(d)
  return canonical ? DIFFICULTY_LABELS[canonical] : d
}

/**
 * XP required per user level. Single source for the "Level N" readouts in the
 * top utility bar and the dashboard stat strip — they must always agree.
 */
export const XP_PER_USER_LEVEL = 500

/** Derives the user's overall level from profiles.xp_total. Level 1 at 0 XP. */
export function levelFromXp(xpTotal: number): number {
  return Math.floor(Math.max(0, xpTotal) / XP_PER_USER_LEVEL) + 1
}
