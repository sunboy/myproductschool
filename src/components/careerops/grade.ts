import type { FitGrade, ReadinessState } from '@/lib/careerops/types'

// Material 3 Terra tonal classes for fit grades and readiness chips.
export function gradeClasses(grade: FitGrade | undefined): string {
  switch (grade) {
    case 'A': return 'bg-primary text-on-primary'
    case 'B': return 'bg-primary-container text-on-primary-container'
    case 'C': return 'bg-tertiary-container text-on-surface'
    case 'D': return 'bg-secondary-container text-on-secondary-container'
    case 'F': return 'bg-surface-container-highest text-error'
    default: return 'bg-surface-container-highest text-on-surface-variant'
  }
}

export function readinessChip(state: ReadinessState): { label: string; classes: string; icon: string } {
  switch (state) {
    case 'ready':
      return { label: 'Ready', classes: 'bg-primary-container text-on-primary-container', icon: 'check_circle' }
    case 'gaps':
      return { label: 'Gaps', classes: 'bg-tertiary-container text-on-surface', icon: 'trending_up' }
    default:
      return { label: 'Unknown', classes: 'bg-surface-container-highest text-on-surface-variant', icon: 'help' }
  }
}
