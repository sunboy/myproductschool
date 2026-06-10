// Readiness-map routing — the discipline → learning-surface href logic.
//
// Every gap a fit-score identifies must route to a concrete rep in one of the
// five practice disciplines. This module owns that mapping so the API, the UI,
// and the tests all agree on where a discipline CTA points.

import {
  DISCIPLINE_META,
  LIVE_INTERVIEW_DISCIPLINES,
  normalizeDiscipline,
  type LiveInterviewDiscipline,
} from '@/lib/live-interview/disciplines'
import type { ReadinessRow } from './types'

// product_sense practice lives in the FLOW challenge list (no discipline param
// on /challenges for product); the rest filter by `?discipline=`.
export function practiceHref(discipline: LiveInterviewDiscipline): string {
  if (discipline === 'product_sense') return '/challenges'
  return `/challenges?discipline=${discipline}`
}

export function interviewHref(discipline: LiveInterviewDiscipline): string {
  return `/live-interviews?discipline=${discipline}`
}

export function disciplineLabel(discipline: LiveInterviewDiscipline): string {
  return DISCIPLINE_META[discipline].label
}

export function disciplineIcon(discipline: LiveInterviewDiscipline): string {
  return DISCIPLINE_META[discipline].icon
}

// Shape the model's raw readiness rows into validated `ReadinessRow`s with the
// correct hrefs filled in from this module (never trusting the model for URLs).
// When `routingEnabled` is false we still return the rows (score-only mode) but
// blank the hrefs so the UI hides the deep-link CTAs.
interface RawReadinessRow {
  discipline?: string
  demanded?: boolean
  bar?: string
  user_readiness?: string
  top_gap?: string | null
  recommended_rep?: string | null
}

export function buildReadinessMap(
  rawRows: RawReadinessRow[],
  routingEnabled: boolean,
): ReadinessRow[] {
  const byDiscipline = new Map<LiveInterviewDiscipline, RawReadinessRow>()

  for (const row of rawRows ?? []) {
    const discipline = normalizeDiscipline(row.discipline)
    if (!discipline) continue
    byDiscipline.set(discipline, row)
  }

  return LIVE_INTERVIEW_DISCIPLINES.map((discipline) => {
    const row = byDiscipline.get(discipline)
    const demanded = Boolean(row?.demanded)
    return {
      discipline,
      demanded,
      bar: typeof row?.bar === 'string' ? row.bar : '',
      user_readiness: normalizeReadiness(row?.user_readiness),
      top_gap: typeof row?.top_gap === 'string' ? row.top_gap : null,
      recommended_rep: typeof row?.recommended_rep === 'string' ? row.recommended_rep : null,
      practice_href: routingEnabled ? practiceHref(discipline) : '',
      interview_href: routingEnabled ? interviewHref(discipline) : '',
    }
  })
}

function normalizeReadiness(value: unknown): ReadinessRow['user_readiness'] {
  return value === 'ready' || value === 'gaps' ? value : 'unknown'
}

// Merge readiness across many evaluations (saved jobs + scored feed listings)
// into the aggregate cross-discipline strip on the hub: a discipline is
// "demanded" if any source demands it, and we surface the most-at-risk state.
export function aggregateReadiness(maps: ReadinessRow[][]): ReadinessRow[] {
  const merged = new Map<LiveInterviewDiscipline, ReadinessRow>()

  for (const map of maps) {
    for (const row of map) {
      if (!row.demanded) continue
      const existing = merged.get(row.discipline)
      if (!existing) {
        merged.set(row.discipline, { ...row })
        continue
      }
      // Keep the riskier readiness state (gaps > unknown > ready).
      existing.user_readiness = riskier(existing.user_readiness, row.user_readiness)
      existing.top_gap = existing.top_gap ?? row.top_gap
      existing.recommended_rep = existing.recommended_rep ?? row.recommended_rep
    }
  }

  return LIVE_INTERVIEW_DISCIPLINES
    .map((d) => merged.get(d))
    .filter((r): r is ReadinessRow => Boolean(r))
}

const RISK_ORDER: Record<ReadinessRow['user_readiness'], number> = {
  gaps: 2,
  unknown: 1,
  ready: 0,
}

function riskier(
  a: ReadinessRow['user_readiness'],
  b: ReadinessRow['user_readiness'],
): ReadinessRow['user_readiness'] {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b
}
