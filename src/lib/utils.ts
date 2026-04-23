import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IS_MOCK } from '@/lib/mock'

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
  return ({ warmup: 'Warm-up', standard: 'Intermediate', advanced: 'Advanced', staff_plus: 'Staff+' } as Record<string, string>)[d] ?? d
}
