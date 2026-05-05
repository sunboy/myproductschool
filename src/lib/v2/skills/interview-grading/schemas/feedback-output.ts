import type { InterviewGrade } from '@/lib/types'

export type { InterviewGrade }

// Validates that a parsed object conforms to InterviewGrade shape
export function validateInterviewGrade(data: unknown): InterviewGrade {
  if (!data || typeof data !== 'object') throw new Error('Invalid grade: not an object')
  const d = data as Record<string, unknown>
  if (typeof d.overall_score !== 'number') throw new Error('Invalid grade: missing overall_score')
  if (typeof d.headline !== 'string') throw new Error('Invalid grade: missing headline')
  if (typeof d.dimensions !== 'object' || !d.dimensions) throw new Error('Invalid grade: missing dimensions')
  return {
    overall_score: Math.max(1, Math.min(5, d.overall_score as number)),
    headline: d.headline as string,
    dimensions: d.dimensions as InterviewGrade['dimensions'],
    top_strength: (d.top_strength as string) ?? '',
    top_improvement: (d.top_improvement as string) ?? '',
    canvas_annotations: (d.canvas_annotations as InterviewGrade['canvas_annotations']) ?? [],
  }
}
