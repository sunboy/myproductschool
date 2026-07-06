// The canonical score language for every feedback surface. Stored scales stay
// per-medium (/5 canvas+coding, /100 debrief+CC, 0-1 quick-take, /10 FLOW);
// display normalizes to /10 with one grade lexicon, so a learner moving
// between mediums reads one coherent coach.

export type ScoreScale = 5 | 10 | 100 | 1

export type GradeBand = 'sharp' | 'solid' | 'surface' | 'needs_work'

/** Normalize any stored score to the canonical 0-10 display scale. */
export function normalizeToTen(raw: number, scale: ScoreScale): number {
  if (!Number.isFinite(raw)) return 0
  const clamped = Math.max(0, Math.min(raw, scale))
  return Math.round((clamped / scale) * 100) / 10
}

/** The canonical grade lexicon (mirrors the quick-take bands the product
 *  already teaches: Sharp / Solid / Surface / Needs work). */
export function gradeBand(scoreOutOfTen: number): GradeBand {
  if (scoreOutOfTen >= 8) return 'sharp'
  if (scoreOutOfTen >= 5.5) return 'solid'
  if (scoreOutOfTen >= 3) return 'surface'
  return 'needs_work'
}

export const GRADE_LABELS: Record<GradeBand, string> = {
  sharp: 'Sharp',
  solid: 'Solid',
  surface: 'Surface',
  needs_work: 'Needs work',
}

/** One-line descriptor per band, used under the hero score. */
export const GRADE_DESCRIPTORS: Record<GradeBand, string> = {
  sharp: 'This is the level that carries a real interview.',
  solid: 'The core moves are there. Sharpen the specifics.',
  surface: 'Right direction, but the reasoning stays on the surface.',
  needs_work: 'The foundations need reps. That is what practice is for.',
}

/** Terra token classes per band (ring stroke, badge chip, text). */
export function bandClasses(band: GradeBand): { ring: string; badge: string; text: string } {
  switch (band) {
    case 'sharp':
      return { ring: 'text-primary', badge: 'bg-primary-fixed text-primary', text: 'text-primary' }
    case 'solid':
      return { ring: 'text-primary', badge: 'bg-primary-fixed/60 text-primary', text: 'text-primary' }
    case 'surface':
      return { ring: 'text-tertiary', badge: 'bg-tertiary-container/50 text-tertiary', text: 'text-tertiary' }
    case 'needs_work':
      return { ring: 'text-error', badge: 'bg-error-container text-error', text: 'text-error' }
  }
}

/** Hatch mascot state per band. */
export function bandHatchState(band: GradeBand): 'celebrating' | 'speaking' | 'listening' {
  if (band === 'sharp') return 'celebrating'
  if (band === 'solid') return 'speaking'
  return 'listening'
}
