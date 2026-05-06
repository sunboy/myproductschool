import type { CommunityBadgeKey, CommunityDisplayMode, CommunityLensTag } from '@/lib/types'

export const COMMUNITY_BADGE_LABELS: Record<CommunityBadgeKey, string> = {
  frame_sharpener: 'Frame Sharpener',
  metric_hawk: 'Metric Hawk',
  tradeoff_catcher: 'Tradeoff Catcher',
  clarity_builder: 'Clarity Builder',
}

export const COMMUNITY_LENS_LABELS: Record<CommunityLensTag, string> = {
  'metric-first': 'Metric-first',
  'segment-first': 'Segment-first',
  'tradeoff-aware': 'Tradeoff-aware',
  'strong win': 'Strong win',
  'interesting miss': 'Interesting miss',
}

export function deriveLensTag(input: {
  responseText?: string | null
  gradeLabel?: string | null
  score?: number | null
  maxScore?: number | null
}): CommunityLensTag {
  const text = `${input.responseText ?? ''} ${input.gradeLabel ?? ''}`.toLowerCase()
  const normalizedScore =
    typeof input.score === 'number' && typeof input.maxScore === 'number' && input.maxScore > 0
      ? input.score / input.maxScore
      : typeof input.score === 'number'
        ? input.score
        : null

  if (/\b(metric|kpi|north star|activation|retention|conversion|dau|wau|revenue|latency)\b/.test(text)) return 'metric-first'
  if (/\b(segment|cohort|persona|new users|returning users|enterprise|consumer|power users)\b/.test(text)) return 'segment-first'
  if (/\b(tradeoff|trade-off|risk|cost|constraint|downside|compromise|rollback)\b/.test(text)) return 'tradeoff-aware'
  if ((normalizedScore ?? 0) >= 0.82 || /\b(strong|excellent|clean|great)\b/.test(text)) return 'strong win'
  return 'interesting miss'
}

export function formatCommunityDisplayName(displayMode: CommunityDisplayMode, displayName?: string | null): string {
  if (displayMode === 'named' && displayName?.trim()) return displayName.trim()
  return 'Anonymous peer'
}
