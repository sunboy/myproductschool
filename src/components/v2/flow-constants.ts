export type Verdict = 'pass' | 'partial' | 'miss'

export const VERDICT_COLOR: Record<Verdict, string> = {
  pass:    '#2f7a4a',
  partial: '#c9933a',
  miss:    '#b23a2a',
}

export const VERDICT_BG: Record<Verdict, string> = {
  pass:    'rgba(47,122,74,0.08)',
  partial: 'rgba(201,147,58,0.10)',
  miss:    'rgba(178,58,42,0.08)',
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  pass:    'CLEAN',
  partial: 'PARTIAL',
  miss:    'MISSED',
}

export const VERDICT_ICON: Record<Verdict, string> = {
  pass:    'check_circle',
  partial: 'change_circle',
  miss:    'cancel',
}

export const QUALITY_ORDER = ['best', 'good_but_incomplete', 'surface', 'plausible_wrong']

export const QUALITY_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  best:                { label: 'Best',       color: '#2f7a4a', bg: '#c8e8d0', border: '#2f7a4a' },
  good_but_incomplete: { label: 'Good',       color: '#1e40af', bg: '#dbeafe', border: '#1e40af' },
  surface:             { label: 'Surface',    color: '#92400e', bg: '#fef3c7', border: '#92400e' },
  plausible_wrong:     { label: 'Misleading', color: '#991b1b', bg: '#fee2e2', border: '#991b1b' },
}

export const STEP_ICONS: Record<string, string> = {
  frame:    'center_focus_strong',
  list:     'format_list_bulleted',
  optimize: 'tune',
  win:      'emoji_events',
}

/** Maps quality_label (from flow_options) → verdict */
export function qualityToVerdict(quality: string): Verdict {
  if (quality === 'best') return 'pass'
  if (quality === 'good_but_incomplete' || quality === 'surface') return 'partial'
  return 'miss'
}

/** Maps grade_label (from grading output) → verdict */
export function gradeToVerdict(grade: string): Verdict {
  if (grade === 'Outstanding' || grade === 'Strong') return 'pass'
  if (grade === 'Developing' || grade === 'Good') return 'partial'
  // Also handle quality_label values returned by the step submit API
  if (grade === 'best') return 'pass'
  if (grade === 'good_but_incomplete' || grade === 'surface') return 'partial'
  return 'miss'
}
