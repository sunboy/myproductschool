import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/log'

/**
 * Hatch session memory over time. Every lightweight Hatch touchpoint (hint
 * request, self-check, quick-take submit, explicit client log) is recorded in
 * `hatch_interactions` and summarized back into Hatch's prompt on later turns.
 */

export interface HatchInteractionRow {
  kind: string
  payload: Record<string, unknown>
  created_at: string
}

/**
 * Fire-and-forget recorder. Never throws, never blocks the parent request.
 * Call WITHOUT await (same gotcha as embedAndStoreContext: awaiting a
 * non-critical insert on the hot path once blocked challenge submits).
 */
export function recordHatchInteraction(
  userId: string,
  kind: string,
  payload: Record<string, unknown> = {}
): void {
  try {
    const admin = createAdminClient()
    void admin
      .from('hatch_interactions')
      .insert({ user_id: userId, kind: kind.slice(0, 40), payload })
      .then(({ error }) => {
        if (error) {
          logger.warn('[hatch-interactions] insert failed', { error: error.message, kind })
        }
      })
  } catch (error) {
    logger.warn('[hatch-interactions] insert threw', {
      error: error instanceof Error ? error.message : String(error),
      kind,
    })
  }
}

const MAX_BLOCK_CHARS = 600

function describe(row: HatchInteractionRow): string {
  const p = row.payload ?? {}
  const date = new Date(row.created_at).toISOString().slice(0, 10)
  const topic =
    typeof p.challenge_title === 'string' && p.challenge_title
      ? p.challenge_title
      : typeof p.challenge_id === 'string' && p.challenge_id
        ? `challenge ${p.challenge_id}`
        : null
  switch (row.kind) {
    case 'hint_request': {
      return `${date}: asked for a hint${topic ? ` on ${topic}` : ''}${typeof p.challenge_type === 'string' ? ` (${p.challenge_type})` : ''}`
    }
    case 'self_check': {
      const verdict = typeof p.verdict === 'string' ? ` (${p.verdict})` : ''
      return `${date}: ran a self-check${topic ? ` on ${topic}` : ''}${verdict}`
    }
    case 'quick_take_submit': {
      const move = typeof p.move === 'string' ? ` (${p.move} move` : ''
      const score = typeof p.score === 'number' ? `${move ? ', ' : ' ('}score ${p.score}` : ''
      const close = move || score ? ')' : ''
      return `${date}: submitted a quick take${move}${score}${close}`
    }
    case 'cue_click': {
      const cta = typeof p.cta === 'string' && p.cta ? ` "${p.cta}"` : ''
      const path = typeof p.path === 'string' && p.path ? ` on ${p.path}` : ''
      return `${date}: took Hatch's suggestion${cta}${path}`
    }
    default: {
      const detail = typeof p.summary === 'string' && p.summary ? `: ${p.summary.slice(0, 80)}` : ''
      return `${date}: ${row.kind.replace(/_/g, ' ')}${topic ? ` on ${topic}` : ''}${detail}`
    }
  }
}

/**
 * Returns a compact, prompt-ready summary of the user's recent Hatch
 * interactions, or null when there is nothing to say. Capped at ~600 chars.
 */
export async function getRecentHatchInteractions(
  userId: string,
  limit = 10
): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('hatch_interactions')
      .select('kind, payload, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data?.length) return null

    const lines: string[] = []
    let used = 0
    for (const row of data as HatchInteractionRow[]) {
      const line = `- ${describe(row)}`
      if (used + line.length + 1 > MAX_BLOCK_CHARS) break
      lines.push(line)
      used += line.length + 1
    }
    if (!lines.length) return null
    return lines.join('\n')
  } catch (error) {
    logger.warn('[hatch-interactions] fetch failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
